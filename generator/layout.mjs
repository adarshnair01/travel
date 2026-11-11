// The fixed layout every generated story follows. The writer, editors and reviewer
// all work section by section against this list, and the final Markdown is assembled
// from it, so every post has the same shape. Edit here to change the layout for all posts.

export const SECTIONS = [
  { id: "intro", heading: null, guide: "2–3 short paragraphs. Open with a vivid, specific scene or moment, then say who this place is for. No heading." },
  {
    id: "atAGlance",
    heading: "At a glance",
    guide:
      "A two-column Markdown table whose first two lines are exactly '| | |' and '| --- | --- |', then one row per item: Best time to go, Days you need, Getting there, Daily budget, Language, Currency, Good for. Rows look like '| Best time to go | Oct to Feb |'. Exactly these rows: Best time to go, Days you need, Getting there, Daily budget, Language, Currency, Good for. Keep each value under 15 words. Budgets in INR with a rough USD equivalent.",
  },
  { id: "whyGo", heading: "Why go", guide: "1–2 paragraphs on what makes this place worth the trip, concrete and specific, no clichés." },
  { id: "gettingThere", heading: "Getting there", guide: "From major Indian cities first (air/rail/road), then international if relevant. Nearest airport and station with names, typical travel times and fares." },
  { id: "gettingAround", heading: "Getting around", guide: "Local transport options with rough prices, apps that work, what to avoid." },
  { id: "whereToStay", heading: "Where to stay", guide: "3–4 areas or neighbourhoods as a bulleted list: **Area**: who it suits, price band. No specific hotel names unless very well known." },
  { id: "topThings", heading: "Top things to do", guide: "6–8 experiences as ### subheadings, each 50–100 words (3–5 sentences): what it is, what you actually see or do there, and a practical tip (timing, ticket price, how long, how to get there)." },
  { id: "offbeat", heading: "Off the beaten path", guide: "4–6 lesser-known places or experiences most visitors miss, as ### subheadings with 40–90 words each: what makes it worth it and how to get there (distance, transport)." },
  { id: "funFacts", heading: "Things you probably didn't know", guide: "6–8 surprising, verifiable facts as a bulleted list. Each starts with a **bold short hook.** then the fact. Playful but true." },
  { id: "food", heading: "What to eat", guide: "5–7 named dishes or drinks as a bulleted list: **Dish name**: what it is and where/when to try it. Every bullet names a real dish or drink (e.g. a specific curry, sweet or breakfast), never a category like \"street snacks\" or \"local flavours\", and never non-food advice like water." },
  { id: "itinerary", heading: "A suggested itinerary", guide: "Day-by-day plan matching 'Days you need': each day as ### Day N: theme, then Morning / Afternoon / Evening bullets." },
  { id: "costs", heading: "What it costs", guide: "A Markdown table | Item | Budget | Mid-range | for stay per night, food per day, local transport per day, entry fees, then a total per day row. INR." },
  { id: "tips", heading: "Good to know", guide: "6–8 practical bullets: safety, scams, etiquette, dress, connectivity, cash/cards, permits, seasons to avoid." },
  { id: "closing", heading: "Final word", guide: "One short paragraph that ties back to the opening scene and leaves the reader wanting to go." },
];

/**
 * Deterministic clean-up of model Markdown: repair tables (header/delimiter column counts must
 * match or GFM drops the table), remove em dashes (house style), normalise bullets.
 */
export function tidy(md, { keyValue = false } = {}) {
  const lines = String(md ?? "").replace(/\r/g, "").split("\n");
  const out = [];
  const cells = (l) => l.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
  const isDelim = (l) => /^\s*\|?\s*:?-{2,}/.test(l) && /^[\s|:-]+$/.test(l);
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\|/.test(lines[i])) {
      out.push(lines[i]);
      continue;
    }
    const block = [];
    while (i < lines.length && /^\s*\|/.test(lines[i])) block.push(lines[i++]);
    i--;
    let rows = block.filter((l) => !isDelim(l)).map(cells);
    // A header that is all blank ("| |") belongs to a key/value table like "At a glance".
    let header = rows[0];
    let body = rows.slice(1);
    const width = Math.max(...rows.map((r) => r.length));
    if (keyValue || header.every((c) => !c) || header.length < width) {
      if (!header.every((c) => !c)) body = rows; // the "header" was really the first data row
      header = Array(width).fill("");
    }
    const pad = (r) => [...r, ...Array(Math.max(0, width - r.length)).fill("")].slice(0, width);
    const row = (r) => `| ${pad(r).join(" | ")} |`;
    out.push(header.every((c) => !c) ? `|${" |".repeat(width)}` : row(header), `| ${Array(width).fill("---").join(" | ")} |`, ...body.map(row));
  }
  return out
    .join("\n")
    .replace(/(\*\*[^*\n]+\*\*)\s*[—–]\s*/g, "$1: ")
    .replace(/\s+—\s+/g, ", ")
    .replace(/—/g, ", ")
    .replace(/^(\s*)\*\s{1,4}(?=\S)/gm, "$1- ")
    .trim();
}

export const SECTION_IDS = SECTIONS.map((s) => s.id);

export function layoutBrief() {
  return SECTIONS.map((s, i) => `${i + 1}. "${s.id}"${s.heading ? ` (## ${s.heading})` : " (no heading)"}: ${s.guide}`).join("\n");
}

export function slugify(s) {
  return String(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const yaml = (v) => JSON.stringify(String(v ?? ""));

/** Turn the final post object into a Markdown file that matches posts/_template.md. */
export function toMarkdown(post, meta) {
  const front = [
    "---",
    `title: ${yaml(tidy(post.title))}`,
    `date: ${meta.date}`,
    `description: ${yaml(tidy(post.description))}`,
    `place: ${yaml(meta.place)}`,
    meta.country ? `country: ${yaml(meta.country)}` : null,
    meta.tripDates ? `tripDates: ${yaml(meta.tripDates)}` : null,
    `# Add a cover: put a photo in posts/images/${meta.slug}/ and uncomment.`,
    `# cover: ./images/${meta.slug}/cover.jpg`,
    `# coverAlt: ""`,
    `tags: [${(post.tags ?? []).map(yaml).join(", ")}]`,
    "draft: true # generated: review, add photos, then remove this line to publish",
    "---",
    "",
  ].filter((l) => l !== null);

  const body = SECTIONS.map((s) => {
    const text = tidy(post.sections?.[s.id], { keyValue: s.id === "atAGlance" });
    return s.heading ? `## ${s.heading}\n\n${text}` : text;
  });

  if (meta.sources?.length) {
    body.push(
      `## Sources\n\n${meta.sources
        .slice(0, 12)
        .map((src) => `- [${src.title || new URL(src.uri).hostname}](${src.uri})`)
        .join("\n")}${meta.sources.some((src) => /^Wiki(voyage|pedia):/.test(src.title)) ? "\n\n*Background material adapted from Wikivoyage and Wikipedia contributors, CC BY-SA 4.0.*" : ""}`,
    );
  }
  return `${front.join("\n")}\n${body.join("\n\n")}\n`;
}

/** Sections are written and edited in these groups, so even a small local model handles one manageable chunk at a time. */
export const GROUPS = [
  ["intro", "atAGlance", "whyGo", "gettingThere", "gettingAround"],
  ["whereToStay", "topThings", "offbeat"],
  ["funFacts", "food", "itinerary"],
  ["costs", "tips", "closing"],
];

/** Phrases that make travel writing sound generic. The lint flags them; the editors rewrite them. */
export const BANNED = [
  "hidden gem", "paradise", "nestled", "tapestry", "vibrant", "bustling", "must-visit", "must visit", "breathtaking",
  "painting the sky", "painted the sky", "suspended in time", "step back in time", "steeped in history", "rich history",
  "a feast for the senses", "something for everyone", "off the beaten track", "captivat", "mesmeriz", "mesmeris",
  "awe-inspiring", "a testament to", "testament to", "whisper", "unforgettable", "embark", "delve", "plethora",
  "myriad", "bucket list", "picture-perfect", "postcard", "symphony", "in conclusion", "nature's", "boasts",
  "truly", "a true", "unique blend", "melting pot", "time stands still", "a world away", "journey through",
];

const words = (s) => (String(s ?? "").match(/\S+/g) ?? []).length;
const count = (s, re) => (String(s ?? "").match(re) ?? []).length;

/**
 * Repairs that need no model at all. Returns a list of what changed.
 * - "At a glance" daily budget is rewritten from the cost table's total row when they disagree.
 */
export function repair(sections) {
  const changed = [];
  const rupees = (t) => (String(t).match(/₹\s?[\d,]+|INR\s?[\d,]+|\b\d{1,3}(?:,\d{3})+\b|\b\d{3,6}\b/g) ?? []).map((x) => Number(x.replace(/[^\d]/g, ""))).filter((n) => n >= 100);
  const lines = String(sections?.atAGlance ?? "").split("\n");
  const i = lines.findIndex((l) => /daily budget/i.test(l));
  const totalRow = String(sections?.costs ?? "").split("\n").find((l) => /total/i.test(l)) ?? "";
  const t = rupees(totalRow);
  if (i >= 0 && t.length) {
    const g = rupees(lines[i]);
    const [lo, hi] = [Math.min(...t), Math.max(...t)];
    const fits = g.length && t.every((n) => n >= Math.min(...g) * 0.8 && n <= Math.max(...g) * 1.2);
    if (!fits) {
      const inr = (n) => `₹${n.toLocaleString("en-IN")}`;
      const usd = (n) => `$${Math.round(n / 84)}`;
      lines[i] = `| Daily budget | ${lo === hi ? inr(lo) : `${inr(lo)} – ${inr(hi)}`} (about ${lo === hi ? usd(lo) : `${usd(lo)} – ${usd(hi)}`}) |`;
      sections.atAGlance = lines.join("\n");
      changed.push("atAGlance: daily budget set from the cost table totals");
    }
  }
  return changed;
}

/**
 * Deterministic quality checks. Runs on every draft regardless of model, and its issues go to the
 * editor alongside the reviewer's, so structure and style don't depend on how sharp the model is.
 * @returns {{section: string, severity: "major"|"minor", problem: string, fix: string}[]}
 */
export function lint(sections, { days } = {}) {
  const issues = [];
  const add = (section, severity, problem, fix) => issues.push({ section, severity, problem, fix, source: "lint" });
  const s = (id) => String(sections?.[id] ?? "");

  for (const { id, heading } of SECTIONS) {
    if (!s(id).trim()) add(id, "major", `"${heading ?? "Intro"}" is empty.`, "Write this section following the layout guide.");
  }

  for (const { id } of SECTIONS) {
    const t = s(id).toLowerCase();
    const hits = BANNED.filter((p) => t.includes(p));
    if (hits.length) add(id, ["intro", "closing", "whyGo"].includes(id) ? "major" : "minor", `Generic phrasing: ${hits.map((h) => `"${h}"`).join(", ")}.`, "Replace with a concrete detail: a name, a number, a sound, a price, a time of day.");
    if (/\(verify\)/i.test(s(id))) add(id, "minor", 'Contains a "(verify)" marker.', "Remove the marker; state the detail as approximate (\"around\", \"roughly\") or drop it.");
    if (/as an ai|i cannot|i can't provide|language model/i.test(t)) add(id, "major", "Contains assistant boilerplate.", "Rewrite as part of the story.");
  }

  const glance = s("atAGlance").toLowerCase();
  const missingRows = ["best time", "days you need", "getting there", "daily budget", "language", "currency", "good for"].filter((k) => !glance.includes(k));
  if (s("atAGlance") && missingRows.length) add("atAGlance", "major", `Table is missing rows: ${missingRows.join(", ")}.`, "Use exactly the seven rows from the layout guide.");

  const between = (id, re, lo, hi, what) => {
    const n = count(s(id), re);
    if (s(id) && (n < lo || n > hi)) add(id, n < lo ? "major" : "minor", `Has ${n} ${what}; the layout asks for ${lo}–${hi}.`, `${n < lo ? "Add" : "Trim to"} ${lo}–${hi} ${what}, each specific and useful.`);
  };
  between("topThings", /^###\s/gm, 6, 8, "experiences (### subheadings)");
  between("offbeat", /^###\s/gm, 4, 6, "offbeat places (### subheadings)");
  between("funFacts", /^\s*[-*]\s/gm, 6, 8, "facts (bullets)");
  between("food", /^\s*[-*]\s/gm, 5, 7, "dishes (bullets)");
  between("tips", /^\s*[-*]\s/gm, 6, 8, "tips (bullets)");
  if (days) between("itinerary", /^###\s*Day/gim, Number(days), Number(days), "days (### Day N)");
  else between("itinerary", /^###\s*Day/gim, 1, 10, "days (### Day N)");

  if (s("costs") && !/\|/.test(s("costs"))) add("costs", "major", "Costs are not in a table.", "Use the | Item | Budget | Mid-range | table from the layout.");
  else if (s("costs") && !/total/i.test(s("costs"))) add("costs", "major", "Cost table has no total row.", "Add a **Total per day** row that adds up the rows above.");

  // "At a glance" budget must agree with the cost table's totals.
  const rupees = (t) => (String(t).match(/₹\s?[\d,]+|INR\s?[\d,]+|\b\d{1,3}(?:,\d{3})+\b|\b\d{3,6}\b/g) ?? []).map((x) => Number(x.replace(/[^\d]/g, ""))).filter((n) => n >= 100);
  const budgetRow = s("atAGlance").split("\n").find((l) => /daily budget/i.test(l)) ?? "";
  const totalRow = s("costs").split("\n").find((l) => /total/i.test(l)) ?? "";
  const [g, t] = [rupees(budgetRow), rupees(totalRow)];
  if (g.length && t.length) {
    const lo = Math.min(...g) * 0.8, hi = Math.max(...g) * 1.2;
    const off = t.filter((n) => n < lo || n > hi);
    if (off.length) add("atAGlance", "major", `"Daily budget" (${budgetRow.split("|").filter(Boolean).pop()?.trim()}) doesn't match the cost table totals (${t.map((n) => `₹${n.toLocaleString("en-IN")}`).join(" / ")}).`, "Make the daily budget range run from the budget total to the mid-range total in \"What it costs\".");
  }

  const len = (id, lo, hi) => {
    const n = words(s(id));
    if (!s(id) || (n >= lo && n <= hi)) return;
    // Well short of the target is major, so it blocks approval and the fixer has to deal with it.
    const severity = n < lo * 0.75 ? "major" : "minor";
    const goal = Math.round((lo + Math.min(hi, lo * 2)) / 2);
    add(id, severity, `${n} words; aim for ${lo}–${hi}.`, n < lo
      ? `Expand to about ${goal} words (roughly ${goal - n} more) using specific details from the notes: names, prices, timings, distances, what you see. Don't pad with adjectives or repeat other sections.`
      : `Cut to under ${hi} words: remove filler and repetition.`);
  };
  // Items in "Top things" and "Off the beaten path" that are only a line or two.
  const thinItems = (id, min) => {
    const items = s(id).split(/^###\s+/m).slice(1).map((b) => ({ name: b.split("\n")[0].trim(), n: words(b.split("\n").slice(1).join(" ")) }));
    const thin = items.filter((x) => x.n < min);
    if (thin.length) add(id, thin.length >= 3 ? "major" : "minor", `${thin.length} item(s) are too thin: ${thin.map((x) => `"${x.name}" (${x.n} words)`).join(", ")}.`, `Give each of these at least ${min} words: what you actually see or do, plus a practical detail (price, timing, how to get there) from the notes.`);
  };
  thinItems("topThings", 45);
  thinItems("offbeat", 35);

  // The same place in "Top things" and "Off the beaten path" (the reviewer kept catching this; code can).
  const names = (id) => (s(id).match(/^###\s+(.+)$/gm) ?? []).map((h) => h.replace(/^###\s+/, "").trim());
  const key = (n) => n.toLowerCase().replace(/\(.*?\)|[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 3 && !/^(temple|walk|ride|visit|sunset|hill|lake|trip|tour|village|river)$/.test(w)).sort().join(" ");
  const top = new Map(names("topThings").map((n) => [key(n), n]));
  const dupes = names("offbeat").filter((n) => key(n) && top.has(key(n)));
  if (dupes.length) add("offbeat", "major", `Also in "Top things to do": ${dupes.map((d) => `"${d}"`).join(", ")}.`, "Replace each with a different lesser-known place from the OFFBEAT FINDS notes.");

  // The same passage in two sections (e.g. the sunset described in the intro, Top things and the Final word).
  const shingles = (t) => {
    const w = String(t).toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
    const out = new Set();
    // Skip runs with numbers: "about 3.5 km from the main town" repeating is fine.
    for (let i = 0; i + 7 <= w.length; i++) if (!w.slice(i, i + 7).some((x) => /\d/.test(x))) out.add(w.slice(i, i + 7).join(" "));
    return out;
  };
  const sh = Object.fromEntries(SECTIONS.map(({ id }) => [id, shingles(s(id))]));
  const reported = new Set();
  for (const a of SECTIONS) {
    for (const b of SECTIONS) {
      if (a.id >= b.id || reported.has(b.id)) continue;
      const shared = [...sh[a.id]].filter((x) => sh[b.id].has(x));
      if (shared.length >= 2) {
        reported.add(b.id);
        add(b.id, "minor", `Repeats wording from "${a.heading ?? "Intro"}": "…${shared[0]}…".`, `Rewrite this part so it adds something new instead of repeating "${a.heading ?? "Intro"}".`);
      }
    }
  }

  // Food bullets must name actual dishes, not categories or general advice.
  const GENERIC_FOOD = /\b(local|village|street|regional|traditional|authentic|temple|south indian|indian)?\s*(flavou?rs?|snacks?|treats|eats|food|cuisine|meals?|dishes|produce|fare|delicacies|specialit(?:y|ies))\b|hydrat|\bwater\b|\bstation\b/i;
  const labels = (s("food").match(/^\s*[-*]\s+\*\*([^*]+)\*\*/gm) ?? []).map((l) => l.replace(/^\s*[-*]\s+\*\*|\*\*$/g, "").trim());
  const DISH = /\b(thali|dosa|idli|vada|biryani|curry|kofta|chai|coffee|lassi|roti|paratha|sambar|rasam|halwa|payasam|bhaji|bajji|poha|upma|pakora|samosa|chutney|dal|paneer|masala|pizza|falafel|pancake|smoothie|juice|toddy|feni|beer|tea|kulfi|jalebi|ladoo|laddu|mysore pak|bisi bele|ragi|mudde|neer|appam|puttu|fish|prawn|thukpa|momo)\b/i;
  const vague = labels.filter((l) => (GENERIC_FOOD.test(l) || /refreshment|sweets|drinks?\b|bites|treats/i.test(l)) && l.split(/\s+/).length <= 5 && !DISH.test(l));
  if (vague.length) add("food", "major", `Not real dishes: ${vague.map((v) => `"${v}"`).join(", ")}.`, "Replace each with a named dish or drink from the notes (what it is, where to try it). Look in the notes for dish names (Wikivoyage's Eat section usually has them).");
  if (/\bauthentic\b|local eateries|regional dishes|local treats/i.test(s("food"))) add("food", "minor", 'Vague food wording ("authentic", "local eateries", "regional dishes").', "Name the dish and, where the notes give one, the place.");

  len("intro", 60, 190);
  len("whyGo", 60, 240);
  len("gettingThere", 80, 380);
  len("topThings", 300, 900);
  len("offbeat", 180, 650);
  len("food", 90, 350);
  len("closing", 30, 130);

  // Same opener over and over reads as machine-written.
  for (const { id } of SECTIONS) {
    const starts = (s(id).match(/(?:^|[.!?]\s+)([A-Z][a-z]+)\b/g) ?? []).map((x) => x.replace(/^[.!?\s]+/, ""));
    const top = Object.entries(starts.reduce((m, w) => ((m[w] = (m[w] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0];
    if (top && starts.length >= 6 && top[1] / starts.length > 0.4) add(id, "minor", `${top[1]} of ${starts.length} sentences start with "${top[0]}".`, "Vary sentence openings.");
  }
  return issues;
}
