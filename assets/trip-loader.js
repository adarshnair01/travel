/* Loads one generated trip script from ?id= and then the shared renderer. */
(() => {
  "use strict";

  const missing = document.getElementById("tripMissing");

  function fail(message) {
    document.body.classList.remove("trip-pending");
    if (missing) {
      missing.hidden = false;
      missing.textContent = message;
    }
    document.querySelectorAll("main > :not(#tripMissing)").forEach((el) => {
      el.hidden = true;
    });
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(src));
      document.body.appendChild(script);
    });
  }

  const id = new URLSearchParams(location.search).get("id") || "";
  if (!/^[a-z0-9-]+$/.test(id) || typeof PORTFOLIO === "undefined") {
    fail("This page needs a trip id, like trip.html?id=taiwan-2026.");
    return;
  }
  const meta = PORTFOLIO.trips.find((trip) => trip.id === id);
  if (!meta) {
    fail("That trip is not in the journal.");
    return;
  }

  const root = document.documentElement;
  if (meta.accentLight) root.style.setProperty("--accent-light", meta.accentLight);
  if (meta.accentDark) root.style.setProperty("--accent-dark", meta.accentDark);
  if (meta.documentTitle) document.title = meta.documentTitle;
  const icon = document.querySelector('link[rel="icon"]');
  if (icon && meta.favicon) {
    icon.href =
      "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${meta.favicon}</text></svg>`
      );
  }
  const cover = document.getElementById("coverImg");
  if (cover && meta.cover) cover.src = meta.cover;

  loadScript(`generated/trips/${id}.js`)
    .then(() => loadScript("assets/chrome.js"))
    .then(() => loadScript("assets/trip.js"))
    .then(() => loadScript("assets/critters.js"))
    .then(() => loadScript("assets/stickers.js"))
    .catch(() => fail("The trip record could not be loaded."));
})();
