import type { APIRoute } from "astro";
import { locales } from "../i18n/index";
import { articles } from "../lib/articles";
import { articlePath } from "../lib/blog";
import { llmsTxt } from "../lib/seo";

// llmstxt.org: a Markdown summary of the site for language models, built with the site's origin (astro.config.mjs).
export const GET: APIRoute = async ({ site, url }) => {
  const links = (await Promise.all(locales.map(async (locale) => ({ locale, list: await articles(locale) })))).flatMap(
    ({ locale, list }) =>
      list.map(({ entry, slug }) => ({
        locale,
        title: entry.data.title,
        description: entry.data.description,
        path: articlePath(locale, slug),
      })),
  );
  return new Response(llmsTxt(site ?? new URL(url.origin), links), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
