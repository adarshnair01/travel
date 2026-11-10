# Story Desk (local admin)

Type a place, and a desk of agents (Gemini for the judgement calls, a local model on this Mac for the legwork, both with web search) researches it, writes it up in the blog's fixed layout,
argues about it, and hands you a draft for `posts/`.

**Local only.** The server listens on `127.0.0.1` and rejects any request whose Host or Origin isn't
localhost. It lives outside `site/`, so the build and GitHub Pages never include it.

## Run it

```bash
cd generator
cp .env.example .env       # optional: paste a GEMINI_API_KEY
npm start                  # http://localhost:4400
```

No npm dependencies (Node 22+). `npm run mock` runs the whole flow with canned output and no model calls.

To preview a saved draft on the real site, run `npm run dev` in `site/`. Drafts show there with a
"Draft" badge but never appear in the production build.

## Who does what

Pick a mode on the admin page:

| Mode | Uses | Limits | Speed |
| --- | --- | --- | --- |
| **Hybrid** (default) | Gemini for research, review and the final edit; Gemma on this Mac for scouting, fun facts, writing and editing | About 10 Gemini calls a post; the local model takes over if Gemini runs out | 20–60 min (most of it local writing and polishing) |
| **Local** | Gemma 4 12B on this Mac via Ollama for everything | None, fully private | 25–70 min |
| **Gemini** | Gemini only | Free daily quota | 5–15 min |

**Web search.** The Researcher, Offbeat Scout and Fun Desk each run a few targeted searches (ticket prices and
timings for this year, how to get there, where to eat, lesser-known places, facts and legends). The results
are added to their notes whichever model answers, so local agents work from current data too. Set one free key
in `.env`:

- `OLLAMA_API_KEY`: Ollama web search, free with an Ollama account ([keys](https://ollama.com/settings/keys)).
- `TAVILY_API_KEY`: Tavily, 1,000 free credits a month, no card ([app.tavily.com](https://app.tavily.com)).

A post uses about 10 searches. Without a key the desk still runs on Wikivoyage and Wikipedia, which are free
but less current. On the Gemini side, the Researcher also tries Google Search grounding where the free tier allows it.

**Keeping Gemini cheap.** A Hybrid post typically costs 4–7 Gemini requests and about 20–35k input
tokens, all on Flash-Lite except the grounded research call. The admin page shows the exact cost when a post finishes.
- Hidden "thinking" is switched off (`thinkingBudget: 0` / `thinkingLevel: "minimal"`); it roughly doubled
  2.5-flash's output for no gain on these jobs.
- JSON replies are constrained by a schema (`responseJsonSchema`) and capped (`maxOutputTokens`), so there are
  no invalid-JSON retries and no runaway outputs.
- Prompts put the stable part (instructions, brief, notes) first and the changing draft last, so Gemini's
  automatic prompt caching can reuse them across review rounds.
- The Final Editor gets an outline (headings and first lines), not the whole story.
- Grounded search only goes to models that can search on the free tier, and is skipped when web search results
  are already in the prompt.
- Anything code can check or fix is handled locally before a paid review: the automatic checks (fixed by the
  local editor), the budget row (repaired in code), the same place appearing in two sections, and so on.
- The same draft is never reviewed twice, and the loop stops after 2 rounds without improvement.
- A passing review gets one confirming second review (scores averaged) before approval, because a single
  Flash-Lite review sometimes waves a draft through.

**Free sources, always.** The 📚 Librarian pulls the destination's Wikivoyage guide, its Wikipedia article
and every Wikipedia place within 10 km through the public MediaWiki APIs.

**The local model** is `gemma4:12b-it-qat` (7 GB, set by `OLLAMA_MODEL`). It needs the Ollama app running.
Context is set to 16k (`OLLAMA_CTX`) so the research notes fit.

## Keeping quality up on a small model

- **Section groups.** The writer and editor work on 3–5 sections at a time, with the story so far for
  continuity, rather than the whole post in one go.
- **Structured output.** Every JSON reply is constrained by a schema, so the layout can't drift.
- **Automatic checks** (`lint()` in `layout.mjs`, marked 🤖 in reviews): empty sections, generic travel
  phrases, wrong item counts (6–8 things to do, 4–6 offbeat places, 6–8 facts…), missing table rows or
  totals, itinerary days vs trip length, section lengths, one-line items in Top things / Off the beaten path,
  food bullets that aren't real dishes ("Street snacks", "Hydration"), a daily budget that disagrees with
  the cost table, repetitive sentence openings, leftover "(verify)".
- **Same notes for everyone.** Writer, editor and reviewer all see the same research (including Wikivoyage's
  Eat and Drink sections, passed through whole), so the reviewer doesn't "correct" real names as invented.
- **Scored rubric.** The reviewer scores facts (30%), usefulness (20%), offbeat and surprising content (20%),
  voice (15%) and first-hand notes (15%), quoting the words behind every issue. The overall score is computed
  in code, minus a penalty for anything the automatic checks still find.
- **Polish loop.** Review → targeted fixes → review, until the target score (default 9) with nothing major
  left. A version that scores worse is thrown away and the next fix starts from the best one. The loop stops
  at the round limit (default 6) or after 2 rounds without improvement, and ships the best version, saying
  plainly if it fell short of the target. With the local model doing the fixes, expect about 7.5–8 from the
  strict reviewer (gemini-2.5-flash): the last stretch to 9 is usually a quick human edit of what it lists.
- **Markdown clean-up** in code: tables repaired, em dashes removed.

## The desk

| Agent | Job |
| --- | --- |
| 📚 Librarian | Wikivoyage guide, Wikipedia background, places within 10 km (free, no model) |
| 🔎 Researcher | ☁️ Practical brief from web search + Wikivoyage: transport, areas, sights, food, costs, season |
| 🧭 Offbeat Scout | 💻 Lesser-known places and local secrets from web search + nearby places |
| 🎉 Fun Desk | 💻 Surprising facts, local phrases, legends from web search + Wikipedia |
| ✍️ Writer | 💻 Draft in four section groups, using only the desk's notes and yours |
| 🛠️ Editor | 💻 Full edit, then fixes whatever the reviewer and checks flag |
| 🧐 Reviewer | ☁️ Fact-checks against the notes and scores the rubric, every polish round |
| ✨ Final Editor | ☁️ Headline, description, tags, opening and closing (before the polish loop, so it's reviewed too) |

☁️ = Gemini in Hybrid mode, 💻 = local. Each card shows which model actually did the work, and 🔎 web when it had search results. Every run is saved to `generator/runs/`
(git-ignored) and can be reopened from **Past runs**.

## The fixed layout

Defined once in [`layout.mjs`](layout.mjs): Intro, At a glance, Why go, Getting there, Getting around,
Where to stay, Top things to do, Off the beaten path, Things you probably didn't know, What to eat,
A suggested itinerary, What it costs, Good to know, Final word, then Sources (Wikivoyage, Wikipedia and any search results).
The agents write JSON section by section and the Markdown is assembled from this list, so every post
has the same shape. The site styles "At a glance", "Off the beaten path" and "Things you probably didn't
know" specially.

## After saving

1. Read it. AI research can be wrong, especially prices and opening hours. Local-model drafts need a closer read than Gemini ones.
2. Add photos to `posts/images/<slug>/` and uncomment `cover:` in the front matter.
3. Remove `draft: true` and push.
