import type { APIRoute } from "astro";
import { robotsTxt } from "../lib/seo";

// Built with the site's origin (astro.config.mjs) so the sitemap line follows SITE_URL.
export const GET: APIRoute = ({ site, url }) =>
  new Response(robotsTxt(site ?? new URL(url.origin)), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
