import { en } from "./en";
import { type Dictionary, es } from "./es";

// ADR 0008: the default locale lives at the root, the rest under their prefix.
export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

const dictionaries: Record<Locale, Dictionary> = { es, en };

export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

function withSlashes(path: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  return trimmed === "" ? "/" : `/${trimmed}/`;
}

function prefixedLocale(pathname: string): Locale | undefined {
  const first = pathname.split("/").filter(Boolean)[0];
  return locales.find((locale) => locale !== defaultLocale && locale === first);
}

export function localeFromPath(pathname: string): Locale {
  return prefixedLocale(pathname) ?? defaultLocale;
}

export function pathWithoutLocale(pathname: string): string {
  const locale = prefixedLocale(pathname);
  if (!locale) return withSlashes(pathname);
  return withSlashes(pathname.replace(/^\/+/, "").slice(locale.length));
}

export function localizedPath(locale: Locale, path: string): string {
  const page = withSlashes(path);
  if (locale === defaultLocale) return page;
  return page === "/" ? `/${locale}/` : `/${locale}${page}`;
}
