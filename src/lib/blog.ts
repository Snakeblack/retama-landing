import { type Locale, locales, localizedPath } from "../i18n/index";

/** What the blog reads of an entry of the `blog` collection (src/content.config.ts): its id is `<locale>/<slug>`. */
export interface ArticleEntry {
  id: string;
  body?: string;
  data: { key: string; title: string; description: string; published: Date; updated?: Date | undefined };
}

/** DESIGN.md: no heading runs past two lines, and an article's title is its page's h1. */
export const TITLE_MAX = 40;

const WORDS_PER_MINUTE = 200;

export function entryLocale(id: string): Locale {
  const [folder] = id.split("/");
  const locale = locales.find((code) => code === folder);
  if (!locale || !id.includes("/"))
    throw new Error(`${id}: an article lives in a language folder (${locales.join(", ")})`);
  return locale;
}

export function entrySlug(id: string): string {
  return id.slice(id.indexOf("/") + 1);
}

export function articlePath(locale: Locale, slug?: string): string {
  return localizedPath(locale, slug ? `/blog/${slug}/` : "/blog/");
}

/** The RSS of a language's blog, beside its index. */
export function feedPath(locale: Locale): string {
  return `${articlePath(locale)}rss.xml`;
}

/** The Open Graph image of an article, drawn at build time by scripts/postbuild.mjs; under its language's folder,
 * since two languages may share a slug. */
export function ogImagePath(locale: Locale, slug: string): string {
  return `/og/${locale}/${slug}.png`;
}

/** The articles grouped by their key, one per language. The build fails, listing every problem at once, when an
 * article is missing in a language (ADR 0008), a language has its key twice, a title would run past two lines, the
 * update predates the publication, or the body holds code: DESIGN.md has no monospace for it, and the highlighter
 * would write inline styles the CSP refuses (ADR 0006). */
export function checkArticles<T extends ArticleEntry>(entries: T[]): Map<string, Record<Locale, T>> {
  const groups = new Map<string, Partial<Record<Locale, T>>>();
  const problems: string[] = [];
  for (const entry of entries) {
    const locale = entryLocale(entry.id);
    const { key, title, published, updated } = entry.data;
    const group = groups.get(key) ?? {};
    if (group[locale]) problems.push(`${key}: ${locale} has it twice (${group[locale].id}, ${entry.id})`);
    group[locale] = entry;
    groups.set(key, group);
    if (/`|~~~/.test(entry.body ?? "")) problems.push(`${entry.id}: no código en un artículo (no code in an article)`);
    if (title.length > TITLE_MAX)
      problems.push(`${entry.id}: the title has ${title.length} characters, over ${TITLE_MAX}`);
    if (updated && updated < published) problems.push(`${entry.id}: updated before it was published`);
  }
  for (const [key, group] of groups)
    for (const locale of locales) if (!group[locale]) problems.push(`${key}: missing in ${locale}`);
  if (problems.length > 0) throw new Error(`The blog does not build:\n${problems.join("\n")}`);
  return groups as Map<string, Record<Locale, T>>;
}

/** The path of an article in every language, for its alternates and the language switch. */
export function translations(group: Record<Locale, ArticleEntry>): Record<Locale, string> {
  return Object.fromEntries(
    locales.map((locale) => [locale, articlePath(locale, entrySlug(group[locale].id))]),
  ) as Record<Locale, string>;
}

export function newestFirst<T extends ArticleEntry>(entries: T[]): T[] {
  return [...entries].sort(
    (a, b) => b.data.published.getTime() - a.data.published.getTime() || a.data.title.localeCompare(b.data.title),
  );
}

/** Minutes to read a Markdown body: its words (Markdown syntax is not one) at 200 a minute, rounded up, at least one. */
export function readingMinutes(markdown: string): number {
  const words = markdown.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** The long date in the page's language. Front-matter dates are midnight UTC, so they are read in UTC. */
export function formatDate(locale: Locale, date: Date): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: "UTC" }).format(date);
}
