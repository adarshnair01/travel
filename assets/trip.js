/* Shared trip page engine. Per-trip copy lives in data.js; features follow the DOM. */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const byId = (id) => document.getElementById(id);
  const country = (code) => TRIP.countries.find((c) => c.code === code) || {};
  const countryTag = (d) => {
    const a = country(d.country);
    const b = d.also ? country(d.also) : null;
    const title = b ? `${a.name} → ${b.name}` : a.name;
    const body = b ? `${a.flag}${b.flag} ${a.code}–${b.code}` : `${a.flag} ${a.code}`;
    return `<span class="country-tag" title="${title}">${body}</span>`;
  };

  const fmtDate = (iso, opts) =>
    new Date(iso + "T00:00:00").toLocaleDateString("en-GB", opts || { day: "numeric", month: "short" });
  const weekday = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short" });

  /* ── Icons ───────────────────────────────────────────────────────────── */
  const S = (d, extra = "") =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
      stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;

  const ICON = {
    train: S('<rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14M9 20l-1.5 2M15 20l1.5 2M8 16h8"/><circle cx="9" cy="13" r=".6" fill="currentColor"/><circle cx="15" cy="13" r=".6" fill="currentColor"/>'),
    bus: S('<rect x="3" y="4" width="18" height="13" rx="3"/><path d="M3 11h18M7 17v2M17 17v2"/>'),
    plane: S('<path d="M2 13l19-7-7 19-2.5-7.5L2 13Z"/>'),
    boat: S('<path d="M3 14h18l-2 4H5l-2-4Z"/><path d="M5 14V9h6l2 5"/><path d="M3 20h18"/>'),
    day: S('<path d="M4 8h13a4 4 0 0 1 0 8H7"/><path d="m7 5 3 3-3 3M10 19l-3-3 3-3"/>'),
    bed: S('<path d="M3 18v-7h12a4 4 0 0 1 4 4v3M3 18h18M3 11V7"/><circle cx="7.5" cy="8.5" r="1.6"/>'),
    globe: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 3 2.6 15 0 18-2.6-3-2.6-15 0-18Z"/>'),
    pin: S('<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'),
    /* Sequence only. Not a train, cab, or bus — the map stroke stays the plain route line. */
    way: S('<circle cx="6" cy="7" r="2"/><circle cx="18" cy="17" r="2"/><path d="M8 8c3.2.4 5.2 2.2 8 7"/>'),
    mountain: S('<path d="M2 19h20M5 19l6-11 3 5.5M11.5 13l2-3 5 9"/>'),
    town: S('<path d="M3 21V9l5-4 5 4v12M13 21V13h8v8M3 21h18"/><path d="M16.5 17h1.5"/>'),
    star: S('<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8L12 3.5Z"/>'),
    clock: S('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>'),
    check: S('<path d="m4 12.5 5 5L20 6.5"/>'),
    sparkle: S('<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>'),
    ticket: S('<path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M12 6v12"/>'),
    cake: S('<path d="M4 13h16v7H4z"/><path d="M4 16h16M8 13V9h8v4"/><path d="M12 6v3"/>'),
    lounge: S('<path d="M4 12h16v7H4zM6 12V8a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v4"/><path d="M4 19v2M20 19v2"/>'),
    run: S('<circle cx="14" cy="5" r="2"/><path d="M10 22l2-6 3 1 3-5M6 14l4-1 2 3"/>'),
    spin: S('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
    banana: S('<path d="M6 16c2 4 8 6 12 2 1-1 2-3 1-5-3 2-7 2-10 0-1 1-2 2-3 3Z"/>'),
    rail: S('<path d="M4 18h16M7 18l-2 3M17 18l2 3M6 8h12v10H6z"/><path d="M6 12h12"/>'),
  };

  /* ── Card artwork per theme ──────────────────────────────────────────── */
  const ART = {
    lake: `<path class="a-sky" d="M0 0h400v150H0z"/><path class="a-m2" d="M0 108 70 52l58 44 52-34 66 50 60-30 94 46v22H0z"/>
      <path class="a-m1" d="M0 122 62 84l54 30 66-22 58 34 70-24 90 34v14H0z"/>
      <path class="a-water" d="M0 136h400v64H0z"/><path class="a-glow" d="M150 136h100v64H150z"/>
      <g class="a-town"><rect x="118" y="112" width="16" height="26" rx="2"/><rect x="140" y="104" width="13" height="34" rx="2"/><rect x="160" y="116" width="18" height="22" rx="2"/><rect x="248" y="110" width="14" height="28" rx="2"/><rect x="268" y="118" width="18" height="20" rx="2"/></g>
      <g class="a-ripple"><path d="M60 158h70M40 172h110M210 152h90M240 178h120M120 188h150"/></g>`,
    peak: `<path class="a-sky" d="M0 0h400v150H0z"/><path class="a-m3" d="M0 118 96 34l64 54 56-40 76 62 56-34 52 42v42H0z"/>
      <path class="a-snow" d="M96 34l30 26-16 6-14-8-12 10-18-8z"/><path class="a-snow" d="M292 42l24 20-14 6-12-6-10 8-16-6z"/>
      <path class="a-m1" d="M0 150 70 116l64 26 60-18 70 30 66-22 70 26v42H0z"/><path class="a-ground" d="M0 176h400v24H0z"/>
      <g class="a-tree"><path d="M40 176l10-24 10 24zM70 178l8-20 8 20zM320 176l10-22 10 22zM352 178l8-18 8 18z"/></g>`,
    rail: `<path class="a-sky" d="M0 0h400v150H0z"/><path class="a-m2" d="M0 112 84 44l60 48 62-32 70 54 58-28 66 40v46H0z"/>
      <path class="a-m1" d="M0 144 76 110l58 24 66-16 62 26 68-18 70 22v44H0z"/><path class="a-ground" d="M0 172h400v28H0z"/>
      <g class="a-rail"><path d="M-10 190 410 150"/><path d="M-10 200 410 160"/>
      <path d="M20 196v-9M70 191v-9M120 186v-9M170 181v-9M220 176v-9M270 171v-9M320 166v-9M370 161v-9"/></g>
      <g class="a-carriage"><rect x="150" y="128" width="60" height="24" rx="6"/><rect x="212" y="130" width="52" height="22" rx="5"/>
      <rect x="158" y="134" width="14" height="9" rx="2" class="a-win"/><rect x="178" y="134" width="14" height="9" rx="2" class="a-win"/>
      <rect x="220" y="135" width="13" height="8" rx="2" class="a-win"/><rect x="240" y="135" width="13" height="8" rx="2" class="a-win"/></g>`,
    city: `<path class="a-sky" d="M0 0h400v160H0z"/>
      <g class="a-skyline"><rect x="20" y="96" width="34" height="70" rx="3"/><rect x="62" y="70" width="26" height="96" rx="3"/>
      <rect x="96" y="110" width="40" height="56" rx="3"/><path class="a-dome" d="M156 110c0-22 18-38 22-52 4 14 22 30 22 52z"/>
      <rect x="152" y="108" width="52" height="58" rx="3"/><rect x="212" y="84" width="30" height="82" rx="3"/>
      <rect x="250" y="104" width="44" height="62" rx="3"/><rect x="302" y="76" width="24" height="90" rx="3"/>
      <rect x="334" y="112" width="42" height="54" rx="3"/></g>
      <g class="a-lit"><rect x="28" y="106" width="6" height="8"/><rect x="42" y="106" width="6" height="8"/><rect x="70" y="82" width="6" height="8"/>
      <rect x="70" y="100" width="6" height="8"/><rect x="220" y="96" width="6" height="8"/><rect x="220" y="114" width="6" height="8"/>
      <rect x="308" y="88" width="6" height="8"/><rect x="346" y="124" width="6" height="8"/><rect x="262" y="118" width="6" height="8"/></g>
      <path class="a-ground" d="M0 166h400v34H0z"/>`,
    water: `<path class="a-sky" d="M0 0h400v120H0z"/><path class="a-m2" d="M0 100 90 48l70 42 66-26 80 44 94-32v40H0z"/>
      <path class="a-cliff" d="M0 116h150l14 30H0z"/><path class="a-cliff" d="M400 116H250l-14 30h164z"/>
      <g class="a-fall"><path d="M158 120c6 26 2 44-4 62M172 120c6 26 4 46-2 64M186 120c5 26 3 46-3 64M200 120c6 26 4 44-2 62M214 120c6 26 2 44-4 62M228 120c5 26 3 44-3 62"/></g>
      <path class="a-water" d="M0 176h400v24H0z"/><g class="a-spray"><circle cx="176" cy="176" r="12"/><circle cx="200" cy="182" r="16"/><circle cx="226" cy="176" r="11"/></g>`,
    town: `<path class="a-sky" d="M0 0h400v150H0z"/><path class="a-m2" d="M0 104 88 56l66 40 70-24 76 42 100-28v36H0z"/>
      <g class="a-arena"><path d="M118 168V116a52 26 0 0 1 104 0v52z"/></g>
      <g class="a-arch"><rect x="132" y="132" width="14" height="24" rx="7"/><rect x="156" y="132" width="14" height="24" rx="7"/>
      <rect x="180" y="132" width="14" height="24" rx="7"/><rect x="204" y="132" width="14" height="24" rx="7"/>
      <rect x="138" y="100" width="12" height="20" rx="6"/><rect x="166" y="96" width="12" height="20" rx="6"/><rect x="194" y="100" width="12" height="20" rx="6"/></g>
      <g class="a-town"><rect x="34" y="120" width="30" height="48" rx="2"/><rect x="72" y="108" width="24" height="60" rx="2"/>
      <rect x="252" y="112" width="28" height="56" rx="2"/><rect x="290" y="124" width="34" height="44" rx="2"/><rect x="332" y="114" width="26" height="54" rx="2"/></g>
      <path class="a-ground" d="M0 168h400v32H0z"/>`,
    baroque: `<path class="a-sky" d="M0 0h400v150H0z"/><path class="a-m2" d="M0 96 82 44l64 40 70-22 74 40 110-26v32H0z"/>
      <g class="a-skyline"><rect x="150" y="96" width="100" height="70" rx="2"/>
      <rect x="146" y="70" width="20" height="96" rx="2"/><rect x="234" y="70" width="20" height="96" rx="2"/>
      <path class="a-dome" d="M176 96c0-20 16-30 24-44 8 14 24 24 24 44z"/></g>
      <g class="a-roof"><path d="M146 70l10-22 10 22zM234 70l10-22 10 22z"/><circle cx="200" cy="46" r="4"/></g>
      <g class="a-lit"><rect x="152" y="120" width="8" height="14"/><rect x="172" y="120" width="8" height="14"/>
      <rect x="220" y="120" width="8" height="14"/><rect x="240" y="120" width="8" height="14"/></g>
      <g class="a-town"><rect x="40" y="120" width="28" height="46" rx="2"/><rect x="76" y="112" width="22" height="54" rx="2"/>
      <rect x="300" y="116" width="26" height="50" rx="2"/><rect x="334" y="126" width="30" height="40" rx="2"/></g>
      <path class="a-ground" d="M0 166h400v34H0z"/>
      <g class="a-garden"><rect x="30" y="176" width="100" height="16" rx="3"/><rect x="270" y="176" width="100" height="16" rx="3"/></g>`,
    temple: `<path class="a-sky" d="M0 0h400v150H0z"/><path class="a-m2" d="M0 118 90 70l70 36 70-28 80 42 90-24v26H0z"/>
      <path class="a-water" d="M0 168h400v32H0z"/>
      <g class="a-skyline"><path class="a-dome" d="M168 150V88c0-28 16-48 32-62 16 14 32 34 32 62v62z"/>
      <rect x="176" y="118" width="48" height="32" rx="2"/><rect x="188" y="128" width="10" height="16" rx="3"/><rect x="202" y="128" width="10" height="16" rx="3"/></g>
      <g class="a-town"><rect x="40" y="128" width="28" height="40" rx="2"/><rect x="76" y="118" width="22" height="50" rx="2"/>
      <rect x="292" y="122" width="26" height="46" rx="2"/><rect x="326" y="132" width="30" height="36" rx="2"/></g>
      <circle class="a-glow" cx="200" cy="40" r="18"/>`,
    castle: `<path class="a-sky" d="M0 0h400v150H0z"/><path class="a-m2" d="M0 110 84 46l70 46 62-26 84 50 100-30v34H0z"/>
      <g class="a-castle"><rect x="150" y="94" width="100" height="72" rx="2"/>
      <rect x="140" y="74" width="22" height="92" rx="2"/><rect x="238" y="66" width="24" height="100" rx="2"/><rect x="192" y="58" width="18" height="108" rx="2"/>
      <path class="a-roof" d="M140 74l11-24 11 24zM238 66l12-26 12 26zM192 58l9-26 9 26z"/>
      <g class="a-win"><rect x="166" y="112" width="10" height="18" rx="5"/><rect x="186" y="112" width="10" height="18" rx="5"/>
      <rect x="206" y="112" width="10" height="18" rx="5"/><rect x="226" y="112" width="10" height="18" rx="5"/></g></g>
      <g class="a-tree"><path d="M46 166l12-28 12 28zM82 168l10-24 10 24zM316 166l12-26 12 26zM352 168l10-22 10 22z"/></g>
      <path class="a-ground" d="M0 166h400v34H0z"/>`,
    /* Taiwan day art. Other trips never ask for these themes. */
    skyline: `<rect class="sky" width="400" height="200"/>
      <g class="bld"><rect x="20" y="110" width="30" height="90"/><rect x="60" y="80" width="24" height="120"/>
      <rect x="100" y="100" width="40" height="100"/><rect x="300" y="90" width="28" height="110"/><rect x="340" y="120" width="40" height="80"/></g>
      <g transform="translate(160 20)"><path class="bld" d="M50 160 H90 V40 H50 Z"/><path class="bld" d="M45 40 H95 L88 12 H52 Z"/>
      <rect class="glow" x="66" y="0" width="8" height="14"/><g class="warm" opacity=".9">
      <rect x="55" y="50" width="30" height="3"/><rect x="55" y="75" width="30" height="3"/>
      <rect x="55" y="100" width="30" height="3"/><rect x="55" y="125" width="30" height="3"/></g></g>
      <rect class="land" y="176" width="400" height="24"/>`,
    coast: `<rect class="sky" width="400" height="200"/>
      <path class="land" d="M0 130 Q80 90 140 120 T280 100 T400 130 V200 H0Z"/>
      <path class="water" d="M0 155 H400 V200 H0Z"/>
      <g class="warm"><circle cx="90" cy="70" r="8"/><circle cx="310" cy="60" r="6"/></g>
      <path class="fog" d="M40 150h80M200 160h120"/>
      <g class="bld"><rect x="220" y="95" width="18" height="40"/><rect x="245" y="105" width="14" height="30"/><rect x="265" y="88" width="22" height="47"/></g>`,
    south: `<rect class="sky" width="400" height="200"/>
      <path class="water" d="M0 120 Q120 100 200 130 T400 115 V200 H0Z"/>
      <path class="land" d="M0 160 H400 V200 H0Z"/>
      <g class="warm"><path d="M60 120 L70 70 L80 120Z" opacity=".7"/><path d="M140 125 L148 80 L156 125Z" opacity=".8"/>
      <path d="M300 115 L312 65 L324 115Z" opacity=".75"/></g>
      <g class="bld"><rect x="200" y="70" width="50" height="55" rx="4"/><rect x="260" y="85" width="36" height="40" rx="3"/></g>
      <circle class="glow" cx="340" cy="50" r="16" opacity=".5"/>`,
    farewell: `<rect class="sky" width="400" height="200"/>
      <g class="bld"><path d="M120 170 V80 A40 28 0 0 1 200 80 V170Z"/><path d="M200 170 V80 A40 28 0 0 1 280 80 V170Z"/>
      <rect x="150" y="60" width="20" height="40"/><rect x="230" y="60" width="20" height="40"/></g>
      <path class="water" d="M80 150 Q200 130 320 150 V180 H80Z" opacity=".7"/>
      <rect class="land" y="170" width="400" height="30"/>
      <circle class="glow" cx="200" cy="40" r="20" opacity=".45"/>`,
    lantern: `<rect class="sky" width="400" height="200"/>
      <g class="warm"><path d="M70 150c0-28 18-40 18-62 0 22 18 34 18 62z"/><path d="M170 158c0-32 20-46 20-72 0 26 20 40 20 72z"/>
      <path d="M280 146c0-26 16-36 16-56 0 20 16 30 16 56z"/></g>
      <rect class="land" y="168" width="400" height="32"/>`,
  };

  const artFor = (theme) =>
    `<svg class="card-art" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${
      ART[theme] || ART.city
    }</svg>`;

  /* ── Static sections ─────────────────────────────────────────────────── */
  function renderStatics() {
    byId("heroEyebrow").textContent = TRIP.tagline;
    byId("introLead").textContent = TRIP.intro;

    byId("flagRow").innerHTML = TRIP.countries
      .map((c) => `<span class="flag-pill"><i>${c.flag}</i>${c.name}</span>`)
      .join("");

    byId("glance").innerHTML = TRIP.glance
      .map(
        (g) => `<div class="glance-cell reveal">
          <span class="glance-ico">${ICON[g.icon] || ICON.star}</span>
          <b>${g.value}</b><span class="glance-label">${g.label}</span>
        </div>`
      )
      .join("");

    byId("highlightGrid").innerHTML = TRIP.highlights
      .map(
        (h) => `<article class="card highlight reveal">
          <span class="hl-ico">${ICON[h.icon] || ICON.star}</span>
          <h3>${h.title}</h3><p>${h.text}</p>
        </article>`
      )
      .join("");

    if (byId("tipsList") && TRIP.tips) {
      byId("tipsList").innerHTML = TRIP.tips
        .map((l) => `<li><span class="tick">${ICON.check}</span>${l}</li>`)
        .join("");
    }

    if (byId("staysList") && TRIP.stays) {
      byId("staysList").innerHTML = TRIP.stays
        .map(
          (s) => `<li><span class="stay-ico">${ICON.bed}</span>
            <span><b>${s.place}</b><em>${s.detail}</em></span></li>`
        )
        .join("");
    }

    if (byId("lessonsList") && TRIP.lessons) {
      byId("lessonsList").innerHTML = TRIP.lessons
        .map((l) => `<li><span class="tick">${ICON.check}</span>${l}</li>`)
        .join("");
    }

    if (byId("wayHomeList") && TRIP.wayHome) {
      byId("wayHomeList").innerHTML = TRIP.wayHome
        .map((w) => `<li><b>${w.label}</b><span>${w.value}</span></li>`)
        .join("");
    }

    if (byId("heroStats") && TRIP.heroStats) {
      byId("heroStats").innerHTML = TRIP.heroStats
        .map((s) => `<div class="cd-cell"><b>${s.value}</b><span>${s.label}</span></div>`)
        .join("");
      if (byId("cdLabel")) {
        byId("cdLabel").textContent = `${fmtDate(TRIP.startDate, { day: "numeric" })} – ${fmtDate(
          TRIP.endDate,
          { day: "numeric", month: "long", year: "numeric" }
        )} · trip complete`;
      }
    }

    if (byId("bookingGrid")) {
      const KIND_ICON = { flight: "plane", train: "train", hotel: "bed", ferry: "boat", ticket: "ticket" };
      const bookings = TRIP.bookings || [];
      /* Layover legs, a boarding photo, and an arrival line render only when that booking has them. */
      const layover = (b) => {
        const legs =
          Array.isArray(b.legs) && b.legs.length
            ? `<ol class="bk-legs">${b.legs
                .map(
                  (l) => `<li>
              <b>${l.from} → ${l.to}</b>
              ${l.when ? `<span class="when">${l.when}</span>` : ""}
              ${l.note ? `<p>${l.note}</p>` : ""}
            </li>`
                )
                .join("")}</ol>`
            : "";
        const arrive = b.arrive ? `<p class="bk-arrive"><b>Arrived.</b> ${b.arrive}</p>` : "";
        const shot =
          b.image && !b.qr
            ? `<figure class="boarding-shot"><img src="${b.image}" alt="${b.imageAlt || "Boarding confirmation"}" loading="lazy" /></figure>`
            : "";
        return arrive + legs + shot;
      };
      const pass = (b) => `<article class="card ticket reveal" data-ticket="${b.id || ""}">
          ${b.image ? `<img class="ticket-img" src="${b.image}" alt="${b.title}" loading="lazy" />` : ""}
          <div class="ticket-body">
            ${b.promo ? `<span class="promo-pill">Promo · ${b.promo}</span>` : ""}
            <p class="bk-kind">${b.kind}</p>
            <h3>${b.title}</h3>
            <p>${b.detail}</p>
            ${b.when ? `<p class="bk-when">${b.when}</p>` : ""}
            <div class="ticket-actions">
              ${b.qr ? `<button type="button" class="btn" data-qr="${b.id}">Show QR</button>` : ""}
              ${
                b.href
                  ? `<a class="btn primary" href="${b.href}" target="_blank" rel="noopener">Klook link</a>`
                  : ""
              }
              ${
                b.qr
                  ? `<button type="button" class="ticket-qr-thumb" data-qr="${b.id}" aria-label="Enlarge QR for ${b.title}">
                <img src="${b.qr}" alt="" />
              </button>`
                  : ""
              }
            </div>
          </div>
        </article>`;
      byId("bookingGrid").innerHTML = bookings.length
        ? bookings
            .map((b) =>
              b.qr
                ? pass(b)
                : `<article class="card booking reveal">
          <span class="bk-ico">${ICON[KIND_ICON[b.kind] || "star"]}</span>
          <p class="bk-kind">${b.kind}</p>
          <h3>${b.title}</h3>
          <p>${b.detail}</p>
          <p class="bk-when">${b.when}</p>
          ${b.ref && b.ref !== "—" ? `<p class="bk-ref">Ref · ${b.ref}</p>` : ""}
          ${b.extra ? `<p class="muted">${b.extra}</p>` : ""}
          ${layover(b)}
        </article>`
            )
            .join("")
        : TRIP.emptyBookings
          ? `<p class="empty-state">Nothing was booked ahead — the days below are how the trip went.</p>`
          : "";
    }

    if (TRIP.spending && byId("spendingTotals")) {
      const money = (amount, currency) =>
        new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-IE", {
          style: "currency",
          currency,
          minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
          maximumFractionDigits: 2,
        }).format(amount);
      const toInr = (amount, currency) =>
        currency === "INR" ? amount : amount * ((TRIP.spending.fx && TRIP.spending.fx[currency]) || 0);
      const partsLabel = (parts) => parts.map((part) => money(part.amount, part.currency)).join(" + ");
      const polar = (cx, cy, r, deg) => {
        const rad = ((deg - 90) * Math.PI) / 180;
        return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
      };
      const slicePath = (start, end, outer, inner) => {
        const large = end - start > 180 ? 1 : 0;
        const [ox1, oy1] = polar(50, 50, outer, start);
        const [ox2, oy2] = polar(50, 50, outer, end);
        const [ix2, iy2] = polar(50, 50, inner, end);
        const [ix1, iy1] = polar(50, 50, inner, start);
        return `M ${ox1} ${oy1} A ${outer} ${outer} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`;
      };

      byId("spendingRecorded").textContent = `Recorded ${TRIP.spending.recordedOn}`;
      byId("spendingTotals").innerHTML = TRIP.spending.totals
        .map(
          (total) =>
            `<strong><span>${money(total.amount, total.currency)}</span><small>${total.currency}</small></strong>`
        )
        .join('<i aria-hidden="true">+</i>');
      byId("spendingNote").textContent = TRIP.spending.note;

      const slices = TRIP.spending.categories.map((category, index) => ({
        ...category,
        inr: category.parts.reduce((sum, part) => sum + toInr(part.amount, part.currency), 0),
        color: ["var(--accent)", "var(--ochre)", "var(--sage)"][index % 3],
      }));
      const pieTotal = slices.reduce((sum, slice) => sum + slice.inr, 0);

      byId("spendingCategories").innerHTML = slices
        .map(
          (category) => `<article class="ledger-category card">
            <span class="ledger-icon">${ICON[category.icon] || ICON.star}</span>
            <span>
              <small>${category.name}</small>
              <b>${partsLabel(category.parts)}</b>
            </span>
          </article>`
        )
        .join("");

      let angle = 0;
      const arcs = slices
        .map((slice) => {
          const span = pieTotal ? (slice.inr / pieTotal) * 360 : 0;
          const start = angle;
          const end = angle + Math.max(span, span > 0 ? 0.4 : 0);
          angle = end;
          const mid = start + span / 2;
          const [lx, ly] = polar(50, 50, 33, mid);
          const pct = pieTotal ? Math.round((slice.inr / pieTotal) * 100) : 0;
          return `<path d="${slicePath(start, end, 46, 24)}" fill="${slice.color}"></path>
            ${pct >= 8 ? `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${pct}%</text>` : ""}`;
        })
        .join("");
      byId("spendingPie").innerHTML = `<svg viewBox="0 0 100 100" role="img" aria-label="Spending by category">
          ${arcs}
          <circle cx="50" cy="50" r="22" class="pie-hole"></circle>
        </svg>`;
      byId("spendingLegend").innerHTML = slices
        .map(
          (slice) => `<li>
            <i style="background:${slice.color}"></i>
            <span>${slice.name}</span>
            <b>${pieTotal ? Math.round((slice.inr / pieTotal) * 100) : 0}%</b>
          </li>`
        )
        .join("");

      byId("expenseList").innerHTML = `
        <div class="expense-head">
          <span>Expense</span><span>Date</span><span>Amount</span>
        </div>
        ${TRIP.spending.entries
          .map(
            (entry) => `<article class="expense-row">
              <span class="expense-what">
                <i>${ICON[entry.icon] || ICON.star}</i>
                <span><small>${entry.category}</small><b>${entry.description}</b></span>
              </span>
              <time>${entry.date}</time>
              <strong>${money(entry.amount, entry.currency)}</strong>
            </article>`
          )
          .join("")}`;
    }

    byId("seqList").innerHTML = TRIP.places
      .filter((p) => p.day)
      .sort((a, b) => a.day - b.day || a.name.localeCompare(b.name))
      .map(
        (p) =>
          `<li><button type="button" data-seq="${p.day}"><em>${p.span || p.day}</em>${p.name}${
            p.side ? '<i class="seq-side">day trip</i>' : ""
          }</button></li>`
      )
      .join("");
  }

  /* ── Day cards ───────────────────────────────────────────────────────── */
  const state = { view: "grid", q: "", countries: new Set() };

  function storyBits(story) {
    if (!story) return [];
    if (typeof story === "string") return [story];
    if (!Array.isArray(story)) return [];
    return story.flatMap((s) => (s && typeof s === "object" ? [s.t, s.text] : [s]));
  }

  function storyBlock(story) {
    if (!story) return "";
    if (Array.isArray(story)) {
      return `<section class="m-block"><h4>How it went</h4><ol class="story-list">${story
        .map((s) => `<li><b>${s.t}</b><span>${s.text}</span></li>`)
        .join("")}</ol></section>`;
    }
    return `<section class="m-block"><h4>How it went</h4><p class="m-story">${story}</p></section>`;
  }

  function passLinks(d) {
    if (!Array.isArray(d.tickets) || !d.tickets.length) return "";
    const linked = d.tickets
      .map((id) => (TRIP.bookings || []).find((b) => b.id === id))
      .filter((b) => b && b.href);
    if (!linked.length) return "";
    return `<section class="m-block"><h4>Tickets</h4><div class="modal-tickets">${linked
      .map((t) => `<a href="${t.href}" target="_blank" rel="noopener">${ICON.ticket}${t.title}</a>`)
      .join("")}</div></section>`;
  }

  function dayHaystack(d) {
    return [
      d.city,
      d.subtitle,
      country(d.country).name,
      d.stay,
      ...(d.activities || []),
      ...(d.schedule || []).map((s) => s.text),
      ...(d.legs || []).map((l) => l.text),
      ...storyBits(d.story),
      d.note,
    ]
      .join(" ")
      .toLowerCase();
  }

  function visibleDays() {
    return TRIP.days.filter((d) => {
      if (state.countries.size && !state.countries.has(d.country) && !state.countries.has(d.also))
        return false;
      if (state.q && !dayHaystack(d).includes(state.q)) return false;
      return true;
    });
  }

  function cardHTML(d) {
    const bullets = d.schedule
      ? d.schedule
          .map((s) => `<li class="timed"><b>${s.time}</b><span>${s.text}</span></li>`)
          .join("")
      : (d.activities || []).map((a) => `<li>${a}</li>`).join("");

    return `<article class="card day-card reveal" data-day="${d.n}" tabindex="0" role="button"
        aria-label="Day ${d.n}, ${d.city}. Open details.">
        <div class="card-media theme-${d.theme}">
          ${artFor(d.theme)}
          <span class="day-badge">${String(d.n).padStart(2, "0")}</span>
          <span class="date-badge">${fmtDate(d.date)} · ${weekday(d.date)}</span>
          ${d.badge ? `<span class="tour-badge">${d.badge}</span>` : ""}
        </div>
        <div class="card-body">
          <header class="card-title">
            <h3>${d.city}</h3>
            ${countryTag(d)}
          </header>
          <p class="card-sub">${d.subtitle}</p>
          <ul class="bullets">${bullets}</ul>
        </div>
        <footer class="card-foot">
          <span class="stay">${ICON.bed}${d.stay ? `Stay: ${d.stay}` : "Travelling home"}</span>
          <span class="legs">${(d.legs || [])
            .map((l) => `<i title="${l.text}">${ICON[l.mode] || ICON.train}</i>`)
            .join("")}</span>
        </footer>
      </article>`;
  }

  function timelineHTML(d) {
    const items = d.schedule
      ? d.schedule.map((s) => `<li class="timed"><b>${s.time}</b><span>${s.text}</span></li>`).join("")
      : (d.activities || []).map((a) => `<li>${a}</li>`).join("");

    return `<article class="tl-row reveal" data-day="${d.n}" tabindex="0" role="button"
        aria-label="Day ${d.n}, ${d.city}. Open details.">
        <div class="tl-rail"><span class="tl-dot">${d.n}</span></div>
        <div class="card tl-card theme-${d.theme}">
          <div class="tl-head">
            <div>
              <p class="tl-date">${fmtDate(d.date, { weekday: "long", day: "numeric", month: "long" })}</p>
              <h3>${d.city} ${countryTag(d)}</h3>
              <p class="card-sub">${d.subtitle}</p>
            </div>
            <span class="tl-thumb theme-${d.theme}">${artFor(d.theme)}</span>
          </div>
          <ul class="bullets">${items}</ul>
          <div class="tl-meta">
            <span class="stay">${ICON.bed}${d.stay ? `Stay: ${d.stay}` : "Travelling home"}</span>
            ${(d.legs || [])
              .map(
                (l) =>
                  `<span class="leg-chip">${ICON[l.mode] || ICON.train}${l.text}${
                    l.duration ? ` · ${l.duration}` : ""
                  }</span>`
              )
              .join("")}
          </div>
        </div>
      </article>`;
  }

  function renderDays() {
    const days = visibleDays();
    const grid = byId("dayGrid");
    grid.classList.toggle("is-timeline", state.view === "timeline");
    grid.innerHTML = days
      .map((d) => (state.view === "grid" ? cardHTML(d) : timelineHTML(d)))
      .join("");
    byId("emptyState").hidden = days.length > 0;
    observeReveals();
    syncMapDim(days.map((d) => d.n));
  }

  byId("dayGrid").addEventListener("click", (e) => {
    const host = e.target.closest("[data-day]");
    if (host) openDay(+host.dataset.day);
  });
  byId("dayGrid").addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const host = e.target.closest("[data-day]");
    if (!host) return;
    e.preventDefault();
    openDay(+host.dataset.day);
  });

  /* ── Toolbar: search, country chips, view toggle ─────────────────────── */
  const countryChips = byId("countryChips");
  if (countryChips) countryChips.innerHTML = TRIP.countries
    .map(
      (c) =>
        `<button type="button" class="chip" data-country="${c.code}"><i>${c.flag}</i>${c.name}
          <em>${TRIP.days.filter((d) => d.country === c.code).length}</em></button>`
    )
    .join("");

  if (countryChips) countryChips.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-country]");
    if (!chip) return;
    const code = chip.dataset.country;
    state.countries.has(code) ? state.countries.delete(code) : state.countries.add(code);
    chip.classList.toggle("is-on", state.countries.has(code));
    renderDays();
  });

  const search = byId("search");
  if (search) search.addEventListener("input", () => {
    state.q = search.value.trim().toLowerCase();
    renderDays();
  });

  $$(".view-toggle button").forEach((btn) =>
    btn.addEventListener("click", () => {
      $$(".view-toggle button").forEach((b) => b.classList.toggle("is-active", b === btn));
      state.view = btn.dataset.view;
      renderDays();
    })
  );

  if (byId("clearFilters")) byId("clearFilters").addEventListener("click", () => {
    state.q = "";
    state.countries.clear();
    search.value = "";
    $$("[data-country]").forEach((c) => c.classList.remove("is-on"));
    renderDays();
  });

  /* ── Modal ───────────────────────────────────────────────────────────── */
  const modal = byId("modal");
  let openIndex = -1;

  function openDay(n) {
    const i = TRIP.days.findIndex((d) => d.n === n);
    if (i < 0) return;
    openIndex = i;
    const d = TRIP.days[i];
    const c = country(d.country);

    byId("modalDayNum").textContent = String(d.n).padStart(2, "0");
    byId("modalDate").textContent = fmtDate(d.date, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    byId("modalCity").textContent = d.city;
    const b = d.also ? country(d.also) : null;
    byId("modalSub").innerHTML = `${d.subtitle} <span class="country-tag">${
      b ? `${c.flag}${b.flag} ${c.name} → ${b.name}` : `${c.flag} ${c.name}`
    }</span>`;
    byId("modalHero").className = `modal-hero theme-${d.theme}`;

    const plan = d.schedule
      ? `<ol class="sched">${d.schedule
          .map((s) => `<li><span class="s-time">${ICON.clock}${s.time}</span><span>${s.text}</span></li>`)
          .join("")}</ol>`
      : `<ul class="bullets big">${(d.activities || []).map((a) => `<li>${a}</li>`).join("")}</ul>`;

    byId("modalBody").innerHTML = `
      <div class="modal-art theme-${d.theme}">${artFor(d.theme)}</div>
      ${storyBlock(d.story)}
      <section class="m-block">
        <h4>${d.schedule ? "Schedule" : "Plan for the day"}</h4>
        ${plan}
      </section>
      ${passLinks(d)}
      <section class="m-block">
        <h4>Getting around</h4>
        <ul class="leg-list">${(d.legs || [])
          .map(
            (l) => `<li><span class="leg-ico ${l.mode}">${ICON[l.mode] || ICON.train}</span>
              <span><b>${l.text}</b>${l.duration ? `<em>${l.duration}</em>` : ""}</span></li>`
          )
          .join("")}</ul>
      </section>
      <section class="m-block">
        <h4>Overnight</h4>
        <p class="stay-line">${ICON.bed}${d.stay ? `<b>${d.stay}</b>` : "<b>In transit</b>"}</p>
      </section>
      ${d.note ? `<aside class="m-note">${ICON.sparkle}<p>${d.note}</p></aside>` : ""}`;

    byId("modalCounter").textContent = d.epilogue
      ? "Epilogue · the way home"
      : `Day ${d.n} of ${TRIP.days.filter((x) => !x.epilogue).length}`;
    byId("prevDay").disabled = i === 0;
    byId("nextDay").disabled = i === TRIP.days.length - 1;

    modal.hidden = false;
    document.body.classList.add("no-scroll");
    requestAnimationFrame(() => modal.classList.add("is-open"));
    byId("modalClose").focus();
    history.replaceState(null, "", `#day-${d.n}`);
  }

  function closeModal() {
    modal.classList.remove("is-open");
    document.body.classList.remove("no-scroll");
    setTimeout(() => (modal.hidden = true), 200);
    openIndex = -1;
    history.replaceState(null, "", location.pathname + location.search);
  }

  const step = (delta) => {
    const next = openIndex + delta;
    if (next >= 0 && next < TRIP.days.length) openDay(TRIP.days[next].n);
  };

  byId("modalClose").addEventListener("click", closeModal);
  byId("prevDay").addEventListener("click", () => step(-1));
  byId("nextDay").addEventListener("click", () => step(1));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  let closeQr = null;

  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName);
    const qr = byId("qrModal");
    if (qr && qr.hidden === false) {
      if (e.key === "Escape" && closeQr) closeQr();
      return;
    }
    if (modal.hidden === false) {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
      return;
    }
    if (typing) return;
    if (e.key === "/") {
      e.preventDefault();
      search.focus();
    }
    if (e.key.toLowerCase() === "t") toggleTheme();
  });

  /* ── Route map ───────────────────────────────────────────────────────── */
  const MAP = { w: 1000, h: 620, pad: 66 };

  function project() {
    // Mercator y, expressed in degrees so it shares units with longitude.
    const merc = (lat) =>
      (Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 180 / 2)) * 180) / Math.PI;
    const xs = TRIP.places.map((p) => p.lon);
    const ys = TRIP.places.map((p) => merc(p.lat));
    const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
    const [y0, y1] = [Math.min(...ys), Math.max(...ys)];
    const sx = (MAP.w - MAP.pad * 2) / (x1 - x0);
    const sy = (MAP.h - MAP.pad * 2) / (y1 - y0);
    const s = Math.min(sx, sy);
    const ox = (MAP.w - (x1 - x0) * s) / 2;
    const oy = (MAP.h - (y1 - y0) * s) / 2;
    return (p) => ({
      x: ox + (p.lon - x0) * s,
      y: MAP.h - (oy + (merc(p.lat) - y0) * s),
    });
  }

  const pos = {};

  function drawMap() {
    if (!byId("routeSvg") || !TRIP.places) return;
    const to = project();
    TRIP.places.forEach((p) => (pos[p.id] = to(p)));

    // subtle graticule
    const grid = [];
    for (let x = 60; x < MAP.w; x += 70) grid.push(`<path d="M${x} 0V${MAP.h}"/>`);
    for (let y = 50; y < MAP.h; y += 70) grid.push(`<path d="M0 ${y}H${MAP.w}"/>`);
    byId("mapGrid").innerHTML = `<g class="grat">${grid.join("")}</g>
      ${(TRIP.regions || [])
        .map((r) => {
          const q = to(r);
          return `<text class="map-country" x="${q.x}" y="${q.y}">${r.name}</text>`;
        })
        .join("")}`;

    // routes as gentle arcs
    byId("mapRoutes").innerHTML = (TRIP.route || [])
      .map(([a, b, mode], i) => {
        const p = pos[a],
          q = pos[b];
        const mx = (p.x + q.x) / 2,
          my = (p.y + q.y) / 2;
        const dx = q.x - p.x,
          dy = q.y - p.y;
        const len = Math.hypot(dx, dy) || 1;
        const bow = mode === "day" ? 26 : 34;
        const cx = mx - (dy / len) * bow,
          cy = my + (dx / len) * bow;
        return `<path class="route ${mode}" style="--i:${i}" d="M${p.x} ${p.y} Q${cx} ${cy} ${q.x} ${q.y}"/>`;
      })
      .join("");

    // pins
    byId("mapPins").innerHTML = TRIP.places
      .map((p) => {
        const q = pos[p.id];
        const label = p.span || p.day || (p.kind === "air" ? "✈" : "·");
        const cls = ["pin", p.side ? "is-side" : "", p.kind === "air" ? "is-air" : ""].join(" ");
        return `<g class="${cls}" data-place="${p.id}" ${p.day ? `data-day="${p.day}"` : ""}
            transform="translate(${q.x} ${q.y})" tabindex="0" role="button" aria-label="${p.name}">
            <circle class="pin-halo" r="18"/>
            <circle class="pin-dot" r="11"/>
            <text class="pin-num" y="4">${label}</text>
            <text class="pin-label" x="${p.ldx || 0}" y="${p.ldy || -20}">${p.name}</text>
          </g>`;
      })
      .join("");

    const svg = byId("routeSvg");
    const tip = byId("mapTip");

    // Draw the route only once it is on screen, so the animation is actually seen.
    new IntersectionObserver(
      (entries, obs) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          byId("mapRoutes").classList.add("is-live");
          obs.disconnect();
        }),
      { threshold: 0.25 }
    ).observe($(".map-canvas"));

    svg.addEventListener("mousemove", (e) => {
      const g = e.target.closest(".pin");
      if (!g) {
        tip.hidden = true;
        return;
      }
      const p = TRIP.places.find((x) => x.id === g.dataset.place);
      const d = p.day ? TRIP.days.find((x) => x.n === p.day) : null;
      tip.innerHTML = `<b>${p.name}</b>${
        d
          ? `<span>Day ${p.span || d.n} · ${fmtDate(d.date)}</span><em>${d.subtitle}</em>`
          : "<span>Arrival airport</span>"
      }`;
      const r = svg.getBoundingClientRect();
      tip.style.left = `${e.clientX - r.left}px`;
      tip.style.top = `${e.clientY - r.top}px`;
      tip.hidden = false;
    });
    svg.addEventListener("mouseleave", () => (tip.hidden = true));

    const activate = (g) => {
      if (g && g.dataset.day) openDay(+g.dataset.day);
    };
    svg.addEventListener("click", (e) => activate(e.target.closest(".pin")));
    svg.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        activate(e.target.closest(".pin"));
      }
    });
  }

  function syncMapDim(visibleDayNumbers) {
    const on = new Set(visibleDayNumbers);
    const filtering = on.size !== TRIP.days.length;
    $$("#mapPins .pin").forEach((g) => {
      const d = g.dataset.day;
      g.classList.toggle("is-dim", filtering && d && !on.has(+d));
    });
  }

  byId("seqList").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-seq]");
    if (btn) openDay(+btn.dataset.seq);
  });

  byId("seqList").addEventListener("mouseover", (e) => {
    const btn = e.target.closest("[data-seq]");
    $$("#mapPins .pin").forEach((g) =>
      g.classList.toggle("is-hot", !!btn && g.dataset.day === btn.dataset.seq)
    );
  });
  byId("seqList").addEventListener("mouseleave", () =>
    $$("#mapPins .pin").forEach((g) => g.classList.remove("is-hot"))
  );


  /* Old scripts stored packing and theme as goa2021.pack, tawang2026.theme, and so on.
     Copy once into the canonical id key and leave the old key in place.
     Thailand and Singapore are omitted: their scripts wrote finland2026.*, which is Finland's. */
  const LEGACY_STEM = {
    "taiwan-2026": "taiwan2026",
    "europe-2026": "europe2026",
    "puri-2026": "puri2026",
    "tawang-2026": "tawang2026",
    "jaipur-2021": "jaipur2021",
    "goa-2021": "goa2021",
    "srinagar-2022": "srinagar2022",
    "gangtok-2022": "gangtok2022",
    "manali-2022": "manali2022",
    "kerala-2022": "kerala2022",
    "rajasthan-2022": "rajasthan2022",
    "munnar-2022": "munnar2022",
    "finland-2026": "finland2026",
    "hong-kong-2025": "hongkong2025",
    "lansdowne-2025": "lansdowne2025",
    "kanyakumari-2024": "kanyakumari2024",
    "rishikesh-2024": "rishikesh2024",
    "shillong-2024": "shillong2024",
    "gujarat-2024": "gujarat2024",
    "dharamshala-2024": "dharamshala2024",
    "bali-2024": "bali2024",
  };

  function storageKey(suffix) {
    const next = `${TRIP.id}.${suffix}`;
    try {
      if (localStorage.getItem(next) == null) {
        const stem = LEGACY_STEM[TRIP.id];
        const prev = stem ? localStorage.getItem(`${stem}.${suffix}`) : null;
        if (prev != null) localStorage.setItem(next, prev);
      }
    } catch (err) { /* private mode, or a blocked store */ }
    return next;
  }

  /* ── Packing checklist ───────────────────────────────────────────────── */
  const PACK_KEY = storageKey("pack");
  let packed = new Set();
  if (byId("packList") && Array.isArray(TRIP.packing)) {
    try { packed = new Set(JSON.parse(localStorage.getItem(PACK_KEY) || "[]")); }
    catch (err) { packed = new Set(); }
  }

  function renderPack() {
    if (!byId("packList") || !Array.isArray(TRIP.packing)) return;
    byId("packList").innerHTML = TRIP.packing
      .map(
        (item, i) => `<li>
          <label class="check ${packed.has(String(i)) ? "is-done" : ""}">
            <input type="checkbox" data-pack="${i}" ${packed.has(String(i)) ? "checked" : ""} />
            <span class="box">${ICON.check}</span><span class="txt">${item}</span>
          </label></li>`
      )
      .join("");
    updatePackMeter();
  }
  function updatePackMeter() {
    const total = TRIP.packing.length;
    const done = packed.size;
    byId("packCount").textContent = `${done} / ${total}`;
    byId("packBar").style.width = `${(done / total) * 100}%`;
  }
  if (byId("packList") && Array.isArray(TRIP.packing)) byId("packList").addEventListener("change", (e) => {
    const box = e.target.closest("[data-pack]");
    if (!box) return;
    const id = box.dataset.pack;
    box.checked ? packed.add(id) : packed.delete(id);
    box.closest(".check").classList.toggle("is-done", box.checked);
    localStorage.setItem(PACK_KEY, JSON.stringify([...packed]));
    updatePackMeter();
  });
  if (byId("resetPack")) byId("resetPack").addEventListener("click", () => {
    packed = new Set();
    localStorage.removeItem(PACK_KEY);
    renderPack();
  });

  /* ── Countdown ───────────────────────────────────────────────────────── */
  function tick() {
    const start = new Date(TRIP.startDate + "T15:00:00");
    const end = new Date(TRIP.endDate + "T23:59:59");
    const now = new Date();
    let target = start,
      label = TRIP.countdownLabel || "until departure";

    if (now >= start && now <= end) {
      const dayNo = Math.min(TRIP.days.length, Math.floor((now - start) / 86400000) + 1);
      label = `you're on day ${dayNo} of the trip`;
      target = end;
    } else if (now > end) {
      byId("countdown").classList.add("is-done");
      byId("cdLabel").textContent = "trip complete";
      $$("[data-cd]").forEach((el) => (el.textContent = "✓"));
      return;
    }

    const diff = Math.max(0, target - now);
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff / 3600000) % 24);
    const m = Math.floor((diff / 60000) % 60);
    const s = Math.floor((diff / 1000) % 60);
    const set = (k, v) => {
      const el = $(`[data-cd="${k}"]`);
      const txt = String(v).padStart(2, "0");
      if (el && el.textContent !== txt) {
        el.textContent = txt;
        el.classList.remove("bump");
        void el.offsetWidth;
        el.classList.add("bump");
      }
    };
    set("days", d);
    set("hours", h);
    set("mins", m);
    set("secs", s);
    byId("cdLabel").textContent = label;
  }

  /* ── Theme ───────────────────────────────────────────────────────────── */
  const THEME_KEY = storageKey("theme");
  function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(THEME_KEY, t);
  }
  function toggleTheme() {
    applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  }
  applyTheme(
    localStorage.getItem(THEME_KEY) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  );
  byId("themeBtn").addEventListener("click", toggleTheme);
  byId("printBtn").addEventListener("click", () => window.print());

  /* Sidebar drawer */
  const menuBtn = byId("menuBtn");
  const backdrop = byId("sidebarBackdrop");
  function setNav(open) {
    document.body.classList.toggle("nav-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    backdrop.hidden = !open;
  }
  menuBtn.addEventListener("click", () => setNav(!document.body.classList.contains("nav-open")));
  backdrop.addEventListener("click", () => setNav(false));
  $$(".sidebar a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) setNav(false);
  });

  const navLinks = $$(".side-nav [data-nav]");
  const sections = navLinks.map((a) => byId(a.dataset.nav)).filter(Boolean);
  if (sections.length) {
    const navIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          navLinks.forEach((a) => a.classList.toggle("is-active", a.dataset.nav === en.target.id));
        });
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => navIo.observe(s));
  }

  /* ── Scroll behaviour ────────────────────────────────────────────────── */
  const bar = byId("scrollBar");
  const toTop = byId("toTop");
  function onScroll() {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${Math.min(100, (window.scrollY / (h || 1)) * 100)}%`;
    toTop.hidden = window.scrollY < 600;
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  let io;
  function observeReveals() {
    if (!io) {
      io = new IntersectionObserver(
        (entries) =>
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io.unobserve(en.target);
            }
          }),
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
      );
    }
    $$(".reveal:not(.in)").forEach((el) => io.observe(el));
  }

  /* ── Deep links: index.html#day-6 opens that day ─────────────────────── */
  function openFromHash() {
    const m = location.hash.match(/^#day-(\d+)$/);
    if (m) openDay(+m[1]);
  }
  window.addEventListener("hashchange", openFromHash);

  /* Klook QR lightbox. Mounted only when a booking carries a qr image. */
  function mountQrLightbox() {
    if (byId("qrModal") || !byId("bookingGrid")) return;
    if (!(TRIP.bookings || []).some((b) => b.qr)) return;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    backdrop.id = "qrModal";
    backdrop.hidden = true;
    backdrop.innerHTML = `<div class="qr-modal" role="dialog" aria-modal="true" aria-labelledby="qrTitle">
        <button class="modal-close" id="qrClose" type="button" aria-label="Close">&times;</button>
        <h3 id="qrTitle"></h3>
        <img id="qrImg" alt="QR code" />
        <p class="muted" id="qrBlurb"></p>
        <a class="btn primary" id="qrLink" href="#" target="_blank" rel="noopener">Open on Klook</a>
      </div>`;
    document.body.appendChild(backdrop);

    closeQr = () => {
      backdrop.classList.remove("is-open");
      if (modal.hidden !== false) document.body.classList.remove("no-scroll");
      setTimeout(() => {
        backdrop.hidden = true;
      }, 200);
    };
    const openQr = (id) => {
      const t = (TRIP.bookings || []).find((x) => x.id === id);
      if (!t) return;
      byId("qrTitle").textContent = t.title;
      byId("qrImg").src = t.qr;
      byId("qrImg").alt = `QR code for ${t.title}`;
      byId("qrBlurb").textContent = t.detail || "";
      const link = byId("qrLink");
      link.href = t.href || "#";
      link.hidden = !t.href;
      backdrop.hidden = false;
      document.body.classList.add("no-scroll");
      requestAnimationFrame(() => backdrop.classList.add("is-open"));
      byId("qrClose").focus();
    };
    byId("bookingGrid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-qr]");
      if (btn) openQr(btn.dataset.qr);
    });
    byId("qrClose").addEventListener("click", closeQr);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) closeQr();
    });
  }

  /* ── Boot ────────────────────────────────────────────────────────────── */
  if (new URLSearchParams(location.search).get("view") === "timeline") {
    state.view = "timeline";
    $$(".view-toggle button").forEach((b) => b.classList.toggle("is-active", b.dataset.view === "timeline"));
  }

  renderStatics();
  mountQrLightbox();
  if (byId("packList")) renderPack();
  renderDays();
  if (byId("routeSvg")) drawMap();
  if (byId("countdown")) {
    tick();
    setInterval(tick, 1000);
  }
  onScroll();
  observeReveals();
  openFromHash();
})();
