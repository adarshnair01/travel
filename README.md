# Wander Notes: Adarsh Nair's travel blog

Travel stories, routes and practical notes, built with [Astro](https://astro.build) and served at
**https://adarshnair.in/** (it used to live at adarshnair.online/travel/, which now redirects).

## Writing a story

**Generate a draft:** the local-only [Story Desk](generator/README.md) turns a place name into a
researched draft in the fixed layout: `cd generator && npm start`, then open http://localhost:4400.

**Or write by hand:**

1. Copy `posts/_template.md` to `posts/YYYY-MM-DD-your-slug.md`. Only files with a date prefix are published.
2. Put photos in `posts/images/<your-slug>/` and reference them relative to the post
   (`cover: ./images/<your-slug>/cover.jpg`, `![alt](./images/<your-slug>/photo.jpg)`).
   Full-size JPEGs are fine: the build resizes them and converts them to WebP.
3. Remove `draft: true` and push. The story appears at `/stories/<year>/<your-slug>/`.

| Front matter | Used for |
| --- | --- |
| `title`, `date` | Required |
| `description` | Card text, search snippet, social preview (defaults to the first paragraph) |
| `place`, `country` | Location badge; `country` groups stories on **Places** |
| `cover`, `coverAlt` | Full-bleed header photo, card image and social preview image |
| `tripDates` | Free text such as "March 2026" |
| `tags` | Topic pages under `/tags/` |
| `draft` | `true` hides the story |

Stories dated in the future stay hidden until a build on or after that date. The deploy workflow rebuilds daily.

## Local development

Requires Node.js 22+ (24 recommended).

```bash
cd site
npm install
npm run dev      # http://localhost:4321/  (search needs a build)
npm run build    # static site + Pagefind search index in site/dist/
npm run preview  # serve the build, search included
```

## What's in it

- **Pages:** home (latest story + recent), all stories (paginated, by year), places, topics, about, privacy, 404.
- **SEO:** canonical URLs, Open Graph/Twitter cards using each story's cover, JSON-LD (`BlogPosting` with location, `BreadcrumbList`, `Blog`, `ProfilePage`), `sitemap.xml`, RSS at `/feed.xml`.
- **Reading:** responsive WebP images, photo lightbox, reading progress, share (native/WhatsApp/X), related stories by country and tag, dark mode, ⌘K / `/` search.
- **Analytics and ads:** GA4 and lazy AdSense, configured in `site/src/site.ts` (same IDs as the data science blog).
- **Affiliate links:** picks are woven into stories as ordinary links written `[Name](aff:agoda/…)` or `[Name](aff:booking/…)`. Paste partner IDs, a Stay22 ID, or a Cuelinks/Travelpayouts deep-link template into `site/src/affiliates.mjs` and every such link starts earning on the next deploy; a disclosure line appears under the byline once any link earns. Clicks are tracked in GA4 as `affiliate_click`.

## Deploy

Pushing to `main` builds `site/` and publishes `site/dist/` to the `gh-pages` branch
(`.github/workflows/deploy.yml`). In the repo's Settings → Pages, set the source to the `gh-pages` branch.

The site is served from the root of its own custom domain, adarshnair.in, set by `site/public/CNAME`. DNS for adarshnair.in points at GitHub Pages (A records to 185.199.108–111.153, `www` CNAME to adarshnair01.github.io).
With a different repo name, change `base` in both `site/astro.config.mjs` and `site/src/site.ts`.
