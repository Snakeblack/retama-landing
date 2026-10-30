import { readdirSync, readFileSync } from "node:fs";
import { defaultLocale, locales } from "../i18n/index";
import { articlePath, entryLocale, entrySlug } from "./blog";
import { servicePaths, services } from "./services";

// What the sitemap says of a page beyond its URL, which @astrojs/sitemap (astro.config.mjs) knows nothing of: the date
// of every page, and the translation of each article and service page, which it cannot pair because every language has
// its own slug.

/** An article as the sitemap reads it: its id, `<locale>/<slug>`, and the key and dates of its front matter. */
export interface SitemapArticle {
  id: string;
  key: string;
  published: Date;
  updated?: Date | undefined;
}

/** A page's lastmod and, for an article or a service page, its translations, as @astrojs/sitemap's serialize takes
 * them. */
export interface SitemapExtra {
  lastmod?: string;
  links?: { url: string; lang: string }[];
}

/** The last change that matters of each page with no article or service behind it, by path, kept by hand like a
 * service's (owner, 2026-10-30): a build date would change on every deploy. The legal page's is the date its text
 * shows in each language (legal.updated). */
export const pageUpdates: Record<string, string> = {
  "/": "2026-10-30",
  "/en/": "2026-10-30",
  "/legal/": "2026-10-24",
  "/en/legal/": "2026-10-26",
};

/** The key and dates of an article's front matter. The config reads them before the content collection exists; the
 * collection's schema (src/content.config.ts) checks the rest when the site builds. */
export function frontMatter(id: string, source: string): SitemapArticle {
  const block = source.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
  const field = (name: string) => block.match(new RegExp(`^${name}:\\s*["']?([^"'\\r\\n]*?)["']?\\s*$`, "m"))?.[1];
  const [key, published, updated] = [field("key"), field("published"), field("updated")];
  if (!key || !published) throw new Error(`${id}: the front matter needs its key and its published date`);
  return { id, key, published: new Date(published), updated: updated ? new Date(updated) : undefined };
}

/** Every article of the blog's folder, src/content/blog/<locale>/<slug>.md. */
export function readArticles(dir: URL): SitemapArticle[] {
  return locales.flatMap((locale) =>
    readdirSync(new URL(`${locale}/`, dir))
      .filter((file) => file.endsWith(".md"))
      .map((file) =>
        frontMatter(`${locale}/${file.slice(0, -3)}`, readFileSync(new URL(`${locale}/${file}`, dir), "utf8")),
      ),
  );
}

const day = (date: Date) => date.toISOString().slice(0, 10);
const changed = (article: SitemapArticle) => article.updated ?? article.published;

/** By absolute URL: each article with its last change and its translations, each language's blog index with the last
 * change of its newest article, each service page with its date and its translations, and the other pages with their
 * date (pageUpdates). */
export function sitemapExtras(site: URL, articles: SitemapArticle[]): Map<string, SitemapExtra> {
  const url = (article: SitemapArticle) =>
    new URL(articlePath(entryLocale(article.id), entrySlug(article.id)), site).href;
  const extras = new Map<string, SitemapExtra>();
  for (const article of articles) {
    const links = locales.flatMap((locale) =>
      articles
        .filter((other) => other.key === article.key && entryLocale(other.id) === locale)
        .map((other) => ({ url: url(other), lang: locale })),
    );
    extras.set(url(article), { lastmod: day(changed(article)), links });
  }
  for (const locale of locales) {
    const dates = articles.filter((article) => entryLocale(article.id) === locale).map(changed);
    if (dates.length > 0)
      extras.set(new URL(articlePath(locale), site).href, {
        lastmod: day(new Date(Math.max(...dates.map(Number)))),
      });
  }
  for (const { id, updated } of services) {
    const paths = servicePaths(id);
    const links = locales.map((locale) => ({ url: new URL(paths[locale], site).href, lang: locale }));
    for (const { url } of links) extras.set(url, { lastmod: updated, links });
  }
  for (const [path, lastmod] of Object.entries(pageUpdates)) extras.set(new URL(path, site).href, { lastmod });
  return extras;
}

/** An entry of @astrojs/sitemap with its extras and, when it has translations, the x-default the HTML gives them too:
 * the page in the default language (ADR 0008). */
export function sitemapEntry<Entry extends { url: string; links?: SitemapExtra["links"] }>(
  item: Entry,
  extras: Map<string, SitemapExtra>,
): Entry & SitemapExtra {
  const entry: Entry & SitemapExtra = { ...item, ...extras.get(item.url) };
  const fallback = entry.links?.find((link) => link.lang === defaultLocale);
  if (!entry.links || !fallback || entry.links.some((link) => link.lang === "x-default")) return entry;
  return { ...entry, links: [...entry.links, { url: fallback.url, lang: "x-default" }] };
}
