# Travel Journal of Adarsh — Trip Portfolio

Home for completed trips and upcoming plans.

## Open

```bash
cd /Users/ayn8500/Development/travel
open index.html
# or
python3 -m http.server 8080
```

## Structure

Trips live under `data/{year}/{trip_name}` — for example `data/2026/finland/`.

| Path | What |
| --- | --- |
| `index.html` | Portfolio home — all trips |
| `trips.js` | Catalog of trips (add new ones here) |
| `data/` | Trip recaps grouped by year |
| `data/2026/taiwan/` | Completed trip recap |
| `data/2026/europe/` | Completed trip recap |
| `data/2026/puri/` | Upcoming itinerary (Puri, Konark, Deoghar, Patna) |
| `data/2026/kerala-temples/` | Completed recap (Guruvayur, Ambalappuzha, Mannarasala, 7–8 March 2026) |
| `data/2026/mysore/` | Completed recap (Mysore day trip, 25 April 2026) |
| `data/2026/kochi/` | Completed recap (Kochi day trip, 10 April 2026) |
| `data/2025/japan/` | Completed recap (Tokyo, Fuji, Nikko, Kyoto, Nara, Osaka, 10–22 April 2025) |
| `data/2025/tirupati/` | Completed recap (Tirupati, 15–16 May 2025, BlaBlaCar out and 17210 home) |
| `data/2025/ujjain/` | Completed recap (Ujjain and Indore, 20–28 May 2025) |
| `data/2021/jaipur/` | Completed recap (Pink City, July 2021) |
| `data/2021/goa/` | Completed recap (Goa, December 2021) |
| `data/2022/srinagar/` | Completed recap (Srinagar & Delhi, February 2022) |
| `data/2022/gangtok/` | Completed recap (Sikkim & Darjeeling, May 2022) |
| `data/2022/manali/` | Completed recap (Gurgaon, Manali, Kasol, Amritsar, June 2022) |
| `data/2022/kerala/` | Completed road-trip recap (Kerala & south loop, August 2022) |
| `data/2022/rajasthan/` | Completed recap (Bikaner → Udaipur, October 2022 — places paced) |
| `data/2022/munnar/` | Completed family recap (Kochi & Munnar, November 2022) |
| `data/2022/thailand/` | Completed recap (Krabi, Phi Phi, Phuket and Bangkok, December 2022) |
| `data/2023/singapore/` | Completed recap (Kuala Lumpur, Singapore and Sentosa, March 2023) |
| `data/2024/bali/` | Completed recap (KL, Penang, Bali, Bangkok, August 2024) |
| `data/2024/gujarat/` | Completed recap (Pune, Aurangabad, Shirdi, Mumbai, Gujarat, Sep–Oct 2024) |
| `data/2024/dharamshala/` | Completed recap (Dalhousie, Khajjiar, Dharamshala, June 2024) |

| `assets/journal.css` | Shared design system, including the spending ledger |
| `assets/trip.js` | Shared trip engine |
| `assets/chrome.js` | Sidebar year list rendered from `trips.js` |
| `assets/stickers.js` | Souvenir stickers for trip pages |

## Design system

Every page loads `assets/journal.css`. A trip's accent is the `--accent-light` / `--accent-dark`
variables on the page element, so there is no copied stylesheet per trip.

Trip behaviour lives in `assets/trip.js` (one engine for every recap) and
`assets/chrome.js` (the year sidebar, filled from `trips.js`).
Klook QR codes and layover legs render only when a trip's bookings include them.

Fonts are Fraunces (display), Karla (body), Caveat (notes) and Great Vibes (the Journal wordmark).

## Photos

Every trip page and every home card has a photo slot. To fill one, drop **`cover.jpg`**, **`cover.jpeg`**, or **`cover.png`**
into that trip's folder — for example `data/2021/goa/cover.jpg`. Nothing else to edit: the page picks it
up on next load, and the same image appears on the home card for that trip.

Until a cover image exists the home card shows a slim ruled strip instead of a photo, so an empty
slot costs almost no space; the moment a cover loads, the card opens up to a full 16:10 image.
Trip pages show a dashed placeholder. Landscape images work best (roughly 3:2 or 16:10, at least
1200px wide).

## Layout

All pages use a **left sidebar** (`--sidebar-w: 248px`) so this nest cleanly into a parent portfolio later. On viewports under 960px it collapses to a hamburger drawer.

When embedding, wrap or iframe the site and optionally override:

```css
:root { --sidebar-w: 220px; } /* or 0 if the parent already has nav */
```

## Home page layout

The home page is styled as a bound journal: a stitched spine and margin rule down the left of the
page, ruled paper behind everything, a bookmark ribbon on the binding, chapter headings, and trip
entries taped in with a dog-eared corner.

It is laid out in three bands to keep blank space down:

1. **Flyleaf** — wax seal and title, next-departure ticket stub, and the running tally (trips,
   completed, upcoming, cities) ruled across the full width.
2. **Chapter One — the fold-out map** — the globe fills the band, with the read-out *and* the trip
   picker stacked in the rail beside it.
3. **Chapter Two — the entries** — search, filters and the year index share one sticky line; each
   year is a sticky index tab in the gutter with its cards filling the rest of the page.

Trips are listed **once**, grouped by year (newest first). The year headings, their counts, and
the sidebar "By year" links are all generated from `trips.js`.

## Stickers

Every trip page loads `assets/stickers.js` after its own `app.js`. It reads the page's `TRIP` data,
matches each day's text against a list of places and their best-known sights, and sticks a die-cut
badge onto the day card, the timeline row and the day modal — plus a "Stickers collected" sheet
under the at-a-glance row.

Matching is by place name, so nothing needs wiring per page. Where the day *is* (its `city` /
`place` / `title`) beats a place merely mentioned in passing, so a Delhi connection on a Helsinki
day doesn't steal the sticker. A day with no recognised sight is stamped with its own name, drawn
with a glyph picked from the day's `theme`.

To add a sight, append a row to `SIGHTS` in `assets/stickers.js`:

```js
[["lofoten", "reine"], "coast", "Lofoten"],   // [terms to match, glyph, label]
```

Glyph names are the keys of `GLYPH` at the top of that file (`temple`, `castle`, `waterfall`,
`skyline`, `ship`, `tea`, `camel`, …). Add a new one there if nothing fits.

## Add a trip

1. Create a folder at `data/{year}/{trip_name}` with its own `index.html` (or copy an existing trip page).
   Shared CSS/JS are three levels up: `../../../assets/journal.css`.
2. Append an entry to `PORTFOLIO.trips` in `trips.js` with `status: "done"` or `"upcoming"` and `scope: "domestic"` or `"international"`.
3. The home page picks it up automatically — a new `year` creates its own group and sidebar link.

