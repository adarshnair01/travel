// Routes each agent call to Gemini or the local Ollama model.
//
//   hybrid - Gemini for the important jobs (research, review, final edit), the local model for the
//            rest (scouting, fun facts, writing, editing). Gemini's free quota goes a long way and
//            the local model is never blocked. Default.
//   local  - Ollama only: unlimited, private, slower.
//   gemini - Gemini only: fails when the free daily quota is used up.
//
// Calls that ask for search get fresh web results added to their prompt first (search.mjs), whichever
// model answers. Gemini additionally grounds with Google Search where the free tier allows it.

import { generate as gemini, config as geminiConfig, usage as geminiUsage } from "./gemini.mjs";
import { ollamaGenerate, ollamaStatus, ollamaConfig } from "./ollama.mjs";
import { searchMany, searchStatus } from "./search.mjs";

export const MODES = {
  hybrid: "Hybrid: Gemini for research, review & final edit; local for the rest",
  local: "Local only: Gemma on this Mac (unlimited, private)",
  gemini: "Gemini only (stops at the free daily limit)",
};
export const normalizeMode = (m) => (m === "auto" ? "hybrid" : Object.hasOwn(MODES, m) ? m : "hybrid");

// After Gemini runs dry, skip it for a while instead of paying a failed request per agent.
let geminiPausedUntil = 0;
const QUOTA = /quota|exhausted|429|per day|not set/i;

export function geminiAvailable() {
  return !!geminiConfig.key && !geminiConfig.mock && Date.now() > geminiPausedUntil;
}

/**
 * @param {object} o  same as gemini.generate plus {mode, important, queries, schema, maxTokens}
 *   important: this job goes to Gemini in hybrid mode
 *   queries:   web searches to run first when o.search is set; results are added to the prompt
 * @returns {Promise<{text, data?, sources, queries, model, provider, grounded?, tokens?, web?}>}
 */
export async function llm(o) {
  const mode = normalizeMode(o.mode);
  if (geminiConfig.mock) return { ...(await gemini(o)), provider: "mock" };

  // Fresh web results for jobs that need current data.
  let web = null;
  if (o.search && o.queries?.length) {
    web = await searchMany(o.queries, { signal: o.signal });
    if (web.errors.length && !web.block) o.onSearchError?.(web.errors[0]);
  }
  const prompt = web?.block
    ? `${o.prompt}

WEB SEARCH RESULTS (current; prefer these for prices, timings and recent changes, and don't use anything they don't support):
${web.block}`
    : o.prompt;
  const extra = { sources: web?.sources ?? [], webQueries: web?.block ? web.queries : [] };
  const merge = (r) => ({ ...r, sources: [...(r.sources ?? []), ...extra.sources], queries: [...(r.queries ?? []), ...extra.webQueries], web: !!web?.block });

  const wantGemini = mode === "gemini" || (mode === "hybrid" && o.important);
  if (wantGemini && geminiAvailable()) {
    try {
      // With fresh web results already in the prompt, Google grounding adds cost (a grounded request on
      // a different model, often with a 429 first) for little gain, so it's only used without them.
      return merge({ ...(await gemini({ ...o, prompt, search: o.search && !web?.block, model: o.model ?? geminiConfig.model })), provider: "gemini" });
    } catch (e) {
      if (o.signal?.aborted) throw e;
      if (mode === "gemini") throw e;
      if (QUOTA.test(e.message)) geminiPausedUntil = Date.now() + 60 * 60 * 1000;
      o.onFallback?.(e.message);
    }
  } else if (mode === "gemini") {
    throw new Error(geminiConfig.key ? "Gemini is paused after hitting its free quota. Switch to Hybrid or Local." : "GEMINI_API_KEY is not set.");
  }

  const r = await ollamaGenerate({
    system: o.system,
    prompt,
    json: o.json,
    schema: o.schema,
    temperature: o.temperature,
    maxTokens: o.maxTokens,
    signal: o.signal,
  });
  return merge({ ...r, provider: "local", grounded: o.search ? !!web?.block : undefined });
}

export async function providerStatus() {
  const o = await ollamaStatus();
  return {
    gemini: { configured: !!geminiConfig.key, available: geminiAvailable(), model: geminiConfig.model, mock: geminiConfig.mock, usage: geminiUsage },
    local: { running: o.ok, hasModel: o.hasModel, model: ollamaConfig.model, error: o.error },
    search: searchStatus(),
  };
}
