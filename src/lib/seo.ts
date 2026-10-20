import { defaultLocale, locales, localizedPath, pathWithoutLocale } from "../i18n/index";

export interface Alternate {
  hreflang: string;
  href: string;
}

export function canonicalUrl(site: URL, pathname: string): string {
  const url = new URL(pathname, site);
  return new URL(localizedPath(defaultLocale, url.pathname), site).href;
}

// ADR 0008: every page lists every locale plus x-default, so the set is reciprocal.
export function alternates(site: URL, pathname: string): Alternate[] {
  const page = pathWithoutLocale(new URL(pathname, site).pathname);
  const links = locales.map((locale) => ({
    hreflang: locale,
    href: new URL(localizedPath(locale, page), site).href,
  }));
  return [...links, { hreflang: "x-default", href: new URL(localizedPath(defaultLocale, page), site).href }];
}
