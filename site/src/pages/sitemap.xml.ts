import type { APIRoute } from "astro";
import { getImage } from "astro:assets";
import { getPosts, collectTags, collectCountries } from "../lib/posts";
import { SITE, absUrl } from "../site";

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const latest = posts.length ? new Date(Math.max(...posts.map((p) => (p.updated ?? p.date).valueOf()))).toISOString().slice(0, 10) : undefined;
  const pages = Math.ceil(posts.length / SITE.postsPerPage);
  const countries = collectCountries(posts);

  const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  // Story covers go into the sitemap so Google Images can find them (image sitemap extension).
  const covers = new Map<string, { loc: string; title: string }>();
  for (const p of posts) {
    const cover = p.entry.data.cover;
    if (!cover) continue;
    const img = await getImage({ src: cover, width: 1600, format: "jpg" });
    covers.set(p.path, { loc: new URL(img.src, SITE.origin).href, title: p.entry.data.coverAlt ?? p.title });
  }

  const entries: { loc: string; lastmod?: string; image?: { loc: string; title: string } }[] = [
    { loc: absUrl("/"), lastmod: latest },
    { loc: absUrl("/about/") },
    ...(posts.length
      ? [
          { loc: absUrl("/stories/"), lastmod: latest },
          ...Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ loc: absUrl(`/stories/page/${i + 2}/`) })),
          ...[...new Set(posts.map((p) => p.year))].map((y) => ({ loc: absUrl(`/stories/${y}/`) })),
          ...posts.map((p) => ({
            loc: absUrl(p.path),
            lastmod: (p.updated ?? p.date).toISOString().slice(0, 10),
            image: covers.get(p.path),
          })),
        ]
      : []),
    ...Object.entries(SITE.series)
      .filter(([key]) => posts.some((p) => p.series === key))
      .map(([, s]) => ({ loc: absUrl(s.path) })),
    ...(countries.length ? [{ loc: absUrl("/places/") }] : []),
    ...countries.map((c) => ({ loc: absUrl(`/places/${c.slug}/`) })),
    ...collectTags(posts)
      .filter((t) => t.count >= 2)
      .map((t) => ({ loc: absUrl(`/tags/${t.slug}/`) })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries
  .map(
    (e) =>
      `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}${
        e.image ? `<image:image><image:loc>${esc(e.image.loc)}</image:loc><image:title>${esc(e.image.title)}</image:title></image:image>` : ""
      }</url>`,
  )
  .join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
