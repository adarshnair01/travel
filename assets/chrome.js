/* Year sidebar shared by the universal trip page. Labels and links come from trips.js. */
(() => {
  "use strict";

  const mount = document.getElementById("yearNav");
  if (!mount || typeof PORTFOLIO === "undefined") return;

  const esc = (value) =>
    String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const trips = [...PORTFOLIO.trips].sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  );
  const currentId = new URLSearchParams(location.search).get("id");
  const years = [...new Set(trips.map((trip) => trip.year))].sort((a, b) => b - a);

  mount.innerHTML = years
    .map((year) => {
      const links = trips
        .filter((trip) => trip.year === year)
        .map((trip) => {
          const label = esc(trip.short || trip.title);
          const soon = trip.status === "upcoming" ? ' <i class="side-soon">soon</i>' : "";
          const href = `trip.html?id=${encodeURIComponent(trip.id)}`;
          const current = currentId === trip.id ? ' aria-current="page"' : "";
          return `<a href="${href}"${current}>${label}${soon}</a>`;
        })
        .join("\n        ");
      return `<p class="side-label">${year}</p>
      <nav class="side-nav side-trips" aria-label="${year} trips">
        ${links}
      </nav>`;
    })
    .join("\n\n      ");
})();
