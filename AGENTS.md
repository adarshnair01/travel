# Agent guidelines

Travel blog of Adarsh Nair ("Wander Notes"), served at https://adarshnair.online/travel/. Built with **Astro** (static) in `site/`; stories live in `posts/` at the repo root. Sister project of the data science blog in `../blog`, with the same architecture.

## Layout

- `posts/YYYY-MM-DD-slug.md`: stories. `posts/_template.md` documents the front matter and is never published.
- `posts/images/<slug>/`: story photos, referenced relative to the post so Astro optimises them.
- `site/src/content.config.ts`: front-matter schema. `site/src/lib/posts.ts`: loading, URLs, related stories.
- `site/src/site.ts`: name, nav, socials, GA4 and AdSense IDs. `site/src/styles/global.css`: all styling.
- `site/src/affiliates.mjs`: affiliate partners and IDs. `site/src/lib/rehype-book.mjs` adds booking boxes to a story's sections at build time from its `book:` front matter (documented in `posts/_template.md`). Earning links get `rel="sponsored"` and trigger the disclosure line; untagged ones are `nofollow`.
- `generator/`: local-only Story Desk (Node, no deps, Gemini). `layout.mjs` is the single source of the fixed post layout; keep `posts/_template.md` and the `.prose h2#…` rules in `global.css` in step with it. Never deploy it or add it to `site/`.
- `photos/`: raw personal photo dump from the old site. Not part of the build.

## Rules

- Story URLs are `/travel/stories/<year>/<slug>/`. Don't change them once stories are live.
- `base` lives in two places (`astro.config.mjs` and `site.ts`); keep them in sync.
- After changing dependencies, check the lockfile resolves on Linux: `npx npm@11 ci --dry-run --os=linux --cpu=x64 --libc=glibc`.
- Drafts (`draft: true` or future dates) render in `npm run dev` only; the production build must keep excluding them.
- Run `npm run build` in `site/` before committing.
