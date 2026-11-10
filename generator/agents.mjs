// The editorial desk: a team of agents that hand work to each other.
//
//   Librarian ─> Researcher ─┬─> Offbeat Scout ─┐
//                            └─> Fun Desk ──────┴─> Writer (4 section groups)
//     ─> Editor (group by group) ⇄ Reviewer + lint (targeted fixes, up to N rounds) ─> Final Editor
//
// The Librarian pulls free, unlimited sources (Wikivoyage, Wikipedia, nearby places). Research agents
// add Google Search when Gemini is available. Every agent can run on Gemini or the local model
// (see llm.mjs), and the deterministic lint in layout.mjs keeps structure and style in line either way.

import { llm, normalizeMode } from "./llm.mjs";
import { usage as geminiUsage, config as geminiConfig } from "./gemini.mjs";
import { gather } from "./research.mjs";
import { resolveSource } from "./gemini.mjs";
import { SECTIONS, SECTION_IDS, GROUPS, BANNED, toMarkdown, slugify, lint, repair } from "./layout.mjs";

export const AGENTS = {
  librarian: { name: "Librarian", icon: "📚", blurb: "Pulls Wikivoyage, Wikipedia and nearby places (free)" },
  researcher: { name: "Researcher", icon: "🔎", blurb: "Builds the practical brief from sources and search" },
  scout: { name: "Offbeat Scout", icon: "🧭", blurb: "Finds places and experiences most visitors miss" },
  fun: { name: "Fun Desk", icon: "🎉", blurb: "Digs up surprising facts, phrases and legends" },
  writer: { name: "Writer", icon: "✍️", blurb: "Drafts the story in the fixed layout" },
  editor: { name: "Editor", icon: "🛠️", blurb: "Tightens voice and accuracy, fixes flagged sections" },
  reviewer: { name: "Reviewer", icon: "🧐", blurb: "Fact-checks, scores and sends work back" },
  final: { name: "Final Editor", icon: "✨", blurb: "Headline, description, opening and closing" },
};

const byId = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

const VOICE = `House voice: a personal travel blog by an Indian traveller based in Bengaluru, written as "we".
- Warm, specific and practical. Short paragraphs (2–4 sentences). Concrete nouns: names of places, dishes, buses, prices, times.
- Show, don't gush: replace a verdict ("the views are breathtaking", "the food was amazing") with what you actually saw, heard or tasted, using details from the notes.
- Never use these phrases: ${BANNED.slice(0, 30).join(", ")}.
- No em dashes; use commas, colons or full stops. Indian English spelling. Prices in ₹, rough USD in brackets where useful.
- Don't invent first-hand experiences beyond our notes; for everything else write as practical advice ("you can", "go early").`;

const sectionSchema = (ids) => ({
  type: "object",
  properties: { sections: { type: "object", properties: Object.fromEntries(ids.map((id) => [id, { type: "string" }])), required: ids } },
  required: ["sections"],
});

// The reviewer scores a fixed rubric; the overall score is computed in code from it, so it moves for
// concrete reasons rather than the model's mood, and a 9 can't come from a vague "looks great".
const RUBRIC = {
  facts: { weight: 0.3, label: "Facts match the notes" },
  usefulness: { weight: 0.2, label: "Specific and useful (names, prices, times, distances)" },
  discovery: { weight: 0.2, label: "Offbeat places and surprising facts" },
  voice: { weight: 0.15, label: "Voice: concrete, no clichés or repetition" },
  firstHand: { weight: 0.15, label: "Our first-hand notes used and lived-in" },
};

const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    scores: { type: "object", properties: Object.fromEntries(Object.keys(RUBRIC).map((k) => [k, { type: "number" }])), required: Object.keys(RUBRIC) },
    summary: { type: "string" },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          section: { type: "string", enum: SECTION_IDS },
          severity: { type: "string", enum: ["major", "minor"] },
          quote: { type: "string" },
          problem: { type: "string" },
          fix: { type: "string" },
        },
        required: ["section", "severity", "quote", "problem", "fix"],
      },
    },
  },
  required: ["scores", "summary", "issues"],
};

/** Weighted rubric minus a penalty for what the automatic checks still find. */
function scoreOf(scores, lintIssues) {
  const clamp = (n) => Math.max(0, Math.min(10, Number(n) || 0));
  const base = Object.entries(RUBRIC).reduce((sum, [k, r]) => sum + clamp(scores?.[k]) * r.weight, 0);
  const penalty = Math.min(2, lintIssues.reduce((p, i) => p + (i.severity === "major" ? 0.4 : 0.1), 0));
  return Math.round(Math.max(0, base - penalty) * 10) / 10;
}

const FINAL_SCHEMA = {
  type: "object",
  properties: { title: { type: "string" }, description: { type: "string" }, tags: { type: "array", items: { type: "string" } }, intro: { type: "string" }, closing: { type: "string" } },
  required: ["title", "description", "tags", "intro", "closing"],
};

function brief(input) {
  return [
    `Place: ${input.place}${input.country ? `, ${input.country}` : ""}`,
    input.tripDates && `Our trip dates: ${input.tripDates}`,
    input.days && `Trip length: ${input.days} days`,
    input.notes && `Our own first-hand notes (use these; they are the most valuable material):\n${input.notes}`,
    input.tone && `Tone: ${input.tone}`,
  ]
    .filter(Boolean)
    .join("\n");
}

const guideFor = (ids) => ids.map((id) => `- "${id}"${byId[id].heading ? ` (## ${byId[id].heading})` : " (intro, no heading)"}: ${byId[id].guide}`).join("\n");
const clip = (s, n) => (s.length > n ? `${s.slice(0, n)}\n[…]` : s);
// Models sometimes repeat the section's own "## Heading" inside it; the layout adds it already.
const body = (id, v) => String(v ?? "").trim().replace(/^#{1,3}\s+(.+)\n+/, (m, h) => (h.trim().toLowerCase() === String(byId[id].heading ?? "").toLowerCase() ? "" : m)).trim();
// Headings plus the first sentence of each section: enough context for the headline and intro at a
// fraction of the tokens of the whole story.
const outline = (sections) =>
  SECTION_IDS.filter((id) => id !== "intro" && id !== "closing")
    .map((id) => `- ${byId[id].heading}: ${String(sections[id] ?? "").replace(/^[#|\-\s].*$/gm, "").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s/)[0]?.slice(0, 200) ?? ""}`)
    .join("\n");
const asMd = (sections, ids) => ids.map((id) => `${byId[id].heading ? `## ${byId[id].heading}` : "(Intro)"}\n${sections[id] ?? ""}`).join("\n\n");

/** The reviewer's prompt. Stable parts (instructions, brief, notes) first so Gemini can cache them across rounds. */
export function reviewPrompt(b, notes, sections) {
  return `Score this draft on each criterion from 0 to 10, then list every real problem.

${Object.entries(RUBRIC).map(([k, r]) => `- "${k}": ${r.label}`).join("\n")}

What the criteria mean:
- facts: every price, time, distance and name is supported by the NOTES or our first-hand notes. Wrong or unsupported claims are "major".
- usefulness: a reader could plan with it: specific prices, names, times, distances; nothing vague like "affordable" or "a short ride".
- discovery: "Off the beaten path" is genuinely lesser-known (not the top sights) and "Things you probably didn't know" would surprise someone who has read the Wikipedia intro.
- voice: concrete detail instead of verdicts; no travel clichés, no repeated sentences or paragraphs, varied openings.
- firstHand: our own notes (where we stayed, what we did, the highlight) are woven in and sound lived-in.

Scale for each criterion: 10 = nothing to fix; 9 = only a tiny nit; 8 = one or two small fixes; 7 = several fixable problems; 5 = generic or with clear errors; 3 = poor.
Rules:
- Each issue quotes the exact words it is about ("quote"), says what is wrong and gives a concrete fix.
- Before calling something unsupported, search the NOTES for it (including WHERE TO EAT AND DRINK). Only flag it if it's really not there.
- Don't pad the list with nits to look strict, and don't skip real problems to be kind. A criterion with no real problems scores 9–10.
- "major" = factual error, malformed section, repeated content, or generic writing in intro/offbeat/funFacts.
- At most 10 issues, most important first. Quotes under 15 words. Keep problem and fix to one sentence each.

Return JSON: {"scores": {${Object.keys(RUBRIC).map((k) => `"${k}": number`).join(", ")}}, "summary": "one sentence", "issues": [{"section": one of ${JSON.stringify(SECTION_IDS)}, "severity": "major"|"minor", "quote": "...", "problem": "...", "fix": "..."}]}

${b}

NOTES:
${notes}

DRAFT (score this):
${asMd(sections, SECTION_IDS)}`;
}

/**
 * Run the full desk for one place.
 * @param {object} input {place, country, tripDates, days, notes, tone, date, maxRounds, mode}
 * @param {(ev: object) => void} emit
 * @param {AbortSignal} signal
 */
export async function runDesk(input, emit, signal) {
  const mode = normalizeMode(input.mode);
  const sources = new Map();
  const addSources = (list) => list.forEach((s) => s.uri && !sources.has(s.uri) && sources.set(s.uri, s));
  const say = (agent, to, text) => emit({ type: "message", agent, to, text });

  // What this run spends. Gemini figures are the difference in the client's counters, so they include
  // failed and retried requests (each one counts against the free tier's daily request limit).
  const g0 = { ...geminiUsage };
  const local = { calls: 0, in: 0, out: 0 };
  const spend = () => ({
    gemini: Object.fromEntries(["calls", "failed", "in", "cached", "out", "thoughts"].map((k) => [k, geminiUsage[k] - g0[k]])),
    local: { ...local },
  });

  async function step(agent, opts, label) {
    emit({ type: "start", agent, label });
    const t0 = Date.now();
    try {
      const r = await llm({
        ...opts,
        mode,
        signal,
        onFallback: (why) => say(agent, "desk", `Gemini unavailable (${why.split(":").slice(-1)[0].trim().slice(0, 90)}). Switching to the local model.`),
        onSearchError: (why) => say(agent, "desk", `Web search failed (${why.slice(0, 90)}). Working from Wikivoyage/Wikipedia only.`),
      });
      addSources(r.sources ?? []);
      if (r.provider === "local") {
        local.calls++;
        local.in += r.tokens?.in ?? 0;
        local.out += r.tokens?.out ?? 0;
      }
      emit({ type: "done", agent, ms: Date.now() - t0, queries: r.queries, sourceCount: r.sources?.length ?? 0, model: r.model, provider: r.provider, grounded: r.grounded, web: r.web, tokens: r.tokens, label });
      return r;
    } catch (e) {
      emit({ type: "fail", agent, error: e.message });
      throw e;
    }
  }

  const b = brief(input);

  // 0. Library (free, unlimited) ----------------------------------------------------
  emit({ type: "start", agent: "librarian" });
  const t0 = Date.now();
  const lib = await gather(input.place, input.country, signal);
  addSources(lib.sources);
  emit({ type: "done", agent: "librarian", ms: Date.now() - t0, sourceCount: lib.sources.length, provider: "free" });
  say("librarian", "researcher, scout, fun", lib.found.length ? `Found: ${lib.found.join("; ")}.` : "Couldn't find Wikivoyage or Wikipedia pages for this place, so research relies on search and model knowledge. Expect more fact-checking.");

  const searchNote = "Use the WEB SEARCH RESULTS (and Google Search, if you have it) for current prices, timings and recent changes, and the source material for everything else. Never invent specifics.";
  // Search queries per agent. Specific, current-data queries beat generic ones.
  const where = [input.place, input.country].filter(Boolean).join(" ");
  const year = (String(input.tripDates).match(/20\d\d/) ?? [new Date().getFullYear()])[0];
  const Q = {
    researcher: [`${where} entry ticket prices timings ${year}`, `how to reach ${where} train bus ${year}`, `${where} where to eat restaurants`, `${where} travel tips ${year}`],
    scout: [`${where} offbeat places hidden gems locals`, `lesser known places near ${where}`, `${where} off the beaten path things to do`],
    fun: [`${where} interesting facts history trivia`, `${where} legends myths stories`, `${where} unusual facts you didn't know`],
  };

  // 1. Research -----------------------------------------------------------------------
  const research = await step("researcher", {
    search: true,
    important: true,
    queries: Q.researcher,
    temperature: 0.3,
    maxTokens: 2500,
    system: `Researcher. You are the research desk for a travel blog. You produce accurate, practical briefs and never invent facts, prices or names.`,
    prompt: `${b}

${searchNote}

Write a research brief in Markdown (600–900 words) with these headings: Overview, Best time & weather, Getting there (from Bengaluru, Delhi and Mumbai; nearest airport and railway station by name), Getting around, Areas to stay, Top sights & experiences (opening hours and ticket prices where known), Food & drink (named dishes and drinks, plus named places to eat with what to order there and rough prices; copy names exactly from the material), Typical costs in INR, Practical info (permits, safety, etiquette, connectivity, festivals).
Bullet points. Put "(approx.)" after any price or time that isn't from a current source.

SOURCE MATERIAL (Wikivoyage travel guide):
${clip(lib.guide || "(none found)", 10000)}`,
  });
  emit({ type: "artifact", agent: "researcher", title: "Research brief", markdown: research.text });
  say("researcher", "scout, fun", "Brief is up. I've covered the main sights, so look past them.");

  // 2. Offbeat + fun, in parallel ------------------------------------------------------
  const [scout, fun] = await Promise.all([
    step("scout", {
      search: true,
      queries: Q.scout,
      temperature: 0.6,
      maxTokens: 2500,
      system: `Offbeat Scout. You find real places and experiences most visitors to a destination miss: lesser-known temples, lakes, viewpoints, villages, walks, markets, workshops, seasonal events. Everything must come from the material or search, never invented.`,
      prompt: `${b}

${searchNote}

The research desk already covered these mainstream spots (do NOT repeat them):
${clip(research.text, 3500)}

List 6–8 offbeat places or experiences. For each: name, what it is, why it's worth it, distance/time from the main town, best time, one practical tip. Then 4 "local secrets" (small things regulars know). Markdown bullets.

PLACES WITHIN 10 KM (from Wikipedia, with distances):
${clip(lib.nearby || "(none found)", 6000)}

TRAVEL GUIDE (Wikivoyage, see "Do" and "Go next"):
${clip(lib.guide || "(none)", 6000)}`,
    }),
    step("fun", {
      search: true,
      queries: Q.fun,
      temperature: 0.7,
      maxTokens: 2500,
      system: `Fun Desk. You dig up delightful, surprising and true things about a place: odd history, records, etymology, legends, film or literature links, local customs, wildlife oddities, food origins. Only facts supported by the material or search.`,
      prompt: `${b}

${searchNote}

Find:
- 10 surprising "did you know" facts, one line each, that someone who has skimmed the Wikipedia intro would NOT already know
- 5 useful words or phrases in the local language, with pronunciation and meaning
- 3 playful, true anecdotes or legends
Markdown bullets.

BACKGROUND (Wikipedia):
${clip(lib.background || "(none found)", 12000)}`,
    }),
  ]);
  emit({ type: "artifact", agent: "scout", title: "Offbeat finds", markdown: scout.text });
  emit({ type: "artifact", agent: "fun", title: "Fun facts & quirks", markdown: fun.text });
  say("scout", "writer", "Off-the-beaten-path list is ready. Use at least 4 of these.");
  say("fun", "writer", "Fun facts are in. Pick the most surprising ones.");

  const ungrounded = [research, scout, fun].some((r) => r.grounded === false);
  // Each part is capped so the whole set (~14k chars, ~3.5k tokens) fits beside a full draft in a 16k-token local context.
  // Writer, editor and reviewer all get the same notes, so nobody flags a real fact as invented.
  const notes = `${ungrounded ? "NOTE: some research was done without live web search. Treat exact prices, timings and opening hours as approximate (\"around\", \"roughly\") and suggest checking before going.\n\n" : ""}RESEARCH BRIEF:\n${clip(research.text, 5000)}\n\nOFFBEAT FINDS:\n${clip(scout.text, 3500)}\n\nFUN FACTS & QUIRKS:\n${clip(fun.text, 2500)}${lib.eat ? `\n\nWHERE TO EAT AND DRINK (Wikivoyage; use these dish and restaurant names exactly):\n${clip(lib.eat, 3000)}` : ""}`;

  // 3. Draft, group by group -------------------------------------------------------------
  const draft = { title: input.place, description: "", tags: [], sections: Object.fromEntries(SECTION_IDS.map((id) => [id, ""])) };
  for (const [g, ids] of GROUPS.entries()) {
    const sofar = g ? `\nSTORY SO FAR (keep voice consistent, don't repeat it):\n${clip(asMd(draft.sections, GROUPS.slice(0, g).flat()), 5000)}\n` : "";
    const w = await step(
      "writer",
      {
        json: true,
        schema: sectionSchema(ids),
        temperature: 0.8,
        maxTokens: 4096,
        system: `Writer. You write long-form travel stories for a personal travel blog. ${VOICE}`,
        prompt: `${b}

Write these sections of the story, using ONLY facts from the desk's notes and our own notes.${ids.includes("intro") && input.notes ? " The intro MUST open on a moment from our own notes." : ""}
${guideFor(ids)}

Return JSON: {"sections": {${ids.map((id) => `"${id}": "Markdown"`).join(", ")}}}
Don't include a section's own ## heading; use ### only where the guide asks for sub-headings.
${sofar}
DESK NOTES:
${notes}`,
      },
      `part ${g + 1}/${GROUPS.length}`,
    );
    for (const id of ids) draft.sections[id] = body(id, w.data?.sections?.[id]);
    emit({ type: "draft", agent: "writer", round: 0, post: draft, markdown: preview(draft, input) });
  }
  say("writer", "editor", "First draft done, all four parts. Over to you.");

  // 4. Edit ⇄ review --------------------------------------------------------------------
  const edit = async (ids, instructions, round, label, temperature = 0.5) => {
    const e = await step(
      "editor",
      {
        json: true,
        schema: sectionSchema(ids),
        temperature,
        maxTokens: 4096,
        system: `Editor. You are a sharp travel-magazine editor. You improve sections without changing the fixed layout or adding facts that aren't in the notes. ${VOICE}`,
        prompt: `${instructions}

Layout guide for these sections:
${guideFor(ids)}

Return JSON: {"sections": {${ids.map((id) => `"${id}": "Markdown"`).join(", ")}}} with the full revised text of each section (no ## headings).

SECTIONS TO EDIT:
${asMd(draft.sections, ids)}

DESK NOTES (source of truth for facts):
${notes}`,
      },
      label,
    );
    for (const id of ids) {
      const v = body(id, e.data?.sections?.[id]);
      if (v) draft.sections[id] = v;
    }
    emit({ type: "draft", agent: "editor", round, post: draft, markdown: preview(draft, input) });
  };

  // Round 1: a full edit, group by group, including what the lint already found.
  {
    const found = lint(draft.sections, input);
    for (const [g, ids] of GROUPS.entries()) {
      const mine = found.filter((i) => ids.includes(i.section));
      await edit(
        ids,
        `Edit these sections of the Writer's first draft for accuracy against the notes, specificity and voice. Cut filler, tighten sentences, replace anything generic with a concrete detail.${mine.length ? `\nThe automatic checks also found:\n${mine.map((i) => `- [${i.section}] ${i.problem} → ${i.fix}`).join("\n")}` : ""}`,
        1,
        `part ${g + 1}/${GROUPS.length}`,
      );
    }
    say("editor", "reviewer", "Full edit done. Ready for review.");
  }

  // Small models "fix" a too-short section by rewording it at the same length, so spell out the numbers.
  const lengthTargets = (ids) => {
    const short = lint(draft.sections, input).filter((i) => ids.includes(i.section) && /words; aim for|too thin/.test(i.problem) && /^(Expand|Give)/.test(i.fix));
    if (!short.length) return "";
    return `\n\nLENGTH IS PART OF THE FIX. These sections are too short and must come back longer, not just reworded:\n${short
      .map((i) => `- ${i.section}: ${i.problem} ${i.fix}`)
      .join("\n")}\nAdd substance from the DESK NOTES (names, prices, timings, distances, what you see); don't invent facts.`;
  };

  // 5. Final Editor: headline, description, tags, and a polished intro + closing. This runs BEFORE the
  // polish loop so its changes get reviewed too (it used to run last, unreviewed, and could undo fixes).
  {
    const f = await step("final", {
      important: true,
      json: true,
      schema: FINAL_SCHEMA,
      temperature: 0.5,
      maxTokens: 1500,
      system: `Final Editor. You do the last pass before publishing. You never add new facts. ${VOICE}`,
      prompt: `Polish this story for publishing. Return JSON:
{"title": "under 65 characters, specific and inviting, includes the place name",
 "description": "under 155 characters, says what the reader gets",
 "tags": ["3–6 lowercase tags"],
 "intro": "the intro: 2–3 short paragraphs (70–160 words) that open on a specific moment FROM OUR NOTES, then say who this place is for. No paragraph repeats another.",
 "closing": "the 'Final word', polished so it echoes the opening moment"}

${b}

CURRENT INTRO:
${draft.sections.intro}

CURRENT FINAL WORD:
${draft.sections.closing}

OUTLINE OF THE REST (first lines of each section, for context):
${outline(draft.sections)}`,
    });
    const fd = f.data ?? {};
    draft.title = String(fd.title || draft.title).slice(0, 90);
    draft.description = String(fd.description || "").slice(0, 200);
    draft.tags = (Array.isArray(fd.tags) ? fd.tags : []).map((t) => String(t).toLowerCase().trim()).filter(Boolean).slice(0, 6);
    // Only accept a polished intro that's still substantial; small models sometimes cut it to a line or two.
    const wc = (t) => (String(t ?? "").match(/\S+/g) ?? []).length;
    if (wc(fd.intro) >= Math.min(60, wc(draft.sections.intro))) draft.sections.intro = String(fd.intro).trim();
    if (wc(fd.closing) >= Math.min(30, wc(draft.sections.closing))) draft.sections.closing = String(fd.closing).trim();
    emit({ type: "draft", agent: "final", round: 1, post: draft, markdown: preview(draft, input) });
    say("final", "reviewer", "Headline, intro and closing polished. Over to review.");
  }

  // 6. Polish loop: review → fix → review until the target score, keeping the best version ----------
  const target = Math.min(10, Math.max(6, Number(input.targetScore) || 9));
  const maxRounds = Math.min(12, Math.max(1, Number(input.maxRounds) || 6));
  const PATIENCE = 2; // stop after this many reviews in a row without a new best
  const snapshot = () => JSON.parse(JSON.stringify(draft));
  let best = null;
  let sinceBest = 0;
  let review = null;
  let fixFrom = null; // the review whose issues the next fix round works on

  const runReview = async (round) => {
    const r = await step("reviewer", {
      important: true,
      model: geminiConfig.reviewModel,
      json: true,
      schema: REVIEW_SCHEMA,
      temperature: 0.1,
      maxTokens: 2000,
      system: `Reviewer. You are a strict fact-checker and quality reviewer for a travel blog. You compare a draft against the research notes and report concrete, fixable problems. You are fair: you don't invent problems, and you don't wave real ones through.`,
      prompt: reviewPrompt(b, notes, draft.sections),
    });
    const modelIssues = (Array.isArray(r.data?.issues) ? r.data.issues : []).filter((i) => SECTION_IDS.includes(i.section));
    const lintIssues = lint(draft.sections, input);
    const issues = [...lintIssues, ...modelIssues];
    const score = scoreOf(r.data?.scores, lintIssues);
    return {
      round,
      score,
      scores: r.data?.scores ?? {},
      // Approval is decided in code: the target score and nothing major from the reviewer or the lint.
      approve: score >= target && !issues.some((i) => i.severity === "major"),
      summary: r.data?.summary ?? "",
      issues,
      lintCount: lintIssues.length,
    };
  };

  // Problems the automatic checks can see are fixed by the local editor before any (paid) review:
  // a Gemini review of a draft that fails the checks can't approve it anyway.
  const freeFixes = async (round) => {
    const fixed = repair(draft.sections);
    if (fixed.length) say("editor", "reviewer", `Fixed in code: ${fixed.join("; ")}.`);
    for (let pass = 0; pass < 2; pass++) {
      const majors = lint(draft.sections, input).filter((i) => i.severity === "major");
      if (!majors.length) return;
      const ids = [...new Set(majors.map((i) => i.section))].slice(0, 4);
      await edit(
        ids,
        `The automatic checks found these problems. Fix them, and keep everything else that works:\n${majors
          .filter((i) => ids.includes(i.section))
          .map((i) => `- [${i.section}] ${i.problem} → ${i.fix}`)
          .join("\n")}${lengthTargets(ids)}`,
        round,
        `round ${round} · automatic checks`,
      );
    }
  };
  const reviewed = new Set(); // drafts already scored: never pay to review the same text twice

  for (let round = 1; round <= maxRounds; round++) {
    await freeFixes(round);
    const version = JSON.stringify(draft.sections);
    if (reviewed.has(version)) {
      say("editor", "you", "The fixes didn't change anything, so another review would cost a call for nothing. Stopping here.");
      break;
    }
    reviewed.add(version);
    review = await runReview(round);
    if (review.approve) {
      // One review can be a lucky draw (we've seen a straight-10 pass on a draft that re-scores at 8).
      // Before approving, get a second opinion on the same text; the two scores are averaged.
      say("reviewer", "reviewer", `${review.score}/10 passes the target. Getting a second opinion before approving.`);
      const second = await runReview(round);
      const seen = new Set();
      const issues = [...review.issues, ...second.issues].filter((i) => {
        const key = `${i.section}|${i.source ?? ""}|${String(i.quote || i.problem).slice(0, 60)}`;
        return seen.has(key) ? false : seen.add(key);
      });
      const avg = (a, b) => Math.round(((Number(a) || 0) + (Number(b) || 0)) * 5) / 10;
      const score = avg(review.score, second.score);
      review = {
        ...review,
        score,
        scores: Object.fromEntries(Object.keys(RUBRIC).map((k) => [k, avg(review.scores[k], second.scores[k])])),
        issues,
        confirmed: true,
        approve: score >= target && !issues.some((i) => i.severity === "major"),
        summary: second.approve ? review.summary : second.summary,
      };
    }
    const improved = !best || review.score > best.review.score;
    if (improved) {
      best = { review, post: snapshot() };
      sinceBest = 0;
    } else sinceBest++;
    emit({ type: "review", agent: "reviewer", target, best: best.review.score, ...review });

    const rubric = Object.keys(RUBRIC).map((k) => `${k} ${review.scores[k] ?? "?"}`).join(", ");
    if (review.approve) {
      say("reviewer", "final", `Approved at ${review.score}/10 (target ${target}). ${rubric}. ${review.summary}`);
      break;
    }
    say(
      "reviewer",
      "editor",
      `${review.score}/10, target ${target}${improved ? "" : `; no better than the best so far (${best.review.score}), so I'm going back to that version`}. ${rubric}. ${review.issues.length} issue(s) (${review.lintCount} from the automatic checks). ${review.summary}`,
    );
    if (round === maxRounds) break;
    if (sinceBest >= PATIENCE) {
      say("reviewer", "you", `No improvement in ${PATIENCE} rounds, so the desk is stopping at its best version (${best.review.score}/10).`);
      break;
    }

    // A worse draft is thrown away: fixes always start from the best version and its review.
    if (!improved) Object.assign(draft, JSON.parse(JSON.stringify(best.post)));
    fixFrom = improved ? review : best.review;

    // Fix majors first; a small model handles a short list better than everything at once.
    const ordered = [...fixFrom.issues].sort((x, y) => (x.severity === y.severity ? 0 : x.severity === "major" ? -1 : 1));
    const flagged = [...new Set(ordered.map((i) => i.section))];
    for (let i = 0; i < flagged.length; i += 4) {
      const ids = flagged.slice(i, i + 4);
      await edit(
        ids,
        `The Reviewer sent these sections back (current score ${fixFrom.score}/10, target ${target}). Fix every issue listed, and keep everything else that works. If an issue says something isn't in the notes but the DESK NOTES do support it, keep it.\n${ordered
          .filter((x) => ids.includes(x.section))
          .map((x) => `- [${x.section}] (${x.severity})${x.quote ? ` "${String(x.quote).slice(0, 160)}":` : ""} ${x.problem} → ${x.fix}`)
          .join("\n")}${lengthTargets(ids)}`,
        round + 1,
        `round ${round + 1} · fixes ${Math.floor(i / 4) + 1}/${Math.ceil(flagged.length / 4)}`,
        // Retrying from the same version: vary the wording so it doesn't produce the same rewrite.
        improved ? 0.5 : 0.75,
      );
    }
    say("editor", "reviewer", `Fixed ${flagged.length} section(s): ${flagged.map((id) => byId[id].heading ?? "Intro").join(", ")}.`);
  }

  // Ship the best version the desk produced, not necessarily the last one.
  if (best && best.review !== review) {
    Object.assign(draft, JSON.parse(JSON.stringify(best.post)));
    review = best.review;
  }
  const reached = !!review.approve;
  const openMajors = review.issues.filter((i) => i.severity === "major").length;
  const remaining = lint(draft.sections, input);
  say(
    "final",
    "you",
    reached
      ? `Final cut is ready at ${review.score}/10 (target ${target}).${remaining.length ? ` The checks still note ${remaining.length} small thing(s).` : ""}`
      : review.score >= target && openMajors
        ? `Best version scores ${review.score}/10 but still has ${openMajors} major issue(s), so it isn't approved. See the last review; these usually need a quick human edit.`
        : `Best version is ${review.score}/10, short of the ${target} target after ${reviewed.size} review round(s). See the last review for what's left; these usually need a human edit or more source material.`,
  );

  // 6. Assemble ---------------------------------------------------------------------------
  const resolved = await Promise.all([...sources.values()].slice(0, 20).map(async (s) => ({ title: s.title, uri: await resolveSource(s.uri) })));
  const unique = [...new Map(resolved.map((s) => [s.uri, s])).values()];
  const markdown = preview(draft, input, unique);
  emit({ type: "final", agent: "final", post: draft, review, target, reached, usage: spend(), lint: remaining, markdown, slug: slugify(input.slug || input.place), sources: unique });
  return { post: draft, review, markdown };
}

function preview(post, input, sources = []) {
  return toMarkdown(post, {
    date: input.date,
    place: input.place,
    country: input.country,
    tripDates: input.tripDates,
    slug: slugify(input.slug || input.place),
    sources,
  });
}

export { SECTIONS };
// For calibration scripts.
export { REVIEW_SCHEMA, RUBRIC, brief, scoreOf };
