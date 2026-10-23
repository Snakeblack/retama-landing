import type { APIRoute } from "astro";
import { locales } from "../i18n/index";
import { articleSummaries } from "../lib/articles";
import { llmsTxt } from "../lib/seo";

// llmstxt.org: a Markdown summary of the site for language models, built with the site's origin (astro.config.mjs).
export const GET: APIRoute = async ({ site, url }) => {
  const links = (await Promise.all(locales.map(articleSummaries))).flat();
  return new Response(llmsTxt(site ?? new URL(url.origin), links), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
