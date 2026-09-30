import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "./front-matter.mjs";
import { assertValid } from "./schema.mjs";
import { mediaBase, rewriteMedia } from "./media.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const content = path.join(root, "content");

function readSite() {
  const { data } = parseDocument(`---\n${fs.readFileSync(path.join(content, "site.yml"), "utf8")}\n---\n`);
  for (const key of ["brand", "name", "tagline", "blurb", "homeBase"]) {
    if (typeof data[key] !== "string" || !data[key].trim()) {
      throw new Error(`content/site.yml is missing ${key}`);
    }
  }
  return data;
}

function tripFiles() {
  const dir = path.join(content, "trips");
  const found = [];
  if (!fs.existsSync(dir)) return found;
  for (const yearEnt of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!yearEnt.isDirectory()) continue;
    const yearDir = path.join(dir, yearEnt.name);
    for (const name of fs.readdirSync(yearDir)) {
      if (!name.endsWith(".md")) continue;
      found.push({
        year: Number(yearEnt.name),
        slug: name.slice(0, -3),
        file: path.join(yearDir, name),
      });
    }
  }
  return found;
}

function loadTrip(entry) {
  const raw = fs.readFileSync(entry.file, "utf8");
  const { data, body } = parseDocument(raw, path.relative(root, entry.file));
  data.intro = body;
  if (data.year !== entry.year) {
    throw new Error(`${entry.file}: folder year ${entry.year} does not match front matter ${data.year}`);
  }
  if (data.slug !== entry.slug) {
    throw new Error(`${entry.file}: filename does not match slug ${data.slug}`);
  }
  assertValid(data, path.relative(root, entry.file));
  const base = mediaBase(data.year, data.slug);
  const trip = rewriteMedia(structuredClone(data.trip), base);
  trip.intro = data.intro;
  if (data.page) trip.page = data.page;
  const catalog = {
    ...data.catalog,
    href: `trip.html?id=${encodeURIComponent(data.id)}`,
    cover: `${base}/cover.jpg`,
  };
  return { id: data.id, catalog, trip };
}

function writeScript(file, source) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source);
}

function copyStatic() {
  const files = ["index.html", "trip.html", "app.js", "styles.css"];
  for (const name of files) {
    fs.copyFileSync(path.join(root, name), path.join(dist, name));
  }
  fs.cpSync(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });
  const media = path.join(content, "media");
  if (fs.existsSync(media)) {
    fs.cpSync(media, path.join(dist, "media"), { recursive: true });
  }
}

function main() {
  const site = readSite();
  const loaded = tripFiles().map(loadTrip);
  const ids = new Set();
  for (const trip of loaded) {
    if (ids.has(trip.id)) throw new Error(`duplicate trip id ${trip.id}`);
    ids.add(trip.id);
  }
  loaded.sort((a, b) => b.catalog.startDate.localeCompare(a.catalog.startDate) || a.id.localeCompare(b.id));

  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(path.join(dist, "generated", "trips"), { recursive: true });

  for (const item of loaded) {
    const file = path.join(dist, "generated", "trips", `${item.id}.js`);
    writeScript(file, `/* Generated from content/trips. Do not edit. */\nconst TRIP = ${JSON.stringify(item.trip, null, 2)};\n`);
  }

  const portfolio = { ...site, trips: loaded.map((item) => item.catalog) };
  writeScript(
    path.join(dist, "trips.js"),
    `/* Generated from content/trips. Do not edit. */\nconst PORTFOLIO = ${JSON.stringify(portfolio, null, 2)};\n`
  );

  copyStatic();
  console.log(`Built ${loaded.length} trips into dist/`);
}

main();
