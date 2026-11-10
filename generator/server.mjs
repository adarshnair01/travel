// Local-only admin for generating travel stories. Never deployed:
// - listens on 127.0.0.1 only (not reachable from other devices),
// - rejects requests whose Host/Origin isn't localhost (blocks DNS-rebinding and cross-site requests),
// - lives outside site/, so the Astro build and GitHub Pages never see it.

import http from "node:http";
import { readFile, writeFile, readdir, mkdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";
import { runDesk, AGENTS, SECTIONS } from "./agents.mjs";
import { config, listModels } from "./gemini.mjs";
import { MODES, providerStatus, normalizeMode } from "./llm.mjs";
import { ollamaConfig } from "./ollama.mjs";
import { searchStatus } from "./search.mjs";
import { slugify } from "./layout.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const POSTS = path.resolve(HERE, "../posts");
const RUNS = path.join(HERE, "runs");
const PORT = Number(process.env.GEN_PORT) || 4400;
const HOST = "127.0.0.1";
const LOCAL = new Set([`127.0.0.1:${PORT}`, `localhost:${PORT}`, `[::1]:${PORT}`]);

await mkdir(RUNS, { recursive: true });

/** @type {Map<string, {run: any, clients: Set<http.ServerResponse>, abort: AbortController}>} */
const live = new Map();

const json = (res, code, data) => {
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(JSON.stringify(data));
};

async function body(req) {
  let s = "";
  for await (const c of req) {
    s += c;
    if (s.length > 2e6) throw new Error("Body too large");
  }
  return s ? JSON.parse(s) : {};
}

const runFile = (id) => path.join(RUNS, `${id.replace(/[^a-z0-9-]/gi, "")}.json`);
let saveTimer = new Map();
function persist(run) {
  clearTimeout(saveTimer.get(run.id));
  saveTimer.set(run.id, setTimeout(() => writeFile(runFile(run.id), JSON.stringify(run, null, 1)).catch(() => {}), 300));
}

function startJob(input) {
  const id = `${new Date().toLocaleDateString("en-CA")}-${slugify(input.place)}-${crypto.randomBytes(3).toString("hex")}`;
  const run = { id, input, status: "running", createdAt: new Date().toISOString(), events: [] };
  const abort = new AbortController();
  const entry = { run, clients: new Set(), abort };
  live.set(id, entry);

  const emit = (ev) => {
    const e = { ...ev, at: Date.now() };
    run.events.push(e);
    if (ev.type === "review") run.score = ev.score;
    for (const c of entry.clients) c.write(`data: ${JSON.stringify(e)}\n\n`);
    persist(run);
  };

  runDesk(input, emit, abort.signal)
    .then(() => (run.status = "done"))
    .catch((e) => {
      run.status = abort.signal.aborted ? "cancelled" : "failed";
      emit({ type: "error", error: abort.signal.aborted ? "Cancelled" : e.message });
    })
    .finally(() => {
      emit({ type: "status", status: run.status });
      for (const c of entry.clients) c.end();
      setTimeout(() => live.delete(id), 60_000);
    });
  return id;
}

async function loadRun(id) {
  if (live.has(id)) return live.get(id).run;
  return JSON.parse(await readFile(runFile(id), "utf8"));
}

function validDate(d) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d));
}

const routes = {
  "GET /": async (req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(await readFile(path.join(HERE, "ui/index.html")));
  },
  "GET /api/config": async (req, res) =>
    json(res, 200, {
      model: config.model,
      writerModel: config.writerModel,
      localModel: ollamaConfig.model,
      mock: config.mock,
      hasKey: !!config.key,
      modes: MODES,
      providers: await providerStatus(),
      agents: AGENTS,
      sections: SECTIONS.map((s) => ({ id: s.id, heading: s.heading ?? "Intro" })),
    }),
  "GET /api/models": async (req, res) => {
    try {
      json(res, 200, { models: await listModels() });
    } catch (e) {
      json(res, 502, { error: e.message });
    }
  },
  "GET /api/jobs": async (req, res) => {
    const files = (await readdir(RUNS)).filter((f) => f.endsWith(".json"));
    const runs = await Promise.all(
      files.map(async (f) => {
        try {
          const r = JSON.parse(await readFile(path.join(RUNS, f), "utf8"));
          return { id: r.id, place: r.input.place, country: r.input.country, status: live.get(r.id)?.run.status ?? r.status, createdAt: r.createdAt, score: r.score, savedAs: r.savedAs };
        } catch {
          return null;
        }
      }),
    );
    json(res, 200, runs.filter(Boolean).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  "POST /api/jobs": async (req, res) => {
    const b = await body(req);
    const place = String(b.place ?? "").trim();
    if (!place) return json(res, 400, { error: "Place is required" });
    const date = validDate(b.date) ? b.date : new Date().toLocaleDateString("en-CA");
    const input = {
      place: place.slice(0, 120),
      country: String(b.country ?? "").trim().slice(0, 80),
      tripDates: String(b.tripDates ?? "").trim().slice(0, 80),
      days: Number(b.days) || "",
      notes: String(b.notes ?? "").slice(0, 6000),
      tone: String(b.tone ?? "").slice(0, 200),
      maxRounds: Math.min(12, Math.max(1, Number(b.maxRounds) || 6)),
      targetScore: Math.min(10, Math.max(6, Number(b.targetScore) || 9)),
      mode: normalizeMode(b.mode),
      date,
    };
    json(res, 201, { id: startJob(input) });
  },
};

async function handle(req, res) {
  // Local-only guard.
  const host = req.headers.host ?? "";
  const origin = req.headers.origin;
  if (!LOCAL.has(host) || (origin && !LOCAL.has(origin.replace(/^https?:\/\//, "")))) {
    res.writeHead(403).end("Forbidden: the generator is only available on this machine.");
    return;
  }
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");

  const url = new URL(req.url, `http://${host}`);
  const key = `${req.method} ${url.pathname}`;
  if (routes[key]) return routes[key](req, res);

  const m = url.pathname.match(/^\/api\/jobs\/([a-z0-9-]+)(?:\/(stream|cancel|save))?$/i);
  if (m) {
    const [, id, action] = m;
    if (req.method === "GET" && !action) {
      try {
        return json(res, 200, await loadRun(id));
      } catch {
        return json(res, 404, { error: "Run not found" });
      }
    }
    if (req.method === "GET" && action === "stream") {
      res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-store", Connection: "keep-alive" });
      const entry = live.get(id);
      const run = entry?.run ?? (await loadRun(id).catch(() => null));
      if (!run) return res.end();
      for (const e of run.events) res.write(`data: ${JSON.stringify(e)}\n\n`);
      if (!entry || run.status !== "running") return res.end();
      entry.clients.add(res);
      req.on("close", () => entry.clients.delete(res));
      return;
    }
    if (req.method === "POST" && action === "cancel") {
      live.get(id)?.abort.abort();
      return json(res, 200, { ok: true });
    }
    if (req.method === "POST" && action === "save") {
      const b = await body(req);
      const slug = slugify(b.slug ?? "");
      const date = String(b.date ?? "");
      const markdown = String(b.markdown ?? "");
      if (!slug || !validDate(date)) return json(res, 400, { error: "Need a valid slug and YYYY-MM-DD date" });
      if (!markdown.startsWith("---")) return json(res, 400, { error: "Markdown must start with front matter" });
      const file = path.join(POSTS, `${date}-${slug}.md`);
      if (path.dirname(file) !== POSTS) return json(res, 400, { error: "Bad path" });
      const exists = await access(file).then(() => true, () => false);
      if (exists && !b.overwrite) return json(res, 409, { error: `posts/${date}-${slug}.md already exists`, exists: true });
      await mkdir(path.join(POSTS, "images", slug), { recursive: true });
      await writeFile(file, markdown);
      try {
        const run = await loadRun(id);
        run.savedAs = `posts/${date}-${slug}.md`;
        persist(run);
      } catch {}
      return json(res, 200, { ok: true, file: `posts/${date}-${slug}.md`, imagesDir: `posts/images/${slug}/` });
    }
  }
  json(res, 404, { error: "Not found" });
}

http
  .createServer((req, res) =>
    handle(req, res).catch((e) => {
      if (!res.headersSent) json(res, 500, { error: e.message });
      else res.end();
    }),
  )
  .listen(PORT, HOST, () => {
    console.log(`\n  Travel post generator (local admin): http://localhost:${PORT}`);
    console.log(`  Gemini: ${config.mock ? "MOCK (no API calls)" : config.key ? `${config.model} (writer ${config.writerModel})` : "no key"}`);
    console.log(`  Local:  ${ollamaConfig.model} via Ollama (scouting, fun facts, writing and editing in Hybrid mode; everything in Local mode)`);
    console.log(`  Search: ${searchStatus().label}${searchStatus().available ? "" : ". Add OLLAMA_API_KEY or TAVILY_API_KEY to .env for current web data"}`);
    if (!config.key && !config.mock) console.log("  ⚠ GEMINI_API_KEY is not set. Copy .env.example to .env and add your key.");
    console.log("");
  })
  .on("error", (e) => {
    if (e.code === "EADDRINUSE") {
      console.error(`\n  Port ${PORT} is already in use, probably by a Story Desk that's already running.`);
      console.error(`  Open http://localhost:${PORT}, stop the other one (lsof -ti tcp:${PORT} | xargs kill), or run with GEN_PORT=4401 npm start.\n`);
      process.exit(1);
    }
    throw e;
  });
