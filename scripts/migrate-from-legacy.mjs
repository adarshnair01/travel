import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { dumpDocument, parseDocument } from "./front-matter.mjs";
import { assertValid } from "./schema.mjs";
import { copyTripMedia, mediaBase, rewriteMedia } from "./media.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SHORT = {
  "taiwan-2026": "Taiwan",
  "europe-2026": "Europe",
  "puri-2026": "Puri",
  "tawang-2026": "Tawang",
  "jaipur-2021": "Jaipur",
  "goa-2021": "Goa",
  "srinagar-2022": "Srinagar",
  "gangtok-2022": "Gangtok",
  "manali-2022": "Manali",
  "kerala-2022": "Kerala",
  "rajasthan-2022": "Rajasthan",
  "munnar-2022": "Munnar",
  "thailand-2022": "Thailand",
  "singapore-2023": "Singapore",
  "finland-2026": "Finland",
  "hong-kong-2025": "Hong Kong",
  "lansdowne-2025": "Lansdowne",
  "kanyakumari-2024": "Kanyakumari",
  "rishikesh-2024": "Rishikesh",
  "shillong-2024": "Shillong",
  "gujarat-2024": "Gujarat",
  "dharamshala-2024": "Dharamshala",
  "bali-2024": "Bali & KL",
};

function loadScript(file, binding) {
  const code = fs.readFileSync(file, "utf8").replace(new RegExp(`const\\s+${binding}\\s*=`), `${binding} =`);
  const context = {};
  vm.runInNewContext(code, context, { filename: file });
  if (!context[binding]) throw new Error(`${file} did not set ${binding}`);
  return context[binding];
}

function squash(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block, re) {
  const match = block.match(re);
  return match ? squash(match[1]) : "";
}

function section(html, id) {
  const match = html.match(new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>[\\s\\S]*?</section>`));
  return match ? match[0] : "";
}

function sectionCopy(block) {
  if (!block) return undefined;
  const copy = {};
  const kicker = pick(block, /<p class="kicker">([\s\S]*?)<\/p>/);
  const title = pick(block, /<h2>([\s\S]*?)<\/h2>/);
  const note = pick(block, /<(?:div|p) class="section-note"(?:\s[^>]*)?>([\s\S]*?)<\/(?:div|p)>/);
  const sub = pick(block, /<p class="section-sub">([\s\S]*?)<\/p>/);
  if (kicker) copy.kicker = kicker;
  if (title) copy.title = title;
  if (note) copy.note = note;
  if (sub) copy.sub = sub;
  return Object.keys(copy).length ? copy : undefined;
}

function headingBefore(block, id) {
  const idx = block.indexOf(`id="${id}"`);
  if (idx < 0) return "";
  const heads = [...block.slice(0, idx).matchAll(/<h3(?:\s+class="[^"]*")?>([\s\S]*?)<\/h3>/g)];
  return heads.length ? squash(heads[heads.length - 1][1]) : "";
}

function extractPage(html) {
  const accent = html.match(/--accent-light:\s*(#[0-9a-fA-F]+)\s*;\s*--accent-dark:\s*(#[0-9a-fA-F]+)/);
  const favicon = html.match(/font-size=['"]90['"]>([^<]+)</);
  const description = html.match(/name="description"\s+content="([\s\S]*?)"/);
  const side = html.match(/<div class="trip-id">\s*<b>([\s\S]*?)<\/b>\s*<small>([\s\S]*?)<\/small>/);
  const crumb = html.match(/<span class="crumb-now">([\s\S]*?)<\/span>/);
  const hero = html.match(/<section class="hero">([\s\S]*?)<\/section>/);
  const heroHtml = hero ? hero[1] : "";
  const ctas = [...heroHtml.matchAll(/<a class="btn( primary)?" href="([^"]+)">([\s\S]*?)<\/a>/g)];
  const nav = {};
  for (const match of html.matchAll(/<a href="#([a-z]+)" data-nav="\1">([\s\S]*?)<\/a>/g)) {
    nav[match[1]] = squash(match[2]);
  }
  const mapHtml = section(html, "map");
  const legend = [...mapHtml.matchAll(/<i class="lg ([^"]+)"><\/i>\s*([^<]+)/g)].map((match) => ({
    icon: match[1],
    label: squash(match[2]),
  }));
  const plan = section(html, "plan");
  const cards = {};
  for (const [key, id] of [
    ["tips", "tipsList"],
    ["packing", "packList"],
    ["lessons", "lessonsList"],
    ["stays", "staysList"],
    ["wayHome", "wayHomeList"],
  ]) {
    const title = headingBefore(plan, id);
    if (title) cards[key] = title;
  }
  const againMatch = plan.match(/<h3 class="mt">([\s\S]*?)<\/h3>\s*<p class="muted">([\s\S]*?)<\/p>/);
  const footer = html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/);
  let footerLead = "";
  let footerMuted = "";
  if (footer) {
    for (const paragraph of footer[1].matchAll(/<p(\s+class="([^"]*)")?>([\s\S]*?)<\/p>/g)) {
      const cls = paragraph[2] || "";
      if (cls.includes("footer-links")) continue;
      if (cls.includes("muted") && !footerMuted) footerMuted = squash(paragraph[3]);
      else if (!footerLead) footerLead = squash(paragraph[3]);
    }
  }
  const sections = {};
  for (const id of ["days", "tickets", "spending", "map", "highlights", "plan"]) {
    const copy = sectionCopy(section(html, id));
    if (copy) sections[id] = copy;
  }
  const page = {
    documentTitle: pick(html, /<title>([\s\S]*?)<\/title>/),
    description: description ? squash(description[1]) : "",
    favicon: favicon ? favicon[1].trim() : "",
    accentLight: accent ? accent[1] : "",
    accentDark: accent ? accent[2] : "",
    sidebarName: side ? squash(side[1]) : "",
    sidebarWhen: side ? squash(side[2]) : "",
    crumb: crumb ? squash(crumb[1]) : "",
    h1Small: pick(heroHtml, /<span class="h1-small">([\s\S]*?)<\/span>/),
    h1Big: pick(heroHtml, /<span class="h1-big">([\s\S]*?)<\/span>/),
    caption: pick(heroHtml, /<figcaption>([\s\S]*?)<\/figcaption>/),
    searchPlaceholder: pick(html, /id="search"[^>]*placeholder="([^"]*)"/),
    ctaPrimary: ctas[0] ? squash(ctas[0][3]) : "",
    ctaPrimaryHref: ctas[0] ? ctas[0][2] : "",
    ctaSecondary: ctas[1] ? squash(ctas[1][3]) : "",
    ctaSecondaryHref: ctas[1] ? ctas[1][2] : "",
    nav,
    sections,
    legend,
    cards,
    footerLead,
    footerMuted,
  };
  if (againMatch) {
    page.again = { title: squash(againMatch[1]), html: squash(againMatch[2]) };
  }
  for (const [key, value] of Object.entries(page)) {
    if (value === "" || (Array.isArray(value) && !value.length) || (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length)) {
      delete page[key];
    }
  }
  return page;
}

function catalogFrom(entry, page) {
  const catalog = {
    id: entry.id,
    scope: entry.scope,
    title: entry.title,
    year: entry.year,
    status: entry.status,
    when: entry.when,
    startDate: entry.startDate,
    endDate: entry.endDate,
    places: entry.places,
    theme: entry.theme,
    tagline: entry.tagline,
    summary: entry.summary,
    stats: entry.stats,
    cta: entry.cta,
    short: SHORT[entry.id] || entry.title,
  };
  if (page.accentLight) catalog.accentLight = page.accentLight;
  if (page.accentDark) catalog.accentDark = page.accentDark;
  if (page.favicon) catalog.favicon = page.favicon;
  if (page.documentTitle) catalog.documentTitle = page.documentTitle;
  return catalog;
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] === undefined) continue;
      out[key] = canonical(value[key]);
    }
    return out;
  }
  return value;
}

function main() {
  const dataRoot = path.join(root, "data");
  const legacyFiles = fs.existsSync(dataRoot)
    ? fs.readdirSync(dataRoot, { recursive: true }).filter((name) => String(name).endsWith("data.js"))
    : [];
  if (!legacyFiles.length) {
    console.log("No legacy data.js files; nothing to migrate.");
    return;
  }
  const portfolio = loadScript(path.join(root, "trips.js"), "PORTFOLIO");
  const byHref = new Map(portfolio.trips.map((trip) => [trip.href, trip]));
  const folders = [];
  for (const yearName of fs.readdirSync(dataRoot)) {
    const yearDir = path.join(dataRoot, yearName);
    if (!fs.statSync(yearDir).isDirectory()) continue;
    for (const slug of fs.readdirSync(yearDir)) {
      const dir = path.join(yearDir, slug);
      if (!fs.existsSync(path.join(dir, "data.js"))) continue;
      folders.push({ year: Number(yearName), slug, dir });
    }
  }

  let written = 0;
  for (const folder of folders) {
    const href = `data/${folder.year}/${folder.slug}/index.html`;
    const entry = byHref.get(href);
    if (!entry) throw new Error(`No catalog entry for ${href}`);
    const trip = loadScript(path.join(folder.dir, "data.js"), "TRIP");
    const htmlPath = path.join(folder.dir, "index.html");
    const page = fs.existsSync(htmlPath) ? extractPage(fs.readFileSync(htmlPath, "utf8")) : {};
    const intro = trip.intro;
    const { intro: _intro, ...rest } = trip;
    const rewritten = rewriteMedia(rest, mediaBase(folder.year, folder.slug));
    const doc = {
      schema: 1,
      id: entry.id,
      year: folder.year,
      slug: folder.slug,
      catalog: catalogFrom(entry, page),
      page,
      trip: rewritten,
    };
    const round = parseDocument(dumpDocument(doc, intro), href);
    round.data.intro = round.body;
    if (JSON.stringify(canonical(round.data.trip)) !== JSON.stringify(canonical(rewritten))) {
      throw new Error(`YAML round-trip changed trip facts for ${entry.id}`);
    }
    if (round.body !== intro) throw new Error(`Overview narrative changed for ${entry.id}`);
    assertValid(round.data, href);
    const out = path.join(root, "content", "trips", String(folder.year), `${folder.slug}.md`);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, dumpDocument(doc, intro));
    copyTripMedia(folder.dir, path.join(root, "content", "media", String(folder.year), folder.slug));
    written += 1;
  }
  console.log(`Wrote ${written} Markdown trips.`);
}

main();
