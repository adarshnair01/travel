import type { APIRoute } from "astro";
import { absUrl } from "../site";

// Served at https://adarshnair.in/robots.txt, the domain root, so crawlers read it directly.
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absUrl("/sitemap.xml")}\n`, {
    headers: { "Content-Type": "text/plain" },
  });
