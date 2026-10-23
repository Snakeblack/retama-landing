import { defaultLocale, type Locale, locales, localizedPath, pathWithoutLocale, t } from "../i18n/index";
import { contactEmail } from "./board";

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

// Open Graph wants a territory with the language: Spain for Spanish, the international default for English.
const ogLocales: Record<Locale, string> = { es: "es_ES", en: "en_US" };

/** The Open Graph tags of an indexable page, as [property, content]. The image is its language's, drawn at build time
 * by scripts/postbuild.mjs into og/<locale>.png at 1200×630. */
export function openGraph(
  site: URL,
  locale: Locale,
  pathname: string,
  title: string,
  description: string,
): [string, string][] {
  return [
    ["og:type", "website"],
    ["og:site_name", "Retama"],
    ["og:title", title],
    ["og:description", description],
    ["og:url", canonicalUrl(site, pathname)],
    ["og:locale", ogLocales[locale]],
    ...locales
      .filter((other) => other !== locale)
      .map((other): [string, string] => ["og:locale:alternate", ogLocales[other]]),
    ["og:image", new URL(`/og/${locale}.png`, site).href],
    ["og:image:type", "image/png"],
    ["og:image:width", "1200"],
    ["og:image:height", "630"],
    ["og:image:alt", t(locale)["og.imageAlt"]],
  ];
}

/** A step of a page's breadcrumb after the home page of its language. */
export interface Crumb {
  name: string;
  path: string;
}

const services = ["services.web", "services.custom", "services.agents", "services.seo"] as const;

/** The JSON-LD of a page: Retama, the site and, when the page gives a trail, its breadcrumb. Only data that exists: no
 * company yet, so no address, tax ID or founder, and no profiles or service area until the owner has them. */
export function structuredData(site: URL, locale: Locale, trail: Crumb[] = []): Record<string, unknown> {
  const copy = t(locale);
  const home = new URL("/", site).href;
  const organization = `${home}#organization`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": organization,
      name: "Retama",
      url: home,
      logo: new URL("/favicon.svg", site).href,
      email: contactEmail,
      description: copy["meta.description"],
      knowsLanguage: [...locales],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: copy["services.title"],
        itemListElement: services.map((key) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: copy[key], description: copy[`${key}Line`] },
        })),
      },
    },
    {
      "@type": "WebSite",
      "@id": `${home}#website`,
      name: "Retama",
      url: home,
      inLanguage: [...locales],
      publisher: { "@id": organization },
    },
  ];
  if (trail.length > 0) {
    const steps = [{ name: copy["nav.home"], path: localizedPath(locale, "/") }, ...trail];
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: steps.map((step, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: step.name,
        item: new URL(step.path, site).href,
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

/** JSON for an inline script: "<" goes as <, so no text can close the script or open a comment. */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** robots.txt: every crawler, AI crawlers included, may read the pages; the contact endpoint is no page. */
export function robotsTxt(site: URL): string {
  return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${new URL("/sitemap-index.xml", site).href}\n`;
}

/** llms.txt (llmstxt.org) in English, the language models default to, linking the pages of both languages. */
export function llmsTxt(site: URL): string {
  const copy = t("en");
  const url = (locale: Locale, path: string) => new URL(localizedPath(locale, path), site).href;
  return [
    "# Retama",
    "",
    `> ${copy["meta.description"]}`,
    "",
    `${copy["sectors.field"]} Every page exists in Spanish and in English; Spanish is the default.`,
    "",
    "## Services",
    "",
    ...services.map((key) => `- ${copy[key]}: ${copy[`${key}Line`]}`),
    "",
    "## Pages",
    "",
    `- [Home](${url("en", "/")}): what Retama builds, for whom and how it works, with the contact form.`,
    `- [Inicio](${url("es", "/")}): the home page in Spanish.`,
    `- [Legal information](${url("en", "/legal/")}): ${copy["legal.metaDescription"]}`,
    `- [Información legal](${url("es", "/legal/")}): the legal information in Spanish, which prevails.`,
    "",
    "## Contact",
    "",
    `- Email: ${contactEmail}`,
    `- Contact form: ${url("en", "/")}#${copy["anchor.contact"]}`,
    "",
  ].join("\n");
}
