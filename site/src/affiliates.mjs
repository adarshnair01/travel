// Affiliate partners. Stories link to partners with ordinary Markdown links written as
//
//   [ArtKarna](aff:booking/hotel/in/art-karna-gokarna.html)
//
// i.e. `aff:<partner>/<path on the partner's site>`. At build time src/lib/rehype-aff.mjs turns
// each one into the real URL, adds your tracking ID, `rel="sponsored"` and GA4 click tracking, so
// the picks read as part of the story while IDs stay in this one file. Links work for readers with
// or without IDs; paste an ID (or a network deep-link template) and they start earning on the next
// deploy. The disclosure line under the byline only appears on stories with earning links.
//
// Two ways to make a partner's links earn:
//   id:   the partner's own tracking parameter, added to the link (e.g. Booking.com `aid`).
//   wrap: a network deep-link template; `{url}` is replaced by the encoded destination. Use this for
//         partners you join through Cuelinks, INRDeals, vCommission, Travelpayouts or Impact, e.g.
//         "https://linksredirect.com/?cid=12345&source=linkkit&url={url}"            (Cuelinks)
//         "https://tp.media/r?marker=12345&trs=1&p=4114&u={url}"                     (Travelpayouts)
// Set `enabled: false` to turn a partner's links back into plain, untracked links.

export const AFFILIATES = {
  // Stays
  booking: { name: "Booking.com", base: "https://www.booking.com/", param: "aid", id: "", wrap: "", enabled: true },
  agoda: { name: "Agoda", base: "https://www.agoda.com/", param: "cid", id: "", wrap: "", enabled: true },
  hostelworld: { name: "Hostelworld", base: "https://www.hostelworld.com/", param: "", id: "", wrap: "", enabled: true },
  // Tours and activities
  viator: { name: "Viator", base: "https://www.viator.com/", param: "pid", extra: { mcid: "42383", medium: "link" }, id: "", wrap: "", enabled: true },
  getyourguide: { name: "GetYourGuide", base: "https://www.getyourguide.com/", param: "partner_id", id: "", wrap: "", enabled: true },
  klook: { name: "Klook", base: "https://www.klook.com/", param: "aid", id: "", wrap: "", enabled: true },
  // Getting there
  redbus: { name: "redBus", base: "https://www.redbus.in/", param: "", id: "", wrap: "", enabled: true },
  makemytrip: { name: "MakeMyTrip", base: "https://www.makemytrip.com/", param: "", id: "", wrap: "", enabled: true },
  irctc: { name: "IRCTC", base: "https://www.irctc.co.in/", param: "", id: "", wrap: "", enabled: true }, // no affiliate programme
  // Gear
  amazon: { name: "Amazon.in", base: "https://www.amazon.in/", param: "tag", id: "travel0bb-21", wrap: "", enabled: true }, // Amazon Associates India tag
  // Visitors from abroad
  airalo: { name: "Airalo", base: "https://www.airalo.com/", param: "", id: "", wrap: "", enabled: true },
  safetywing: { name: "SafetyWing", base: "https://safetywing.com/", param: "referenceID", id: "", wrap: "", enabled: true },
};

/**
 * Resolve an `aff:partner/path` href.
 * @returns {{ key: string, href: string, paid: boolean } | null}
 */
export function resolveAff(href) {
  const m = /^aff:([a-z]+)\/?(.*)$/i.exec(String(href ?? ""));
  if (!m) return null;
  const key = m[1].toLowerCase();
  const p = AFFILIATES[key];
  if (!p) throw new Error(`Unknown affiliate partner "${key}" in link ${href} (see site/src/affiliates.mjs)`);
  const dest = new URL(m[2], p.base).href;
  if (!p.enabled) return { key, href: dest, paid: false };
  if (p.wrap) return { key, href: p.wrap.replace("{url}", encodeURIComponent(dest)), paid: true };
  if (p.id && p.param) {
    const u = new URL(dest);
    u.searchParams.set(p.param, p.id);
    for (const [k, v] of Object.entries(p.extra ?? {})) u.searchParams.set(k, v);
    return { key, href: u.href, paid: true };
  }
  return { key, href: dest, paid: false };
}

/** True when the story's Markdown has at least one earning link (shows the disclosure). */
export function hasPaidLinks(markdown) {
  return [...String(markdown ?? "").matchAll(/\]\((aff:[^)\s]+)/g)].some(([, href]) => resolveAff(href)?.paid);
}
