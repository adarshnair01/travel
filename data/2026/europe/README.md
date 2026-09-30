# Europe 2026 — Trip Recap

An interactive recap of the trip we actually took: Switzerland → France → Switzerland → Italy →
Austria → Germany, 3–14 September 2026, with the long way home through Abu Dhabi.

## Running it

No build step and no dependencies. Open `index.html` in any modern browser.

To serve it locally instead (useful on a phone on the same Wi-Fi):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's interactive

- **13 day cards** — twelve days in Europe plus the journey home. Click (or focus and press
  Enter) any card to open the full day: the story of how it went, what we did, how we got
  around, where we slept and the thing we want to remember about it.
- **Modal navigation** with the on-screen buttons or `←` / `→`; `Esc` closes.
- **Search and country filters** — search reaches into the day stories too, not just place
  names. Filtering also dims the non-matching pins on the route map.
- **Two layouts** — card grid or vertical timeline.
- **Route map** drawn from real coordinates (Mercator projection). Hover a pin for a preview,
  click it to open that day. The route animates as it scrolls into view.
- **Dark mode** (button, or press `T`), following your system preference by default.
- **Print / save as PDF** with a layout tuned for paper.

### Keyboard shortcuts

| Key | Action |
| --- | --- |
| `/` | Focus search |
| `T` | Toggle dark mode |
| `←` `→` | Previous / next day (while a day is open) |
| `Esc` | Close the day |

### Shareable links

- `index.html#day-8` opens day 8 (Verona and the opera) directly.
- `index.html?view=timeline` loads the timeline layout.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure |
| `styles.css` | All styling, theming, responsive and print rules |
| `data.js` | The trip itself — edit this to change anything on the page |
| `app.js` | Rendering, filtering, modal, map projection |

## Editing the recap

Everything on the page comes from `TRIP` in `data.js`.

Each entry in `TRIP.days` takes:

- `story` — the narrative paragraph shown at the top of the day modal.
- `activities` — renders as a bullet list; use `schedule` instead (`{ time, text }`) for a
  timed day.
- `legs` — modes `train`, `bus`, `plane` and `day`, each with an optional `duration`.
- `country` plus optional `also` — days that crossed a border show both flags.
- `theme` — picks the illustration: `lake`, `peak`, `rail`, `city`, `water`, `town`, `baroque`,
  `castle`.
- `epilogue: true` — marks the journey home so it isn't counted as one of the twelve days.

Elsewhere in `TRIP`:

- `heroStats` and `glance` are the headline numbers.
- `highlights`, `lessons`, `stays` and `wayHome` fill the Highlights and "What We Took Home"
  sections.
- `places` are the map pins (latitude / longitude, with optional `ldx` / `ldy` to nudge a label
  and `span` for a pin covering two days), `regions` are the floating country names, and `route`
  is the list of legs drawn between pins.
