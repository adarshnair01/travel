// Local models through Ollama (http://127.0.0.1:11434). Free, unlimited, private.

const HOST = process.env.OLLAMA_HOST?.replace(/\/$/, "") || "http://127.0.0.1:11434";

export const ollamaConfig = {
  model: process.env.OLLAMA_MODEL || "gemma4:12b-it-qat",
  // Big enough for the desk's notes plus a full section group; Ollama's default is far smaller
  // and would silently drop the research.
  ctx: Number(process.env.OLLAMA_CTX) || 16384,
};

export class OllamaError extends Error {}

/** {ok, models[], hasModel, error?} */
export async function ollamaStatus() {
  try {
    const res = await fetch(`${HOST}/api/tags`, { signal: AbortSignal.timeout(2500) });
    const data = await res.json();
    const models = (data.models ?? []).map((m) => m.name);
    return { ok: true, models, hasModel: models.includes(ollamaConfig.model) };
  } catch {
    return { ok: false, models: [], hasModel: false, error: "Ollama isn't running. Open the Ollama app (or run `ollama serve`)." };
  }
}

/**
 * @param {object} o
 * @param {string} o.system
 * @param {string} o.prompt
 * @param {boolean} [o.json]
 * @param {object} [o.schema]  JSON schema to constrain the output (Ollama structured outputs)
 * @param {number} [o.temperature]
 * @param {number} [o.maxTokens]
 * @param {AbortSignal} [o.signal]
 */
export async function ollamaGenerate({ system, prompt, json = false, schema, temperature = 0.7, maxTokens = 6144, signal }) {
  const body = {
    model: ollamaConfig.model,
    stream: false,
    keep_alive: "20m",
    think: false,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    options: { num_ctx: ollamaConfig.ctx, temperature, num_predict: maxTokens, repeat_penalty: 1.05 },
    ...(json ? { format: schema ?? "json" } : {}),
  };

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    let res;
    try {
      res = await fetch(`${HOST}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // Local generation of a long section group can take several minutes on an M4.
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(900_000)]) : AbortSignal.timeout(900_000),
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      throw new OllamaError(`Can't reach Ollama at ${HOST}: ${e.message}. Is the Ollama app running?`);
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (/think/i.test(data.error ?? "") && body.think === false) {
        delete body.think; // model doesn't support the thinking switch
        continue;
      }
      if (/not found/i.test(data.error ?? "")) throw new OllamaError(`Model ${ollamaConfig.model} isn't downloaded. Run: ollama pull ${ollamaConfig.model}`);
      throw new OllamaError(`Ollama ${res.status}: ${data.error ?? res.statusText}`);
    }
    const text = (data.message?.content ?? "").trim();
    if (!text) {
      lastErr = new OllamaError("Ollama returned an empty response");
      continue;
    }
    const out = {
      text,
      sources: [],
      queries: [],
      model: ollamaConfig.model,
      tokens: { in: data.prompt_eval_count, out: data.eval_count, truncated: data.done_reason === "length" },
    };
    if (json) {
      try {
        const t = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
        out.data = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
      } catch {
        lastErr = new OllamaError(`Local model returned invalid JSON${data.done_reason === "length" ? " (ran out of tokens)" : ""}`);
        body.options.num_predict = Math.round(maxTokens * 1.5);
        continue;
      }
    }
    return out;
  }
  throw lastErr ?? new OllamaError("Ollama request failed");
}
