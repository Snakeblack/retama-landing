import { type CollectionEntry, getCollection } from "astro:content";
import type { Locale } from "../i18n/index";
import { checkArticles, entryLocale, entrySlug, newestFirst, translations } from "./blog";

export type ArticleEntryOf = CollectionEntry<"blog">;

/** An article in one language, with its path in every language for the alternates and the language switch. */
export interface LocalArticle {
  entry: ArticleEntryOf;
  slug: string;
  paths: Record<Locale, string>;
}

/** The articles of a language, newest first. Reading them checks the whole blog, so a build with an article missing
 * in a language fails (src/lib/blog.ts, checkArticles). */
export async function articles(locale: Locale): Promise<LocalArticle[]> {
  const all = await getCollection("blog");
  const groups = checkArticles(all);
  const local = all.filter((entry) => entryLocale(entry.id) === locale);
  return newestFirst(local).map((entry) => {
    const group = groups.get(entry.data.key);
    if (!group) throw new Error(`${entry.id}: no translations`);
    return { entry, slug: entrySlug(entry.id), paths: translations(group) };
  });
}
