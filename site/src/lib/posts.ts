import { getCollection, type CollectionEntry } from "astro:content";

export type PostEntry = CollectionEntry<"posts">;

export interface Post {
  entry: PostEntry;
  id: string;
  slug: string;
  year: string;
  path: string; // relative to base, e.g. /stories/2026/kyoto-in-spring/
  title: string;
  date: Date;
  description: string;
  /** Title and description for <title>, meta description and social cards. */
  seoTitle: string;
  seoDescription: string;
  updated?: Date;
  place?: string;
  country?: string;
  tags: string[];
  readingMinutes: number;
  wordCount: number;
  draft: boolean;
  /** Series key from SITE.series, if the story belongs to one. */
  series?: string;
  /** Position in its series, oldest first (1, 2, 3…). */
  seriesNo?: number;
}

export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toList(v: string[] | string | undefined): string[] {
  if (!v) return [];
  const arr = Array.isArray(v) ? v : v.split(/,\s*/);
  return [...new Set(arr.map((t) => String(t).trim()).filter(Boolean))];
}

function plainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#>*_`~|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstParagraph(md: string): string {
  const para = md
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .find((p) => p && !p.startsWith("#") && !p.startsWith("```") && !p.startsWith("!["));
  return plainText(para ?? "");
}

export function clamp(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:]$/, "")}…`;
}

let cache: Post[] | undefined;

/**
 * All published stories, newest first. Drafts and future-dated posts stay hidden in the
 * real build; in `npm run dev` they show (with a Draft badge) so you can preview them locally.
 */
export async function getPosts(): Promise<Post[]> {
  if (cache) return cache;
  const now = Date.now();
  const dev = import.meta.env.DEV;
  const entries = await getCollection("posts", ({ data }) => dev || (!data.draft && data.date.valueOf() <= now));

  const posts: Post[] = entries.map((entry) => {
    const body = entry.body ?? "";
    const words = plainText(body).split(" ").filter(Boolean).length;
    const slug = slugify(entry.id.replace(/^\d{4}-\d{2}-\d{2}-/, ""));
    const year = String(entry.data.date.getUTCFullYear());
    return {
      entry,
      id: entry.id,
      slug,
      year,
      path: `/stories/${year}/${slug}/`,
      title: entry.data.title,
      date: entry.data.date,
      description: entry.data.description ?? clamp(firstParagraph(body)),
      seoTitle: entry.data.seoTitle ?? entry.data.title,
      seoDescription: clamp(entry.data.seoDescription ?? entry.data.description ?? firstParagraph(body), 160),
      updated: entry.data.updated,
      place: entry.data.place,
      country: entry.data.country,
      tags: toList(entry.data.tags),
      readingMinutes: Math.max(1, Math.round(words / 230)),
      wordCount: words,
      draft: !!entry.data.draft || entry.data.date.valueOf() > now,
      series: entry.data.series,
    };
  });

  posts.sort((a, b) => b.date.valueOf() - a.date.valueOf() || b.id.localeCompare(a.id));

  // Number each series' stories in publishing order.
  const counts = new Map<string, number>();
  for (const p of [...posts].reverse()) {
    if (!p.series) continue;
    const n = (counts.get(p.series) ?? 0) + 1;
    counts.set(p.series, n);
    p.seriesNo = n;
  }

  // Two files can map to the same URL; older ones get a numeric suffix.
  const seen = new Map<string, number>();
  for (const p of posts) {
    const n = seen.get(p.path) ?? 0;
    seen.set(p.path, n + 1);
    if (n > 0) {
      p.slug = `${p.slug}-${n + 1}`;
      p.path = `/stories/${p.year}/${p.slug}/`;
    }
  }

  cache = posts;
  return posts;
}

export interface Term {
  name: string;
  slug: string;
  count: number;
}

export function collectTags(posts: Post[]): Term[] {
  return collect(posts.flatMap((p) => p.tags));
}

export function collectCountries(posts: Post[]): Term[] {
  return collect(posts.map((p) => p.country).filter((c): c is string => !!c));
}

function collect(names: string[]): Term[] {
  const map = new Map<string, Term>();
  for (const name of names) {
    const slug = slugify(name);
    if (!slug) continue;
    const t = map.get(slug) ?? { name, slug, count: 0 };
    t.count++;
    map.set(slug, t);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** Stories in the same series, newest first. */
export function seriesPosts(all: Post[], series: string): Post[] {
  return all.filter((p) => p.series === series);
}

/** Same country first, then shared tags. */
export function relatedPosts(post: Post, all: Post[], limit = 3): Post[] {
  const mine = new Set(post.tags.map(slugify));
  const country = post.country ? slugify(post.country) : "";
  return all
    .filter((p) => p.id !== post.id)
    .map((p) => ({
      p,
      score:
        (country && p.country && slugify(p.country) === country ? 3 : 0) +
        p.tags.reduce((s, t) => s + (mine.has(slugify(t)) ? 1 : 0), 0),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.date.valueOf() - a.p.date.valueOf())
    .slice(0, limit)
    .map((x) => x.p);
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });
}

export function placeLabel(p: Pick<Post, "place" | "country">): string {
  return [p.place, p.country].filter(Boolean).join(", ");
}
