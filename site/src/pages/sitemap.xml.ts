import type { APIRoute } from "astro";
import { getPosts, collectTags, collectCountries } from "../lib/posts";
import { SITE, absUrl } from "../site";

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const latest = posts[0]?.date.toISOString().slice(0, 10);
  const pages = Math.ceil(posts.length / SITE.postsPerPage);
  const countries = collectCountries(posts);

  const entries: { loc: string; lastmod?: string }[] = [
    { loc: absUrl("/"), lastmod: latest },
    { loc: absUrl("/about/") },
    ...(posts.length
      ? [
          { loc: absUrl("/stories/"), lastmod: latest },
          ...Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ loc: absUrl(`/stories/page/${i + 2}/`) })),
          ...[...new Set(posts.map((p) => p.year))].map((y) => ({ loc: absUrl(`/stories/${y}/`) })),
          ...posts.map((p) => ({ loc: absUrl(p.path), lastmod: p.date.toISOString().slice(0, 10) })),
        ]
      : []),
    ...(countries.length ? [{ loc: absUrl("/places/") }] : []),
    ...countries.map((c) => ({ loc: absUrl(`/places/${c.slug}/`) })),
    ...collectTags(posts)
      .filter((t) => t.count >= 2)
      .map((t) => ({ loc: absUrl(`/tags/${t.slug}/`) })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((e) => `  <url><loc>${e.loc}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`).join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml" } });
};
