import type { APIRoute } from "astro";
import { absUrl } from "../site";

// Crawlers only read robots.txt at the domain root (adarshnair.online/robots.txt), which the
// portfolio site serves. Add this site's Sitemap line there as well.
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absUrl("/sitemap.xml")}\n`, {
    headers: { "Content-Type": "text/plain" },
  });
