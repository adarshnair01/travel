# Agent guidelines

Travel blog of Adarsh Nair ("Wander Notes"), served at https://adarshnair.in/ (moved from adarshnair.online/travel/, which GitHub redirects here; the custom domain is set by `site/public/CNAME`). Built with **Astro** (static) in `site/`; stories live in `posts/` at the repo root. Sister project of the data science blog in `../blog`, with the same architecture.

## Layout

- `posts/YYYY-MM-DD-slug.md`: stories. `posts/_template.md` documents the front matter and is never published.
- `posts/images/<slug>/`: story photos, referenced relative to the post so Astro optimises them.
- `site/src/content.config.ts`: front-matter schema. `site/src/lib/posts.ts`: loading, URLs, related stories.
- `site/src/site.ts`: name, nav, socials, GA4 and AdSense IDs. `site/src/styles/global.css`: all styling.
- `site/src/affiliates.mjs`: affiliate partners and IDs. Stories link to picks with `[Name](aff:partner/path)`; `site/src/lib/rehype-aff.mjs` resolves them at build time (tracking ID, `rel="sponsored"` when earning, `nofollow` otherwise, GA4 `affiliate_click`). Picks must be real listings checked for rating, reviews and price, quoting the rating from the site the link goes to; never let the Story Desk invent them. Hotels in India/Asia link to Agoda by hotel ID; elsewhere to Booking.com/Expedia/Vrbo, which earn through Stay22 (`STAY22_AID`). The file header lists which partner fits each kind of link.
- `generator/`: local-only Story Desk (Node, no deps, Gemini). `layout.mjs` is the single source of the fixed post layout; keep `posts/_template.md` and the `.prose h2#…` rules in `global.css` in step with it. Never deploy it or add it to `site/`.
- Series: `SITE.series` in `site.ts` and the `series` enum in `content.config.ts` (keep in step). `series: incredible-india` stories are narrative history pieces about places in India, listed at `/incredible-india/` and with all stories. They skip the fixed itinerary layout and the Story Desk lint; follow `posts/_template-incredible-india.md` (front matter `era` and `facts`, and the section order: opening, chapters, Legend or history?, Local tellings, Things you probably didn't know, Timeline, If you go, Sources). The `.series-story` rules in `global.css` style those sections by heading id.
- `photos/`: raw personal photo dump from the old site. Not part of the build.

## Rules

- Story URLs are `/stories/<year>/<slug>/`. Don't change them once stories are live.
- `site`/`origin` and `base` live in two places (`astro.config.mjs` and `site.ts`); keep them in sync. The site is served from the domain root (`base: "/"` / `""`).
- After changing dependencies, check the lockfile resolves on Linux: `npx npm@11 ci --dry-run --os=linux --cpu=x64 --libc=glibc`.
- Drafts (`draft: true` or future dates) render in `npm run dev` only; the production build must keep excluding them.
- Run `npm run build` in `site/` before committing.
