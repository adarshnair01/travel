# Travel Journal of Adarsh — Trip Portfolio

Home for completed trips and upcoming plans. Trip records are Markdown. A small build writes the static journal into `dist/`, including one universal trip page and generated data scripts so the site still opens from `file://`.

## Preview

```bash
cd /Users/ayn8500/Development/travel
npm install
npm run build
npm run check
npm run preview
```

Then open [http://localhost:8080](http://localhost:8080). A trip is `trip.html?id=taiwan-2026`, and a day deep link keeps its anchor: `trip.html?id=europe-2026#day-3`.

`npm run preview` serves `dist/`. Opening `dist/index.html` directly also works, because each trip is a generated script rather than a fetched JSON file.

## Structure

| Path | What |
| --- | --- |
| `content/trips/{year}/{slug}.md` | One trip: YAML front matter for the record, Markdown body for the overview |
| `content/media/{year}/{slug}/` | Cover and any ticket images, QR codes, or PDFs |
| `content/site.yml` | Journal title and home-page blurb |
| `trip.html` | The only trip page |
| `assets/trip-loader.js` | Reads `?id=` and loads that trip's generated script |
| `assets/trip.js` | Shared trip engine |
| `assets/chrome.js` | Sidebar year list |
| `scripts/build.mjs` | Validates every trip and writes `dist/` |
| `dist/` | The site GitHub Pages publishes |

Every trip uses the same sections: days, tickets, spending, route, highlights, and notes. Empty optional sections stay in the schema as empty lists or are omitted, and the page hides them. That covers a simple recap, bookings, Taiwan's QR passes and layover legs, Kochi's timed schedule, spending ledgers, and Europe's epilogue.

## Design system

Every page loads `assets/journal.css`. A trip's accent is the `--accent-light` / `--accent-dark` pair from its Markdown, so there is no copied stylesheet per trip.

Klook QR codes and layover legs render only when a booking includes them. Spending, packing, lessons, and the way-home card render only when that trip has them.

Fonts are Fraunces (display), Karla (body), Caveat (notes) and Great Vibes (the Journal wordmark).

## Photos

Drop **`cover.jpg`**, **`cover.jpeg`**, or **`cover.png`** into `content/media/{year}/{slug}/` and rebuild. The trip page and the home card both use it. The page asks for `cover.jpg` first and tries the other two names before showing the empty frame.

Until a cover exists, the home card shows a slim ruled strip. Trip pages show a dashed placeholder. Landscape images work best (roughly 3:2 or 16:10, at least 1200px wide).

Ticket images and QR files live in that same media folder. In the Markdown, point at them from the site root, for example `media/2026/taiwan/qr-mrt.png`.

## Layout

All pages use a **left sidebar** (`--sidebar-w: 248px`). On viewports under 960px it collapses to a hamburger drawer.

When embedding, wrap or iframe the site and optionally override:

```css
:root { --sidebar-w: 220px; }
```

The home page is a bound journal: flyleaf, fold-out map, then one entry per trip grouped by year. Trips are listed once, newest first. Year headings and the sidebar come from the generated catalog.

## Stickers

`assets/stickers.js` reads the loaded trip, matches each day's text against places and sights, and sticks a badge on the day card, the timeline row, and the day modal.

To add a sight, append a row to `SIGHTS` in `assets/stickers.js`:

```js
[["lofoten", "reine"], "coast", "Lofoten"],   // [terms to match, glyph, label]
```

Glyph names are the keys of `GLYPH` in that file.

## Add a trip

1. Create `content/trips/{year}/{slug}.md`. Copy a short trip such as `content/trips/2026/mysore.md` and keep the same keys.
2. Put the overview in the Markdown body, under the closing `---`. Put dates, places, days, bookings, the route, and any spending in the front matter.
3. Keep `id` stable once a trip is published. The page is `trip.html?id=` that id, and packing checks and the theme are stored under it.
4. Add `content/media/{year}/{slug}/cover.jpg` when you have a photo.
5. Run `npm run build`. The catalog, `dist/trips.js`, and `dist/generated/trips/{id}.js` are generated. Do not edit `dist/` or hand-maintain a trip list.

`scripts/schema.mjs` rejects a trip whose dates, country codes, booking links, or route endpoints do not hang together. Optional blocks — spending, QR images, layover `legs`, a timed `schedule`, lessons, way home, and an `epilogue` day — can be left out.

Older per-trip notes, when they exist, are still in `data/{year}/{slug}/README.md`. They are not part of the built site.
