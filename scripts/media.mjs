import fs from "node:fs";
import path from "node:path";

const MEDIA_FILE = /^(?:assets\/)?.+\.(?:png|jpe?g|gif|webp|pdf|svg)$/i;

export function mediaBase(year, slug) {
  return `media/${year}/${slug}`;
}

export function rewriteMedia(value, base) {
  if (typeof value === "string") {
    if (/^(https?:|data:|\/|#)/.test(value)) return value;
    if (value.startsWith("assets/")) return `${base}/${value.slice("assets/".length)}`;
    if (MEDIA_FILE.test(value) && !value.startsWith("media/")) return `${base}/${value.replace(/^\.\//, "")}`;
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => rewriteMedia(item, base));
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, item] of Object.entries(value)) out[key] = rewriteMedia(item, base);
    return out;
  }
  return value;
}

const SKIP = new Set(["index.html", "data.js", "README.md", ".DS_Store"]);

export function copyTripMedia(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const from = path.join(srcDir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets") {
        for (const file of fs.readdirSync(from, { withFileTypes: true })) {
          if (!file.isFile() || file.name === ".DS_Store") continue;
          fs.copyFileSync(path.join(from, file.name), path.join(destDir, file.name));
        }
      } else {
        fs.cpSync(from, path.join(destDir, entry.name), { recursive: true });
      }
      continue;
    }
    if (entry.isFile()) fs.copyFileSync(from, path.join(destDir, entry.name));
  }
}
