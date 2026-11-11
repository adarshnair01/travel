// Affiliate partners. Stories link to partners with ordinary Markdown links written as
//
//   [ArtKarna](aff:agoda/partners/partnersearch.aspx?pcs=1&hid=58936899)
//   [Hotel Le Marais](aff:booking/hotel/fr/le-marais.html)
//
// i.e. `aff:<partner>/<path on the partner's site>`. At build time src/lib/rehype-aff.mjs turns
// each one into the real URL, adds your tracking ID, `rel="sponsored"` and GA4 click tracking, so
// the picks read as part of the story while IDs stay in this one file. Links work for readers with
// or without IDs; paste an ID (or a network deep-link template) and they start earning on the next
// deploy. The disclosure line under the byline only appears on stories with earning links.
//
// Which partner to link (quote the rating from the same site you link to):
//   Hotels in India and Asia  -> agoda   (link by hotel ID: partners/partnersearch.aspx?pcs=1&hid=<id>)
//   Hotels elsewhere          -> booking, or expedia / hotelscom / vrbo (US, holiday rentals)
//   Tours in Europe / the US  -> getyourguide / viator;  Asia -> klook;  tickets -> tiqets
//   Trains and buses          -> irctc / redbus (India), omio (Europe)
//   Car hire, transfers       -> discovercars, welcomepickups
//   Gear -> amazon;  data -> airalo / yesim;  insurance -> safetywing
//
// Ways to make a partner's links earn, checked in this order:
//   links:  exact tracked links for single pages, keyed by the path after `aff:<partner>/`, e.g. the
//           short links Travelpayouts' "Tools > Links" generates.
//   wrap:   a network deep-link template; `{url}` is replaced by the encoded destination. Use this for
//           partners you join through Cuelinks, EarnKaro, Travelpayouts or Impact, e.g.
//           "https://linksredirect.com/?cid=12345&source=linkkit&url={url}"            (Cuelinks)
//   id:     the partner's own tracking parameter, added to the link (e.g. Agoda `cid`).
//   stay22: the partner's provider name at Stay22. Once STAY22_AID is set, partners without their own
//           wrap or id earn through Stay22 (no traffic minimum; Booking.com, Expedia, Hotels.com, Vrbo,
//           Agoda and GetYourGuide). Direct ids pay more, so they win when both are set.
// Travelpayouts account 599055: Booking.com, Agoda, Trip.com, Expedia, Viator, Hostelworld and
// GetYourGuide there need about three months of steady traffic (re-apply around Feb 2027).
// `param` names for partners not yet joined are the usual ones; confirm in each dashboard when pasting an ID.
// Set `enabled: false` to turn a partner's links back into plain, untracked links.

/** Stay22 affiliate ID ("aid" in the Stay22 hub). Empty = Stay22 off. */
export const STAY22_AID = "adarshnair";
const STAY22_CAMPAIGN = "wandernotes";

export const AFFILIATES = {
  // Stays
  agoda: { name: "Agoda", base: "https://www.agoda.com/", param: "cid", id: "", wrap: "", stay22: "agoda", enabled: true }, // Agoda Partners site ID
  booking: { name: "Booking.com", base: "https://www.booking.com/", param: "aid", id: "", wrap: "", stay22: "booking", enabled: true },
  expedia: { name: "Expedia", base: "https://www.expedia.com/", param: "", id: "", wrap: "", stay22: "expedia", enabled: true },
  hotelscom: { name: "Hotels.com", base: "https://www.hotels.com/", param: "", id: "", wrap: "", stay22: "hotelscom", enabled: true },
  vrbo: { name: "Vrbo", base: "https://www.vrbo.com/", param: "", id: "", wrap: "", stay22: "vrbo", enabled: true },
  tripcom: { name: "Trip.com", base: "https://www.trip.com/", param: "", id: "", wrap: "", enabled: true },
  cleartrip: { name: "Cleartrip", base: "https://www.cleartrip.com/", param: "", id: "", wrap: "", enabled: true }, // via EarnKaro/Cuelinks wrap
  hostelworld: { name: "Hostelworld", base: "https://www.hostelworld.com/", param: "", id: "", wrap: "", enabled: true },
  // Tours and activities
  getyourguide: { name: "GetYourGuide", base: "https://www.getyourguide.com/", param: "partner_id", id: "WOSNAHU", wrap: "", stay22: "getyourguide", enabled: true },
  viator: { name: "Viator", base: "https://www.viator.com/", param: "pid", extra: { uid: "U00889789", mcid: "58086" }, id: "P00331106", wrap: "", enabled: true }, // Travel Agent "Share with Client" (8%, 90-day window)
  klook: { name: "Klook", base: "https://www.klook.com/", param: "aid", id: "", wrap: "", enabled: true },
  tiqets: { name: "Tiqets", base: "https://www.tiqets.com/", param: "partner", id: "", wrap: "", enabled: true },
  // Getting there and around
  irctc: { name: "IRCTC", base: "https://www.irctc.co.in/", param: "", id: "", wrap: "", enabled: true }, // no affiliate programme
  redbus: { name: "redBus", base: "https://www.redbus.in/", param: "", id: "", wrap: "", enabled: true }, // via Cuelinks wrap
  makemytrip: { name: "MakeMyTrip", base: "https://www.makemytrip.com/", param: "", id: "", wrap: "", enabled: true }, // via Cuelinks wrap
  omio: { name: "Omio", base: "https://www.omio.com/", param: "", id: "", wrap: "", enabled: true },
  discovercars: { name: "DiscoverCars", base: "https://www.discovercars.com/", param: "a_aid", id: "", wrap: "", enabled: true },
  welcomepickups: { name: "Welcome Pickups", base: "https://www.welcomepickups.com/", param: "", id: "", wrap: "", enabled: true },
  // Gear
  amazon: { name: "Amazon.in", base: "https://www.amazon.in/", param: "tag", id: "travel0bb-21", wrap: "", enabled: true }, // Amazon Associates India tag
  // Data and insurance
  airalo: { name: "Airalo", base: "https://www.airalo.com/", param: "", id: "", wrap: "", links: { "india-esim": "https://airalo.tpk.ro/BoXqS3LM" }, enabled: true },
  yesim: { name: "Yesim", base: "https://yesim.app/", param: "", id: "", wrap: "", enabled: true },
  safetywing: { name: "SafetyWing", base: "https://safetywing.com/", param: "referenceID", id: "", wrap: "", enabled: true },
};

/**
 * Resolve an `aff:partner/path` href.
 * @returns {{ key: string, href: string, paid: boolean } | null}
 */
export function resolveAff(href) {
  const m = /^aff:([a-z0-9]+)\/?(.*)$/i.exec(String(href ?? ""));
  if (!m) return null;
  const key = m[1].toLowerCase();
  const p = AFFILIATES[key];
  if (!p) throw new Error(`Unknown affiliate partner "${key}" in link ${href} (see site/src/affiliates.mjs)`);
  const dest = new URL(m[2], p.base).href;
  if (!p.enabled) return { key, href: dest, paid: false };
  if (p.links?.[m[2]]) return { key, href: p.links[m[2]], paid: true };
  if (p.wrap) return { key, href: p.wrap.replace("{url}", encodeURIComponent(dest)), paid: true };
  if (p.id && p.param) {
    const u = new URL(dest);
    u.searchParams.set(p.param, p.id);
    for (const [k, v] of Object.entries(p.extra ?? {})) u.searchParams.set(k, v);
    return { key, href: u.href, paid: true };
  }
  if (p.stay22 && STAY22_AID) {
    const u = new URL(`https://www.stay22.com/allez/${p.stay22}`);
    u.searchParams.set("aid", STAY22_AID);
    u.searchParams.set("campaign", STAY22_CAMPAIGN);
    u.searchParams.set("link", dest);
    return { key, href: u.href, paid: true };
  }
  return { key, href: dest, paid: false };
}

/** True when the story's Markdown has at least one earning link (shows the disclosure). */
export function hasPaidLinks(markdown) {
  return [...String(markdown ?? "").matchAll(/\]\((aff:[^)\s]+)/g)].some(([, href]) => resolveAff(href)?.paid);
}
