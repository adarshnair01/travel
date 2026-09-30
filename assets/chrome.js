/* Year sidebar shared by every trip page. Add a trip in trips.js and it shows up here. */
(() => {
  "use strict";

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

  const mount = document.getElementById("yearNav");
  if (!mount || typeof PORTFOLIO === "undefined") return;

  const esc = (value) =>
    String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const trips = [...PORTFOLIO.trips].sort(
    (a, b) => new Date(b.startDate) - new Date(a.startDate)
  );
  const here = decodeURIComponent(location.pathname);
  const current = trips.find((trip) => here.endsWith("/" + trip.href) || here.endsWith(trip.href));
  const years = [...new Set(trips.map((trip) => trip.year))].sort((a, b) => b - a);

  mount.innerHTML = years
    .map((year) => {
      const links = trips
        .filter((trip) => trip.year === year)
        .map((trip) => {
          const label = esc(SHORT[trip.id] || trip.title);
          const soon = trip.status === "upcoming" ? ' <i class="side-soon">soon</i>' : "";
          if (current && current.id === trip.id) {
            return `<a href="index.html" aria-current="page">${label}${soon}</a>`;
          }
          const href = encodeURI("../../" + trip.href.replace(/^data\//, ""));
          return `<a href="${href}">${label}${soon}</a>`;
        })
        .join("\n        ");
      return `<p class="side-label">${year}</p>
      <nav class="side-nav side-trips" aria-label="${year} trips">
        ${links}
      </nav>`;
    })
    .join("\n\n      ");
})();
