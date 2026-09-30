import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseDocument } from "./front-matter.mjs";
import { validateTrip } from "./schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const errors = [];
const fail = (message) => errors.push(message);

function load(file, binding) {
  const code = fs.readFileSync(file, "utf8").replace(new RegExp(`const\\s+${binding}\\s*=`), `${binding} =`);
  const context = {};
  vm.runInNewContext(code, context, { filename: file });
  return context[binding];
}

function checkSyntax(file) {
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  if (result.status !== 0) fail(`${path.relative(root, file)} failed syntax check\n${result.stderr}`);
}

const markdown = [];
const tripsDir = path.join(root, "content", "trips");
for (const year of fs.readdirSync(tripsDir)) {
  const yearDir = path.join(tripsDir, year);
  if (!fs.statSync(yearDir).isDirectory()) continue;
  for (const name of fs.readdirSync(yearDir)) {
    if (!name.endsWith(".md")) continue;
    const file = path.join(yearDir, name);
    const { data, body } = parseDocument(fs.readFileSync(file, "utf8"), file);
    data.intro = body;
    markdown.push(data);
    for (const message of validateTrip(data, path.relative(root, file))) fail(message);
  }
}

if (!fs.existsSync(path.join(dist, "trips.js"))) fail("dist/trips.js is missing; run npm run build");
else {
  checkSyntax(path.join(dist, "trips.js"));
  const portfolio = load(path.join(dist, "trips.js"), "PORTFOLIO");
  const scripts = fs.existsSync(path.join(dist, "generated", "trips"))
    ? fs.readdirSync(path.join(dist, "generated", "trips")).filter((name) => name.endsWith(".js"))
    : [];
  if (portfolio.trips.length !== markdown.length || scripts.length !== markdown.length) {
    fail(`counts differ: markdown ${markdown.length}, catalog ${portfolio.trips.length}, scripts ${scripts.length}`);
  }
  const ids = new Set(markdown.map((doc) => doc.id));
  for (const trip of portfolio.trips) {
    if (!ids.has(trip.id)) fail(`catalog id ${trip.id} has no Markdown source`);
    if (trip.href !== `trip.html?id=${encodeURIComponent(trip.id)}`) fail(`${trip.id} does not use trip.html?id=`);
    if (/data\/\d{4}\//.test(trip.href)) fail(`${trip.id} still points at a legacy page`);
    const script = path.join(dist, "generated", "trips", `${trip.id}.js`);
    if (!fs.existsSync(script)) fail(`missing generated script for ${trip.id}`);
    else checkSyntax(script);
  }

  const trip = (id) => load(path.join(dist, "generated", "trips", `${id}.js`), "TRIP");
  const taiwan = trip("taiwan-2026");
  const outbound = taiwan.bookings.find((item) => item.ref === "HYSBKC");
  if (!outbound || outbound.legs?.length !== 2) fail("Taiwan outbound layover was not preserved");
  const pass = taiwan.bookings.find((item) => item.id === "mrt");
  if (!pass?.qr?.endsWith("/qr-mrt.png") || !pass.href?.startsWith("https://")) fail("Taiwan QR pass was not preserved");
  const kochi = trip("kochi-2026");
  if (kochi.days[0]?.schedule?.[1]?.text !== "Reached Kochi" || !kochi.emptyBookings) fail("Kochi schedule was not preserved");
  const japan = trip("japan-2025");
  if (!japan.bookings?.some((item) => item.ref === "WS55OM")) fail("Japan booking reference was not preserved");
  for (const id of ["singapore-2023", "thailand-2022", "finland-2026"]) {
    const record = trip(id);
    if (!record.spending?.entries?.length) fail(`${id} spending ledger is missing`);
  }
  const europe = trip("europe-2026");
  const epilogue = europe.days.find((day) => day.epilogue);
  if (epilogue?.n !== 13 || europe.tripDays !== 12 || europe.wayHome?.length !== 3) fail("Europe epilogue fields were not preserved");
  const plain = trip("kerala-temples-2026");
  if (plain.spending || plain.lessons || plain.wayHome || plain.bookings?.length || plain.days.some((day) => day.epilogue)) {
    fail("Kerala temples should omit spending, lessons, way home, bookings, and epilogue");
  }
  const mysore = trip("mysore-2026");
  if (mysore.spending || mysore.days.some((day) => day.epilogue || day.schedule)) fail("Mysore should stay a simple recap");

  const html = fs.readFileSync(path.join(dist, "trip.html"), "utf8");
  for (const id of ["days", "tickets", "spending", "map", "highlights", "plan"]) {
    if (!html.includes(`id="${id}"`)) fail(`trip.html is missing #${id}`);
  }
  if (fs.readdirSync(path.join(root, "data"), { recursive: true }).some((name) => /index\.html$|data\.js$/.test(String(name)))) {
    fail("legacy per-trip index.html or data.js is still present");
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Checked ${markdown.length} trips.`);
