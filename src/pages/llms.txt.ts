import type { APIRoute } from "astro";
import { llmsTxt } from "../lib/seo";

// llmstxt.org: a Markdown summary of the site for language models, built with the site's origin (astro.config.mjs).
export const GET: APIRoute = ({ site, url }) =>
  new Response(llmsTxt(site ?? new URL(url.origin)), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
