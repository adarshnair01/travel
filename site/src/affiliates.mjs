// Affiliate partners and the "plan and book" boxes that sit at the end of a story's sections.
//
// The boxes are added at build time (src/lib/rehype-book.mjs) from each post's `book:` front matter,
// so stories stay plain Markdown. Links work for readers with or without IDs; once you paste an ID
// (or a network deep-link template) below, that partner's links start earning on the next deploy.
// The disclosure line and the "Affiliate links" tag only appear on boxes that contain earning links.
//
// Two ways to make a partner's links earn:
//   id:   the partner's own tracking parameter, added to the link (e.g. Booking.com `aid`).
//   wrap: a network deep-link template; `{url}` is replaced by the encoded destination. Use this for
//         partners you join through Cuelinks, INRDeals, vCommission, Travelpayouts or Impact, e.g.
//         "https://linksredirect.com/?cid=12345&source=linkkit&url={url}"            (Cuelinks)
//         "https://tp.media/r?marker=12345&trs=1&p=4114&u={url}"                     (Travelpayouts)
// Set `enabled: false` to hide a partner everywhere.

export const AFFILIATES = {
  // Stays
  agoda: { name: "Agoda", param: "cid", id: "", wrap: "", enabled: true },
  booking: { name: "Booking.com", param: "aid", id: "", wrap: "", enabled: true },
  hostelworld: { name: "Hostelworld", param: "", id: "", wrap: "", enabled: true },
  // Activities
  getyourguide: { name: "GetYourGuide", param: "partner_id", id: "", wrap: "", enabled: true },
  klook: { name: "Klook", param: "aid", id: "", wrap: "", enabled: true },
  viator: { name: "Viator", param: "pid", extra: { mcid: "42383", medium: "link" }, id: "", wrap: "", enabled: true },
  // Getting there
  redbus: { name: "redBus", param: "", id: "", wrap: "", enabled: true },
  makemytrip: { name: "MakeMyTrip", param: "", id: "", wrap: "", enabled: true },
  irctc: { name: "IRCTC", param: "", id: "", wrap: "", enabled: true, unpaid: true },
  // Gear
  amazon: { name: "Amazon.in", param: "tag", id: "", wrap: "", enabled: true }, // Associates tag, e.g. "wandernotes-21"
  // Visitors from abroad
  airalo: { name: "Airalo eSIM", param: "", id: "", wrap: "", enabled: true },
  safetywing: { name: "SafetyWing insurance", param: "referenceID", id: "", wrap: "", enabled: true },
};

/** Link to a partner page, tagged when an ID or wrap template is set. */
export function partnerLink(key, dest) {
  const p = AFFILIATES[key];
  if (!p || !p.enabled) return null;
  if (p.wrap) return { key, name: p.name, href: p.wrap.replace("{url}", encodeURIComponent(dest)), paid: true };
  if (p.id && p.param) {
    const u = new URL(dest);
    u.searchParams.set(p.param, p.id);
    for (const [k, v] of Object.entries(p.extra ?? {})) u.searchParams.set(k, v);
    return { key, name: p.name, href: u.href, paid: true };
  }
  return { key, name: p.name, href: dest, paid: false };
}

const q = encodeURIComponent;
const slug = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/**
 * The boxes for one story, keyed by the section they close. Each box has rows of
 * { label, note?, links[] } and optional chips (single links, e.g. gear).
 * @param {any} book  the post's `book:` front matter
 */
export function bookBoxes(book) {
  if (!book) return {};
  const keep = (links) => links.filter(Boolean);
  const boxes = {};

  // Getting there: bus, flights, trains.
  const journey = [];
  if (book.bus) {
    const [from, to] = [book.bus.from, book.bus.to];
    journey.push({ label: book.bus.label ?? `Bus: ${from} to ${to}`, links: keep([partnerLink("redbus", `https://www.redbus.in/bus-tickets/${slug(book.bus.fromSlug ?? from)}-to-${slug(book.bus.toSlug ?? to)}`)]) });
  }
  if (book.flight) {
    const [from, to] = [book.flight.from, book.flight.to];
    journey.push({ label: book.flight.label ?? `Flights: ${from} to ${to}`, links: keep([partnerLink("makemytrip", `https://www.makemytrip.com/routeplanner/flights-${slug(book.flight.fromSlug ?? from)}-${slug(book.flight.toSlug ?? to)}.html`)]) });
  }
  if (book.train) {
    journey.push({ label: typeof book.train === "string" ? book.train : "Trains", note: "Book early; popular trains sell out weeks ahead", links: keep([partnerLink("irctc", "https://www.irctc.co.in/nget/train-search")]) });
  }
  if (journey.some((r) => r.links.length)) boxes["getting-there"] = { icon: "ticket", title: "Book the journey", rows: journey.filter((r) => r.links.length) };

  // Where to stay: one row per area.
  const stays = (book.stays ?? []).map((s) => ({
    label: s.area,
    note: s.note,
    links: keep([
      s.agoda ? partnerLink("agoda", `https://www.agoda.com/city/${s.agoda}.html`) : null,
      partnerLink("booking", `https://www.booking.com/searchresults.html?ss=${q(s.search ?? s.area)}`),
      s.hostelworld ? partnerLink("hostelworld", `https://www.hostelworld.com/st/hostels/${s.hostelworld}/`) : null,
    ]),
  }));
  if (stays.length) boxes["where-to-stay"] = { icon: "bed", title: "Find a place to stay", rows: stays };

  // Top things to do: bookable activities.
  const acts = (book.activities ?? []).map((a) => ({
    label: a.label,
    note: a.note,
    links: keep([
      partnerLink("getyourguide", `https://www.getyourguide.com/s/?q=${q(a.query)}`),
      partnerLink("klook", `https://www.klook.com/en-IN/search/result/?query=${q(a.query)}`),
      partnerLink("viator", `https://www.viator.com/searchResults/all?text=${q(a.query)}`),
    ]),
  }));
  if (acts.length) boxes["top-things-to-do"] = { icon: "compass", title: "Book ahead", rows: acts };

  // Good to know: gear chips and visitors from abroad.
  const gear = (book.gear ?? []).map((g) => ({ ...partnerLink("amazon", `https://www.amazon.in/s?k=${q(g.query ?? g.label)}`), name: g.label })).filter((l) => l.href);
  const abroad = book.abroad
    ? keep([partnerLink("airalo", "https://www.airalo.com/india-esim"), partnerLink("safetywing", "https://safetywing.com/nomad-insurance")])
    : [];
  if (gear.length || abroad.length) {
    boxes["good-to-know"] = {
      icon: "pack",
      title: "Pack and prepare",
      chips: gear.length ? { label: "On Amazon.in", links: gear } : null,
      rows: abroad.length ? [{ label: "Visiting from abroad", links: abroad }] : [],
    };
  }

  // Tag each box with whether it earns, for the disclosure.
  for (const b of Object.values(boxes)) b.paid = [...(b.rows ?? []).flatMap((r) => r.links), ...(b.chips?.links ?? [])].some((l) => l.paid);
  return boxes;
}

/** True when any link in the story earns a commission (shows the disclosure). */
export const hasPaidLinks = (book) => Object.values(bookBoxes(book)).some((b) => b.paid);
