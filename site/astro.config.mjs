// @ts-check
import { defineConfig } from "astro/config";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeAff from "./src/lib/rehype-aff.mjs";

// Served from https://adarshnair.online/travel/ (GitHub Pages project site behind the
// custom domain). If the GitHub repo has a different name, change `base` here and in src/site.ts.
export default defineConfig({
  site: "https://adarshnair.online",
  base: "/travel",
  trailingSlash: "always",
  build: { format: "directory" },
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  image: { layout: "constrained", responsiveStyles: true },
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      rehypeAff, // `aff:partner/path` links → tagged partner links (src/affiliates.mjs)
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          properties: { className: ["heading-anchor"], ariaHidden: "true", tabIndex: -1 },
          content: { type: "text", value: "#" },
        },
      ],
    ],
  },
});
