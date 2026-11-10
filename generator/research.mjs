// Free, unlimited research sources (no keys, no daily limits):
//   Wikivoyage  - a full travel guide per destination (Get in, Get around, See, Do, Eat, Sleep, Stay safe)
//   Wikipedia   - history, culture and trivia (fuel for the fun-facts desk)
//   Nearby      - Wikipedia articles geotagged within 10 km (temples, lakes, villages most visitors miss)
// All via the public MediaWiki APIs, called politely (one request at a time, identified user agent).
// Content is CC BY-SA: agents summarise and rewrite it; the post links the pages under Sources.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const UA = "TravelStoryDesk/1.0 (local personal travel-blog tool)";
let degraded = false;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(host, params, signal) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: "json", formatversion: "2", ...params })}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(20_000)]) : AbortSignal.timeout(20_000) });
      if (res.status === 429 || res.status >= 500) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      return await res.json();
    } catch (e) {
      if (signal?.aborted) throw e;
      await sleep(1500 * (attempt + 1));
    }
  }
  degraded = true; // Wikimedia didn't answer: results may be second-best, so they aren't cached
  return {};
}

async function candidates(host, place, country, signal) {
  const seen = new Set();
  const out = [];
  const first = place.toLowerCase().split(/[ ,]/)[0];
  for (const q of [`${place} ${country}`.trim(), place]) {
    const r = await api(host, { action: "query", list: "search", srsearch: q, srlimit: "6", srnamespace: "0" }, signal);
    const hits = (r.query?.search ?? []).map((h) => h.title).filter((t) => t.toLowerCase().includes(first));
    // Exact title first, then "Place, Region" style titles, then the rest.
    hits.sort((a, b) => rank(b) - rank(a));
    for (const t of hits) if (!seen.has(t)) seen.add(t), out.push(t);
  }
  return out.slice(0, 4);
  function rank(t) {
    const l = t.toLowerCase();
    return (l === place.toLowerCase() ? 3 : 0) + (l.startsWith(`${place.toLowerCase()},`) ? 2 : 0) + (country && l.includes(country.toLowerCase()) ? 1 : 0);
  }
}

async function page(host, title, signal) {
  const r = await api(host, { action: "query", prop: "extracts|coordinates|info|pageprops", ppprop: "disambiguation", explaintext: "1", inprop: "url", redirects: "1", titles: title }, signal);
  const p = r.query?.pages?.[0];
  if (!p || p.missing || p.pageprops?.disambiguation !== undefined) return null;
  if ((p.extract ?? "").length < 400) return null; // stub or list page
  return { title: p.title, url: p.fullurl, text: p.extract ?? "", coords: p.coordinates?.[0] };
}

async function bestPage(host, place, country, signal) {
  for (const t of await candidates(host, place, country, signal)) {
    const p = await page(host, t, signal);
    if (p) return p;
  }
  return null;
}

/** Split MediaWiki plaintext ("== Heading ==") into {heading: text}. */
function sections(text) {
  const out = { Intro: "" };
  let cur = "Intro";
  const path = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^(={2,4})\s*(.+?)\s*\1$/);
    if (m) {
      path.length = m[1].length - 2; // == is level 0, === level 1, ==== level 2
      path.push(m[2]);
      cur = path.filter(Boolean).join(" / ");
      out[cur] ??= "";
    } else if (line.trim()) out[cur] = (out[cur] ? `${out[cur]}\n` : "") + line.trim();
  }
  return out;
}

function pick(secs, wanted, budget) {
  // Group subsections under their top-level heading ("See / Hampi Bazaar" belongs to "See"), then give
  // every group a fair share of the budget. Otherwise long See/Do sections crowd out Eat, Sleep and
  // Stay safe, and the writer ends up with nothing concrete to say about food.
  const groups = new Map();
  for (const [h, t] of Object.entries(secs)) {
    const top = h.split(" / ")[0];
    if (!t || !wanted.some((w) => top.toLowerCase().includes(w))) continue;
    groups.set(top, (groups.get(top) ?? "") + `\n## ${h}\n${t}\n`);
  }
  const chunks = [...groups.values()];
  let left = budget;
  // Smallest first, so short sections are kept whole and their unused share goes to the long ones.
  const order = chunks.map((c, i) => i).sort((a, b) => chunks[a].length - chunks[b].length);
  const kept = new Array(chunks.length);
  order.forEach((i, n) => {
    const share = Math.floor(left / (order.length - n));
    const c = chunks[i];
    kept[i] = c.length <= share ? c : c.slice(0, c.lastIndexOf("\n", share) > 0 ? c.lastIndexOf("\n", share) : share);
    left -= kept[i].length;
  });
  return kept.join("").trim();
}

/**
 * Gather free source material for a place. Never throws: missing pieces come back empty.
 * @returns {Promise<{guide: string, eat: string, background: string, nearby: string, sources: {uri: string, title: string}[], found: string[]}>}
 */
// Wikivoyage/Wikipedia barely change week to week, and Wikimedia throttles bursts of requests, so
// results are cached on disk for a week (generator/runs/.cache, git-ignored with runs/).
const CACHE = path.join(path.dirname(fileURLToPath(import.meta.url)), "runs", ".cache");
const WEEK = 7 * 24 * 3600 * 1000;

export async function gather(place, country = "", signal) {
  const file = path.join(CACHE, `${`${place}-${country}`.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`);
  try {
    const hit = JSON.parse(await readFile(file, "utf8"));
    if (Date.now() - hit.at < WEEK && hit.data.found.length) return { ...hit.data, cached: true };
  } catch {}
  degraded = false;
  let data = await gatherFresh(place, country, signal);
  if ((!data.found.length || degraded) && !signal?.aborted) {
    // Usually Wikimedia throttling a burst; one patient retry.
    await sleep(8000);
    degraded = false;
    const again = await gatherFresh(place, country, signal);
    if (again.found.length >= data.found.length) data = again;
  }
  if (data.found.length && !degraded) {
    await mkdir(CACHE, { recursive: true });
    await writeFile(file, JSON.stringify({ at: Date.now(), data })).catch(() => {});
  }
  return data;
}

async function gatherFresh(place, country = "", signal) {
  const sources = [];
  const found = [];

  // Travel guide
  let guide = "";
  let eat = "";
  const wv = await bestPage("en.wikivoyage.org", place, country, signal);
  if (wv?.text) {
    const s = sections(wv.text);
    // Eat/Drink come late in a guide and get clipped, so they also travel separately, straight to the writer.
    eat = pick(s, ["eat", "drink"], 3500);
    guide = pick(s, ["intro", "understand", "get in", "get around", "see", "do", "buy", "eat", "drink", "sleep", "stay safe", "cope", "respect", "connect", "go next", "climate", "district"], 22_000);
    sources.push({ uri: wv.url, title: `Wikivoyage: ${wv.title}` });
    found.push(`Wikivoyage guide "${wv.title}"`);
  }

  // Background (history, culture, trivia)
  let background = "";
  const wp = await bestPage("en.wikipedia.org", place, country, signal);
  if (wp?.text) {
    const s = sections(wp.text);
    background = pick(
      s,
      ["intro", "etymology", "history", "legend", "myth", "geography", "climate", "culture", "festival", "religion", "architecture", "cuisine", "food", "wildlife", "flora", "fauna", "economy", "tourism", "in popular culture", "trivia", "notable", "landmark", "monument"],
      16_000,
    );
    sources.push({ uri: wp.url, title: `Wikipedia: ${wp.title}` });
    found.push(`Wikipedia article "${wp.title}"`);
  }

  // Nearby: geotagged articles within 10 km, minus the obvious ones
  let nearby = "";
  const coords = wp?.coords ?? wv?.coords;
  if (coords) {
    const g = await api("en.wikipedia.org", { action: "query", list: "geosearch", gscoord: `${coords.lat}|${coords.lon}`, gsradius: "10000", gslimit: "40" }, signal);
    const titles = (g.query?.geosearch ?? [])
      .filter((x) => x.title !== wp?.title && !/district|taluk|constituency|railway station|airport|road|highway|school|college|bank|hospital/i.test(x.title))
      .slice(0, 20);
    if (titles.length) {
      const r = await api("en.wikipedia.org", { action: "query", prop: "extracts|info", exintro: "1", explaintext: "1", exsentences: "3", inprop: "url", titles: titles.map((t) => t.title).join("|") }, signal);
      const pages = new Map((r.query?.pages ?? []).map((p) => [p.title, p]));
      nearby = titles
        .map((t) => {
          const p = pages.get(t.title);
          return p?.extract ? `- ${t.title} (${(t.dist / 1000).toFixed(1)} km away): ${p.extract.replace(/\s+/g, " ").slice(0, 420)}` : null;
        })
        .filter(Boolean)
        .join("\n");
      if (nearby) found.push(`${nearby.split("\n").length} places within 10 km`);
    }
  }

  return { guide, eat, background, nearby, sources, found };
}

export function hasMaterial(m) {
  return !!(m.guide || m.background);
}
