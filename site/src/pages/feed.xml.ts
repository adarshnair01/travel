import rss from "@astrojs/rss";
import { getPosts } from "../lib/posts";
import { SITE, absUrl } from "../site";

export async function GET() {
  const posts = (await getPosts()).slice(0, 50);
  return rss({
    title: SITE.blogName,
    description: SITE.description,
    site: absUrl("/"),
    items: posts.map((p) => ({
      title: p.title,
      link: absUrl(p.path),
      pubDate: p.date,
      description: p.description,
      categories: [p.country, ...p.tags].filter((x): x is string => !!x),
      author: `${SITE.socials.email} (${SITE.author})`,
    })),
    customData: `<language>${SITE.lang}</language>`,
  });
}
