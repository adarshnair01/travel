const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const HEX = /^#[0-9a-fA-F]{3,8}$/;
const URL = /^https?:\/\/\S+$/;

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);

function isoOk(value) {
  if (typeof value !== "string" || !ISO.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function req(errors, ok, message) {
  if (!ok) errors.push(message);
}

function str(v) {
  return typeof v === "string" && v.trim().length > 0;
}

export function validateTrip(doc, file) {
  const errors = [];
  const where = file || doc?.id || "trip";
  const fail = (message) => errors.push(`${where}: ${message}`);

  req(errors, doc?.schema === 1, `${where}: schema must be 1`);
  req(errors, str(doc?.id) && ID.test(doc.id), `${where}: id must be a kebab-case string`);
  req(errors, Number.isInteger(doc?.year) && doc.year >= 2000, `${where}: year must be an integer`);
  req(errors, str(doc?.slug), `${where}: slug is required`);

  const catalog = doc?.catalog;
  req(errors, isObj(catalog), `${where}: catalog is required`);
  if (isObj(catalog)) {
    req(errors, catalog.id === doc.id, `${where}: catalog.id must match id`);
    req(errors, catalog.year === doc.year, `${where}: catalog.year must match year`);
    req(errors, catalog.scope === "domestic" || catalog.scope === "international", `${where}: catalog.scope must be domestic or international`);
    req(errors, catalog.status === "done" || catalog.status === "upcoming", `${where}: catalog.status must be done or upcoming`);
    for (const key of ["title", "when", "tagline", "summary", "cta", "theme"]) {
      req(errors, str(catalog[key]), `${where}: catalog.${key} is required`);
    }
    req(errors, isoOk(catalog.startDate) && isoOk(catalog.endDate), `${where}: catalog dates must be YYYY-MM-DD`);
    req(errors, catalog.startDate <= catalog.endDate, `${where}: catalog startDate is after endDate`);
    req(errors, Array.isArray(catalog.places) && catalog.places.every(str), `${where}: catalog.places must be a list of names`);
    req(
      errors,
      Array.isArray(catalog.stats) &&
        catalog.stats.every((s) => isObj(s) && str(String(s.value)) && str(s.label)),
      `${where}: catalog.stats must be value/label pairs`
    );
    if (catalog.accentLight) req(errors, HEX.test(catalog.accentLight), `${where}: catalog.accentLight must be a hex color`);
    if (catalog.accentDark) req(errors, HEX.test(catalog.accentDark), `${where}: catalog.accentDark must be a hex color`);
  }

  const trip = doc?.trip;
  req(errors, isObj(trip), `${where}: trip is required`);
  if (!isObj(trip)) return errors;

  req(errors, trip.id === doc.id, `${where}: trip.id must match id`);
  req(errors, str(trip.title) && str(trip.kicker) && str(trip.tagline), `${where}: trip title, kicker, and tagline are required`);
  req(errors, isoOk(trip.startDate) && isoOk(trip.endDate), `${where}: trip dates must be YYYY-MM-DD`);
  req(errors, trip.startDate <= trip.endDate, `${where}: trip startDate is after endDate`);
  if (isObj(catalog) && isoOk(trip.startDate)) {
    req(errors, trip.startDate === catalog.startDate && trip.endDate === catalog.endDate, `${where}: catalog dates must match the trip`);
  }
  if (trip.wanderlog) req(errors, URL.test(trip.wanderlog), `${where}: wanderlog must be an http(s) URL`);
  if (trip.tripDays != null) req(errors, Number.isInteger(trip.tripDays) && trip.tripDays > 0, `${where}: tripDays must be a positive integer`);

  req(errors, Array.isArray(trip.countries) && trip.countries.length > 0, `${where}: countries are required`);
  const codes = new Set();
  for (const c of trip.countries || []) {
    req(errors, isObj(c) && str(c.code) && str(c.name) && str(c.flag), `${where}: each country needs code, name, and flag`);
    if (c?.code) {
      req(errors, !codes.has(c.code), `${where}: duplicate country code ${c.code}`);
      codes.add(c.code);
    }
  }

  req(errors, Array.isArray(trip.glance) && trip.glance.length > 0, `${where}: glance is required`);
  for (const g of trip.glance || []) {
    req(errors, isObj(g) && str(g.icon) && str(String(g.value)) && str(g.label), `${where}: each glance cell needs icon, value, and label`);
  }

  req(errors, Array.isArray(trip.highlights), `${where}: highlights must be a list`);
  for (const h of trip.highlights || []) {
    req(errors, isObj(h) && str(h.icon) && str(h.title) && str(h.text), `${where}: each highlight needs icon, title, and text`);
  }

  if (trip.bookings != null) {
    req(errors, Array.isArray(trip.bookings), `${where}: bookings must be a list`);
  }
  const bookingIds = new Set();
  for (const b of trip.bookings || []) {
    req(errors, isObj(b) && str(b.kind) && str(b.title), `${where}: each booking needs kind and title`);
    if (b?.id) {
      req(errors, !bookingIds.has(b.id), `${where}: duplicate booking id ${b.id}`);
      bookingIds.add(b.id);
    }
    if (b?.href) req(errors, URL.test(b.href), `${where}: booking link for ${b?.title || "a ticket"} must be an http(s) URL`);
    if (b?.qr) req(errors, typeof b.qr === "string" && !b.qr.startsWith("http"), `${where}: QR path must be a site-relative file`);
    if (b?.image) req(errors, typeof b.image === "string", `${where}: booking image must be a path`);
    if (b?.legs) {
      req(errors, Array.isArray(b.legs), `${where}: booking legs must be a list`);
      for (const leg of b.legs || []) {
        req(errors, isObj(leg) && str(leg.from) && str(leg.to), `${where}: each layover leg needs from and to`);
      }
    }
  }

  if (trip.stays != null) {
    req(errors, Array.isArray(trip.stays), `${where}: stays must be a list`);
    for (const s of trip.stays || []) {
      req(errors, isObj(s) && str(s.place) && str(s.detail), `${where}: each stay needs place and detail`);
    }
  }
  if (trip.packing != null) {
    req(errors, Array.isArray(trip.packing) && trip.packing.every((item) => typeof item === "string"), `${where}: packing must be a list of strings`);
  }
  if (trip.tips != null) {
    req(errors, Array.isArray(trip.tips) && trip.tips.every((item) => typeof item === "string"), `${where}: tips must be a list of strings`);
  }
  if (trip.lessons != null) {
    req(errors, Array.isArray(trip.lessons) && trip.lessons.every((item) => typeof item === "string"), `${where}: lessons must be a list of strings`);
  }
  if (trip.wayHome != null) {
    req(errors, Array.isArray(trip.wayHome), `${where}: wayHome must be a list`);
    for (const w of trip.wayHome || []) {
      req(errors, isObj(w) && str(w.label) && str(w.value), `${where}: each way-home row needs label and value`);
    }
  }
  if (trip.heroStats != null) {
    req(errors, Array.isArray(trip.heroStats) && trip.heroStats.every((s) => isObj(s) && str(String(s.value)) && str(s.label)), `${where}: heroStats must be value/label pairs`);
  }

  if (trip.spending != null) {
    const spending = trip.spending;
    req(errors, isObj(spending), `${where}: spending must be an object`);
    if (isObj(spending)) {
      req(errors, str(spending.recordedOn) && typeof spending.note === "string", `${where}: spending needs recordedOn and note`);
      req(errors, Array.isArray(spending.totals) && spending.totals.length > 0, `${where}: spending.totals is required`);
      for (const total of spending.totals || []) {
        req(errors, isObj(total) && typeof total.amount === "number" && str(total.currency), `${where}: each spending total needs amount and currency`);
      }
      req(errors, Array.isArray(spending.categories) && spending.categories.length > 0, `${where}: spending.categories is required`);
      for (const category of spending.categories || []) {
        req(errors, isObj(category) && str(category.name) && Array.isArray(category.parts), `${where}: each spending category needs name and parts`);
        for (const part of category.parts || []) {
          req(errors, isObj(part) && typeof part.amount === "number" && str(part.currency), `${where}: each spending part needs amount and currency`);
        }
      }
      req(errors, Array.isArray(spending.entries), `${where}: spending.entries must be a list`);
      for (const entry of spending.entries || []) {
        req(
          errors,
          isObj(entry) && str(entry.category) && str(entry.description) && str(entry.date) && typeof entry.amount === "number" && str(entry.currency),
          `${where}: each expense needs category, description, date, amount, and currency`
        );
      }
    }
  }

  req(errors, Array.isArray(trip.days) && trip.days.length > 0, `${where}: days are required`);
  const dayNumbers = new Set();
  for (const day of trip.days || []) {
    req(errors, isObj(day) && Number.isInteger(day.n) && isoOk(day.date), `${where}: each day needs an integer n and a date`);
    req(errors, str(day?.city) && str(day?.country) && str(day?.subtitle) && str(day?.theme), `${where}: day ${day?.n} needs city, country, subtitle, and theme`);
    if (day?.country) req(errors, codes.has(day.country), `${where}: day ${day?.n} country ${day.country} is not in countries`);
    if (day?.also) req(errors, codes.has(day.also), `${where}: day ${day?.n} also-country ${day.also} is not in countries`);
    if (day?.n != null) {
      req(errors, !dayNumbers.has(day.n), `${where}: duplicate day number ${day.n}`);
      dayNumbers.add(day.n);
    }
    if (isoOk(day?.date) && isoOk(trip.startDate) && !day.epilogue) {
      req(errors, day.date >= trip.startDate && day.date <= trip.endDate, `${where}: day ${day.n} date ${day.date} is outside ${trip.startDate}–${trip.endDate}`);
    }
    const hasPlan = (Array.isArray(day?.activities) && day.activities.length) || (Array.isArray(day?.schedule) && day.schedule.length);
    req(errors, hasPlan, `${where}: day ${day?.n} needs activities or a schedule`);
    if (day?.schedule) {
      for (const row of day.schedule) {
        req(errors, isObj(row) && str(row.time) && str(row.text), `${where}: day ${day?.n} schedule rows need time and text`);
      }
    }
    if (day?.story && Array.isArray(day.story)) {
      for (const beat of day.story) {
        req(errors, isObj(beat) && str(beat.t) && str(beat.text), `${where}: day ${day?.n} story beats need t and text`);
      }
    }
    if (day?.tickets) {
      req(errors, Array.isArray(day.tickets), `${where}: day ${day?.n} tickets must be a list of booking ids`);
      for (const id of day.tickets || []) {
        req(errors, bookingIds.has(id), `${where}: day ${day?.n} ticket ${id} does not match a booking id`);
      }
    }
    if (day?.legs) {
      req(errors, Array.isArray(day.legs), `${where}: day ${day?.n} legs must be a list`);
      for (const leg of day.legs || []) {
        req(errors, isObj(leg) && str(leg.mode) && str(leg.text), `${where}: day ${day?.n} legs need mode and text`);
      }
    }
  }

  req(errors, Array.isArray(trip.places) && trip.places.length > 0, `${where}: map places are required`);
  const placeIds = new Set();
  for (const place of trip.places || []) {
    req(errors, isObj(place) && str(place.id) && str(place.name) && typeof place.lat === "number" && typeof place.lon === "number", `${where}: each place needs id, name, lat, and lon`);
    if (place?.id) {
      req(errors, !placeIds.has(place.id), `${where}: duplicate place id ${place.id}`);
      placeIds.add(place.id);
    }
    if (place?.day != null) req(errors, dayNumbers.has(place.day), `${where}: place ${place?.id} points at missing day ${place.day}`);
  }

  req(errors, Array.isArray(trip.regions), `${where}: regions must be a list`);
  for (const region of trip.regions || []) {
    req(errors, isObj(region) && str(region.name) && typeof region.lat === "number" && typeof region.lon === "number", `${where}: each region needs name, lat, and lon`);
  }

  req(errors, Array.isArray(trip.route), `${where}: route must be a list`);
  for (const leg of trip.route || []) {
    req(errors, Array.isArray(leg) && leg.length >= 2 && placeIds.has(leg[0]) && placeIds.has(leg[1]), `${where}: route ${JSON.stringify(leg)} must join two known places`);
    if (leg?.[2] != null) req(errors, typeof leg[2] === "string", `${where}: route mode must be a string`);
  }

  if (doc.page != null) req(errors, isObj(doc.page), `${where}: page copy must be an object`);
  if (typeof doc.intro !== "string" || !doc.intro.trim()) fail("overview narrative is required");

  return errors;
}

export function assertValid(doc, file) {
  const errors = validateTrip(doc, file);
  if (errors.length) {
    const shown = errors.slice(0, 40).join("\n");
    const more = errors.length > 40 ? `\n… and ${errors.length - 40} more` : "";
    throw new Error(shown + more);
  }
}
