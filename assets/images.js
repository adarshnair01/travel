/* Shared image fallbacks. Loaded from <head> so it is listening before <img> tags parse. */
(() => {
  "use strict";

  /* A cover may be cover.jpg, cover.jpeg, or cover.png. The markup asks
     for jpg first; a miss tries the other two before the empty frame. */
  const COVERS = ["cover.jpg", "cover.jpeg", "cover.png"];

  function tryNextCover(img) {
    const src = img.getAttribute("src") || "";
    const match = src.match(/^(.*\/)?(cover)\.(jpe?g|png)$/i);
    if (!match) return false;
    const dir = match[1] || "";
    const current = `cover.${match[3].toLowerCase()}`;
    const tried = new Set((img.dataset.coverTried || current).split(","));
    tried.add(current);
    const start = Math.max(0, COVERS.indexOf(current));
    for (let step = 1; step <= COVERS.length; step += 1) {
      const next = COVERS[(start + step) % COVERS.length];
      if (tried.has(next)) continue;
      tried.add(next);
      img.dataset.coverTried = [...tried].join(",");
      img.src = dir + next;
      return true;
    }
    return false;
  }

  function fail(img) {
    const mode = img.getAttribute("data-fallback");
    if (!mode) return;
    if (tryNextCover(img)) return;
    if (mode === "frame" && img.parentElement) img.parentElement.classList.add("is-empty");
    img.remove();
  }

  function succeed(img) {
    if (img.getAttribute("data-fallback") !== "card" || !img.parentElement) return;
    img.parentElement.classList.remove("is-empty");
  }

  document.addEventListener(
    "error",
    (event) => {
      const img = event.target;
      if (img && img.tagName === "IMG") fail(img);
    },
    true
  );
  document.addEventListener(
    "load",
    (event) => {
      const img = event.target;
      if (img && img.tagName === "IMG") succeed(img);
    },
    true
  );
})();
