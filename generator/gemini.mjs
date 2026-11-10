// Minimal Gemini client: retries with backoff, Google Search grounding, JSON mode.
// GEN_MOCK=1 returns canned output so the pipeline and UI can be tested without a key.

const API = "https://generativelanguage.googleapis.com/v1beta";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const list = (v) => String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

export const config = {
  key: process.env.GEMINI_API_KEY ?? "",
  // "gemini-flash-lite-latest" always points at Google's newest Flash-Lite model.
  model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
  // Writing/editing can use a stronger model; defaults to `model`.
  writerModel: process.env.GEMINI_WRITER_MODEL || process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
  // The Reviewer is the quality gate, so it gets a stronger model. Flash-Lite scored drafts 9.6–10 that
  // 2.5-flash puts at about 8, missing repeated passages, an invented detail and unsupported prices.
  // It's 1–3 calls a post, so the extra cost is small. (gemini-flash-latest is as strict but was
  // returning 503 "high demand" on the free tier.) Falls back down the chain as usual.
  reviewModel: process.env.GEMINI_REVIEW_MODEL || "gemini-2.5-flash",
  // Tried in order when a model is overloaded (503), out of quota (429) or unavailable (404).
  fallbacks: list(process.env.GEMINI_FALLBACK_MODELS ?? "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-flash-latest,gemini-2.5-flash"),
  // Free-tier keys get Google Search grounding on these models only; tried for search calls
  // after the main chain. If none can search, research continues without web search.
  searchModels: list(process.env.GEMINI_SEARCH_MODELS ?? "gemini-2.5-flash"),
  mock: process.env.GEN_MOCK === "1",
};

// Models that hit a quota during this server's lifetime, so later calls skip them
// instead of burning a request on a guaranteed 429. Cleared when the server restarts.
const exhausted = new Set();
const noSearch = new Set();

export class GeminiError extends Error {}

// Token use for this server's lifetime, by model, so you can see what a post costs.
export const usage = { calls: 0, failed: 0, in: 0, cached: 0, out: 0, thoughts: 0, byModel: {} };
// Models that rejected a thinking setting; they get requests without one.
const noThinkingConfig = new Set();

/** Hidden "thinking" tokens are billed as output. Most desk jobs don't need them. */
function thinkingFor(model, thinking) {
  if (thinking === "default" || noThinkingConfig.has(model)) return undefined;
  if (/2\.5-pro/.test(model)) return { thinkingBudget: 128 }; // Pro can't switch thinking off
  if (/2\.5/.test(model)) return { thinkingBudget: thinking === "low" ? 1024 : 0 };
  // Gemini 3.x and the -latest aliases: Flash-Lite accepts "minimal"; full Flash only goes down to "low".
  return { thinkingLevel: thinking === "low" || !/lite/.test(model) ? "low" : "minimal" };
}

/**
 * @param {object} o
 * @param {string} o.system   system instruction (the agent's role)
 * @param {string} o.prompt   user turn. Put stable material (notes) BEFORE what changes (the draft):
 *                            Gemini caches repeated prompt prefixes automatically and bills them at a discount.
 * @param {boolean} [o.search] enable Google Search grounding
 * @param {boolean} [o.json]   ask for a JSON response and parse it
 * @param {object} [o.schema]  JSON schema for the response (fewer invalid-JSON retries, tighter output)
 * @param {number} [o.maxTokens] output cap
 * @param {"off"|"low"|"default"} [o.thinking] "off" (default) disables hidden thinking where the model allows; "low" allows a little (for judging)
 * @param {string} [o.model]
 * @param {number} [o.temperature]
 * @param {AbortSignal} [o.signal]
 * @returns {Promise<{text: string, data?: any, sources: {uri: string, title: string}[], queries: string[], model: string, tokens: object}>}
 */
export async function generate({ system, prompt, search = false, json = false, schema, maxTokens = 8192, thinking = "off", model = config.model, temperature = 0.7, signal }) {
  if (config.mock) return mockGenerate({ system, json, search });
  if (!config.key) throw new GeminiError("GEMINI_API_KEY is not set. Add it to generator/.env and restart.");

  const bodyFor = (withSearch) => (m) => {
    const think = thinkingFor(m, thinking);
    return {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
        // Grounded calls can't use JSON mode; everything else gets the schema when there is one.
        ...(json && !withSearch ? { responseMimeType: "application/json", ...(schema ? { responseJsonSchema: schema } : {}) } : {}),
        ...(think ? { thinkingConfig: think } : {}),
      },
      ...(withSearch ? { tools: [{ google_search: {} }] } : {}),
    };
  };

  const chain = [...new Set([model, ...config.fallbacks])];
  if (search) {
    // Only models known to ground on this key. Trying the whole chain first cost up to five
    // guaranteed-429 requests per server start, each counted against the daily request quota.
    const searchChain = config.searchModels.filter((m) => !noSearch.has(m) && !exhausted.has(m));
    try {
      if (searchChain.length) return { ...(await callChain(searchChain, bodyFor(true), { json, signal, search: true })), grounded: true };
    } catch (e) {
      if (signal?.aborted) throw e;
    }
    // No model could search on this key right now: answer from the model's own knowledge.
    const out = await callChain(chain.filter((m) => !exhausted.has(m)), bodyFor(false), { json, signal, search: false });
    return { ...out, grounded: false };
  }
  return callChain(chain.filter((m) => !exhausted.has(m)), bodyFor(false), { json, signal, search: false });
}

function record(m, u, ok) {
  usage.calls++;
  if (!ok) usage.failed++;
  const t = { in: u?.promptTokenCount ?? 0, cached: u?.cachedContentTokenCount ?? 0, out: u?.candidatesTokenCount ?? 0, thoughts: u?.thoughtsTokenCount ?? 0 };
  for (const k of ["in", "cached", "out", "thoughts"]) usage[k] += t[k];
  const b = (usage.byModel[m] ??= { calls: 0, failed: 0, in: 0, cached: 0, out: 0, thoughts: 0 });
  b.calls++;
  if (!ok) b.failed++;
  for (const k of ["in", "cached", "out", "thoughts"]) b[k] += t[k];
  return t;
}

async function callChain(chain, bodyFor, { json, signal, search }) {
  if (!chain.length) throw new GeminiError("Every configured Gemini model is out of quota for today. Try again later or add billing in Google AI Studio.");
  let lastErr;
  // Requests this call spent, including failed ones: every request counts against the free tier's daily limit.
  const spent = { requests: 0, in: 0, cached: 0, out: 0, thoughts: 0 };
  const add = (t) => { for (const k of ["in", "cached", "out", "thoughts"]) spent[k] += t[k]; };
  for (const m of chain) {
    for (let attempt = 0; attempt < 3; attempt++) {
      let res;
      try {
        spent.requests++;
        res = await fetch(`${API}/models/${m}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": config.key },
          body: JSON.stringify(bodyFor(m)),
          signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(240_000)]) : AbortSignal.timeout(240_000),
        });
      } catch (e) {
        if (signal?.aborted) throw e;
        record(m, null, false);
        lastErr = new GeminiError(`${m}: ${e.message}`);
        await sleep(2000 * 2 ** attempt);
        continue;
      }

      if (res.status === 400 && !noThinkingConfig.has(m)) {
        const info = await res.json().catch(() => ({}));
        record(m, null, false);
        if (/think/i.test(info.error?.message ?? "") || bodyFor(m).generationConfig.thinkingConfig) {
          // This model doesn't accept the thinking setting: remember that and retry without it.
          noThinkingConfig.add(m);
          lastErr = new GeminiError(`${m} 400: ${info.error?.message ?? "bad request"}`);
          continue;
        }
        throw new GeminiError(`${m} 400: ${info.error?.message ?? res.statusText}`);
      }
      if (res.status === 404) {
        record(m, null, false);
        lastErr = new GeminiError(`${m} is not available to this key`);
        exhausted.add(m);
        break; // next model
      }
      if (res.status === 429 || res.status >= 500) {
        const info = await res.json().catch(() => ({}));
        record(m, null, false);
        const msg = info.error?.message ?? res.statusText;
        lastErr = new GeminiError(`${m} ${res.status}: ${msg.split("\n")[0]}`);
        if (res.status === 429 && /quota/i.test(msg)) {
          // A per-day limit blocks the model entirely; otherwise it's search that isn't allowed.
          if (/per day|PerDay/i.test(msg + JSON.stringify(info.error?.details ?? ""))) exhausted.add(m);
          else if (search) noSearch.add(m);
          break; // next model
        }
        // Overloaded ("high demand"): one quick retry, then the next model, rather than three slow attempts.
        if (res.status === 503 && attempt >= 1) break;
        const retry = info.error?.details?.find((d) => d.retryDelay)?.retryDelay;
        if (attempt < 2) await sleep(Math.min(20_000, retry ? parseFloat(retry) * 1000 + 500 : 2500 * 2 ** attempt));
        continue;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        record(m, null, false);
        throw new GeminiError(`${m} ${res.status}: ${data.error?.message ?? res.statusText}`);
      }
      add(record(m, data.usageMetadata, true));

      const cand = data.candidates?.[0];
      const text = (cand?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      if (!text) {
        lastErr = new GeminiError(`${m}: empty response (finishReason: ${cand?.finishReason ?? data.promptFeedback?.blockReason ?? "unknown"})`);
        continue;
      }
      const gm = cand.groundingMetadata ?? {};
      const sources = (gm.groundingChunks ?? []).map((c) => c.web).filter(Boolean).map((w) => ({ uri: w.uri, title: w.title ?? "" }));
      const out = { text, sources, queries: gm.webSearchQueries ?? [], model: m, tokens: spent };
      if (json) {
        try {
          out.data = parseJson(text);
        } catch {
          lastErr = new GeminiError(`${m}: returned invalid JSON${cand.finishReason === "MAX_TOKENS" ? " (hit the output cap)" : ""}`);
          continue;
        }
      }
      return out;
    }
  }
  throw lastErr ?? new GeminiError("Gemini request failed");
}

function parseJson(text) {
  const t = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
  return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
}

export async function listModels() {
  if (config.mock) return ["mock"];
  if (!config.key) return [];
  const res = await fetch(`${API}/models?pageSize=200`, { headers: { "x-goog-api-key": config.key } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new GeminiError(data.error?.message ?? res.statusText);
  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes("generateContent") && m.name.includes("gemini"))
    .map((m) => m.name.replace(/^models\//, ""));
}

/** Grounding links are Google redirect URLs; resolve them to the real page for the Sources list. */
export async function resolveSource(uri) {
  if (!/grounding-api-redirect|vertexaisearch/.test(uri)) return uri;
  try {
    const res = await fetch(uri, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(6000) });
    return res.headers.get("location") || uri;
  } catch {
    return uri;
  }
}

// ---------------------------------------------------------------- mock
async function mockGenerate({ system, json, search }) {
  await sleep(400);
  const role = system.split("\n")[0];
  const sources = search ? [{ uri: "https://example.com/guide", title: "example.com" }] : [];
  if (!json) return { text: `### Mock notes (${role})\n\n- Fact one about the place.\n- Fact two.\n- Fact three.`, sources, queries: search ? ["mock query"] : [], model: "mock", grounded: search };
  if (/reviewer/i.test(role)) {
    const n = (mockGenerate.reviews = (mockGenerate.reviews ?? 0) + 1);
    // Rubric that improves, dips once (to exercise the rollback), then reaches the top.
    const v = [7, 8.2, 7.6, 9.6, 10][Math.min(n - 1, 4)];
    const scores = { facts: v, usefulness: v, discovery: v, voice: v, firstHand: v };
    const data = { scores, summary: v >= 9.5 ? "Ready." : "Needs fixes.", issues: v >= 9.5 ? [] : [{ section: "costs", severity: "major", quote: "Totals", problem: "Totals don't add up.", fix: "Recompute the daily total." }] };
    return { text: JSON.stringify(data), data, sources, queries: [] };
  }
  const { SECTIONS } = await import("./layout.mjs");
  const sections = Object.fromEntries(
    SECTIONS.map((s) => [
      s.id,
      s.id === "atAGlance"
        ? "| | |\n| --- | --- |\n| Best time to go | Oct–Mar |\n| Days you need | 3 |\n| Getting there | Fly to the nearest airport |\n| Daily budget | ₹3,000 (~$36) |\n| Language | Local |\n| Currency | INR |\n| Good for | Slow travel |"
        : s.id === "funFacts"
          ? "- **A hook.** A mock surprising fact.\n- **Another hook.** A second one."
          : `Mock content for ${s.heading ?? "the intro"}, written by: ${role}.`,
    ]),
  );
  const data = { title: "A mock story about somewhere lovely", description: "Mock description for the card and search.", tags: ["mock", "travel"], sections, changes: ["Mock change"] };
  return { text: JSON.stringify(data), data, sources, queries: [] };
}
