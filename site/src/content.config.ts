import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Stories live at the repo root in ../posts so writing never touches the site code.
// Only files named YYYY-MM-DD-slug.md are published (see posts/_template.md).
const posts = defineCollection({
  loader: glob({
    pattern: "[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-*.md",
    base: "../posts",
    generateId: ({ entry }) => entry.replace(/\.md$/, ""),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      description: z.string().optional(),
      /** Shorter title for search results and social cards (aim for 60 characters or fewer). */
      seoTitle: z.string().optional(),
      /** Meta description for search results (aim for 120–160 characters). Falls back to description. */
      seoDescription: z.string().optional(),
      /** Date the story was last meaningfully updated; shown to search engines as dateModified. */
      updated: z.coerce.date().optional(),
      /** Where the story happens, e.g. "Kyoto". */
      place: z.string().optional(),
      /** Country — groups stories on the Places page. */
      country: z.string().optional(),
      /** Path relative to the post file, e.g. ./images/kyoto/cover.jpg */
      cover: image().optional(),
      coverAlt: z.string().optional(),
      /** When the trip happened (free text), e.g. "March 2026" or "12–18 Mar 2026". */
      tripDates: z.string().optional(),
      tags: z.union([z.array(z.coerce.string()), z.string()]).optional(),
      author: z.string().default("Adarsh Nair"),
      draft: z.boolean().optional(),
    }),
});

export const collections = { posts };
