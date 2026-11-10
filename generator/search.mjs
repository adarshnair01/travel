// Web search for agents that run on the local model (and as a fresh-data top-up for Gemini).
// Uses whichever key is set in .env:
//   OLLAMA_API_KEY  - Ollama web search (free Ollama account): https://ollama.com/settings/keys
//   TAVILY_API_KEY  - Tavily (free 1,000 credits/month):       https://app.tavily.com
// With neither, agents fall back to Wikivoyage/Wikipedia only (still free, just less current).

const PROVIDERS = {
  ollama: {
    key: () => process.env.OLLAMA_API_KEY,
    label: "Ollama web search",
    async search(query, max, signal) {
      const res = await fetch("https://ollama.com/api/web_search", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, max_results: max }),
        signal,
      });
      if (!res.ok) throw new Error(`Ollama web search ${res.status}: ${(await res.text()).slice(0, 160)}`);
      return ((await res.json()).results ?? []).map((r) => ({ title: r.title, url: r.url, content: r.content }));
    },
  },
  tavily: {
    key: () => process.env.TAVILY_API_KEY,
    label: "Tavily",
    async search(query, max, signal) {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.TAVILY_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ query, max_results: max, search_depth: "basic" }),
        signal,
      });
      if (!res.ok) throw new Error(`Tavily ${res.status}: ${(await res.text()).slice(0, 160)}`);
      return ((await res.json()).results ?? []).map((r) => ({ title: r.title, url: r.url, content: r.content }));
    },
  },
};

const pickProvider = () => {
  const want = process.env.SEARCH_PROVIDER;
  if (want && PROVIDERS[want]?.key()) return want;
  return Object.keys(PROVIDERS).find((p) => PROVIDERS[p].key()) ?? null;
};

export function searchStatus() {
  const p = pickProvider();
  return p ? { available: true, provider: p, label: PROVIDERS[p].label } : { available: false, provider: null, label: "none (Wikivoyage/Wikipedia only)" };
}

/**
 * Run several queries, merge and de-duplicate the results, and return a notes block plus sources.
 * Never throws: a failed search just means fewer results.
 * @returns {Promise<{block: string, sources: {uri: string, title: string}[], queries: string[], errors: string[]}>}
 */
export async function searchMany(queries, { perQuery = 5, maxChars = 9000, signal } = {}) {
  const p = pickProvider();
  if (!p || !queries?.length) return { block: "", sources: [], queries: [], errors: [] };
  const errors = [];
  const all = await Promise.all(
    queries.map((q) =>
      PROVIDERS[p]
        .search(q, perQuery, signal ? AbortSignal.any([signal, AbortSignal.timeout(30_000)]) : AbortSignal.timeout(30_000))
        .catch((e) => (errors.push(e.message), [])),
    ),
  );
  const seen = new Set();
  const items = [];
  // Interleave so every query contributes before any one query's long tail does.
  for (let i = 0; i < perQuery; i++) {
    for (const list of all) {
      const r = list[i];
      if (!r?.url || seen.has(r.url)) continue;
      seen.add(r.url);
      items.push(r);
    }
  }
  let block = "";
  const used = [];
  for (const r of items) {
    const content = String(r.content ?? "").replace(/\s+/g, " ").trim().slice(0, 1400);
    if (!content) continue;
    const chunk = `\n[${used.length + 1}] ${r.title ?? r.url} (${r.url})\n${content}\n`;
    if (block.length + chunk.length > maxChars) break;
    block += chunk;
    used.push({ uri: r.url, title: r.title || new URL(r.url).hostname });
  }
  return { block: block.trim(), sources: used, queries, errors };
}
