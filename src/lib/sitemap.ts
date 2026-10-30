import { readdirSync, readFileSync } from "node:fs";
import { locales } from "../i18n/index";
import { articlePath, entryLocale, entrySlug } from "./blog";
import { servicePaths, services } from "./services";

// What the sitemap says of a page beyond its URL, which @astrojs/sitemap (astro.config.mjs) knows nothing of: the dates
// of the blog, and the translation of each article and service page, which it cannot pair because every language has
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
 * change of its newest article, and each service page with its translations. A page with no date of its own, like the
 * home or a service page, gets no lastmod: a build date would change on every deploy. */
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
  for (const { id } of services) {
    const paths = servicePaths(id);
    const links = locales.map((locale) => ({ url: new URL(paths[locale], site).href, lang: locale }));
    for (const { url } of links) extras.set(url, { links });
  }
  return extras;
}
