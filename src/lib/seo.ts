import { defaultLocale, type Locale, locales, localizedPath, pathWithoutLocale, t } from "../i18n/index";
import { areaServed, blogAuthor, contactEmail, partners, questions } from "./board";
import { type ServiceId, serviceById, serviceImagePath, servicePath, services } from "./services";

export interface Alternate {
  hreflang: string;
  href: string;
}

export function canonicalUrl(site: URL, pathname: string): string {
  const url = new URL(pathname, site);
  return new URL(localizedPath(defaultLocale, url.pathname), site).href;
}

// ADR 0008: every page lists every locale plus x-default, so the set is reciprocal. A page whose path is translated,
// like an article of the blog, gives its path in every locale.
export function alternates(site: URL, pathname: string, paths?: Record<Locale, string>): Alternate[] {
  const page = pathWithoutLocale(new URL(pathname, site).pathname);
  const path = (locale: Locale) => paths?.[locale] ?? localizedPath(locale, page);
  const links = locales.map((locale) => ({ hreflang: locale, href: new URL(path(locale), site).href }));
  return [...links, { hreflang: "x-default", href: new URL(path(defaultLocale), site).href }];
}

/** An article of the blog, as its Open Graph tags and its JSON-LD describe it. */
export interface Article {
  headline: string;
  description: string;
  published: Date;
  updated?: Date | undefined;
  /** Its path in the page's language. */
  path: string;
  /** The path of its own Open Graph image (src/lib/blog.ts, ogImagePath). */
  image: string;
}

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

// Open Graph wants a territory with the language: Spain for Spanish, the international default for English.
const ogLocales: Record<Locale, string> = { es: "es_ES", en: "en_US" };

/** A page's own Open Graph image, like a service page's (src/lib/services.ts, serviceImagePath), with its text. */
export interface OwnImage {
  path: string;
  alt: string;
}

/** The Open Graph tags of an indexable page, as [property, content]. The image, 1200×630 and drawn at build time by
 * scripts/postbuild.mjs, is its language's (og/<locale>.png), or an article's or a service page's own. */
export function openGraph(
  site: URL,
  locale: Locale,
  pathname: string,
  title: string,
  description: string,
  article?: Article,
  image?: OwnImage,
): [string, string][] {
  const dates: [string, string][] = article
    ? [
        ["article:published_time", isoDate(article.published)],
        ["article:modified_time", isoDate(article.updated ?? article.published)],
      ]
    : [];
  return [
    ["og:type", article ? "article" : "website"],
    ["og:site_name", "Retama"],
    ["og:title", title],
    ["og:description", description],
    ["og:url", canonicalUrl(site, pathname)],
    ["og:locale", ogLocales[locale]],
    ...locales
      .filter((other) => other !== locale)
      .map((other): [string, string] => ["og:locale:alternate", ogLocales[other]]),
    ["og:image", new URL(article?.image ?? image?.path ?? `/og/${locale}.png`, site).href],
    ["og:image:type", "image/png"],
    ["og:image:width", "1200"],
    ["og:image:height", "630"],
    [
      "og:image:alt",
      article ? `${article.headline}, ${t(locale)["blog.imageAlt"]}` : (image?.alt ?? t(locale)["og.imageAlt"]),
    ],
    ...dates,
  ];
}

/** A step of a page's breadcrumb after the home page of its language. */
export interface Crumb {
  name: string;
  path: string;
}

// What only the questions price (faq.a2, faq.a6), with the same figures.
const questionOffers = [
  ["offers.diagnosis", 900, null],
  ["offers.cms", 3500, null],
  ["offers.desktop", 10000, null],
  ["offers.maintenance", null, 120],
] as const;

/** A minimum price excluding VAT, once and, when it has one, a month (UN/CEFACT MON). */
function priceSpecification(once: number | null, monthly: number | null) {
  const price = (minPrice: number, unit: boolean) => ({
    "@type": unit ? "UnitPriceSpecification" : "PriceSpecification",
    minPrice,
    priceCurrency: "EUR",
    valueAddedTaxIncluded: false,
    ...(unit ? { unitCode: "MON" } : {}),
  });
  const prices = [...(once === null ? [] : [price(once, false)]), ...(monthly === null ? [] : [price(monthly, true)])];
  return prices.length === 1 ? prices[0] : prices;
}

/** An offer of the catalog with its minimum, and the page of its service when it has one. */
function offer(name: string, description: string | null, once: number | null, monthly: number | null, url?: string) {
  return {
    "@type": "Offer",
    itemOffered: {
      "@type": "Service",
      name,
      ...(description === null ? {} : { description }),
      ...(url === undefined ? {} : { url }),
    },
    priceSpecification: priceSpecification(once, monthly),
  };
}

/** The JSON-LD of a page: Retama, the site, when the page gives a trail its breadcrumb, when it holds the questions
 * chapter its FAQPage, when it is an article its BlogPosting, signed by Manuel M., and when it is a service page its
 * Service. Only data that exists: no company yet, so no address, tax ID or founder; the partners are its members, and
 * only Michael has a profile. */
export function structuredData(
  site: URL,
  locale: Locale,
  trail: Crumb[] = [],
  withQuestions = false,
  article?: Article,
  service?: ServiceId,
): Record<string, unknown> {
  const copy = t(locale);
  const home = new URL("/", site).href;
  const organization = `${home}#organization`;
  const team = `${new URL(localizedPath(locale, "/"), site).href}#${copy["anchor.team"]}`;
  const countries = new Intl.DisplayNames([locale], { type: "region" });
  const area = areaServed.map((code) => ({ "@type": "Country", name: countries.of(code) }));
  const page = (id: ServiceId) => new URL(servicePath(locale, id), site).href;
  const graph: Record<string, unknown>[] = [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": organization,
      name: "Retama",
      url: home,
      logo: new URL("/apple-touch-icon.png", site).href,
      email: contactEmail,
      description: copy["meta.description"],
      knowsLanguage: [...locales],
      areaServed: area,
      member: partners.map((partner) => ({
        "@type": "Person",
        "@id": `${home}#${partner.key}`,
        name: partner.name,
        jobTitle: copy[partner.role],
        ...("linkedin" in partner ? { sameAs: [partner.linkedin] } : {}),
      })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: copy["services.title"],
        itemListElement: [
          ...services.map(({ id, offers: [card] }) =>
            offer(copy[`services.${id}`], copy[`services.${id}Line`], card.once, card.monthly, page(id)),
          ),
          ...questionOffers.map(([key, once, monthly]) => offer(copy[key], null, once, monthly)),
        ],
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
  if (withQuestions) {
    // The answers are the chapter's own text, word for word, as search engines ask of a FAQPage.
    const chapter = `${new URL(localizedPath(locale, "/"), site).href}#${copy["anchor.questions"]}`;
    graph.push({
      "@type": "FAQPage",
      "@id": chapter,
      url: chapter,
      inLanguage: locale,
      isPartOf: { "@id": `${home}#website` },
      mainEntity: questions.map(([question, answer]) => ({
        "@type": "Question",
        name: copy[question],
        acceptedAnswer: { "@type": "Answer", text: copy[answer] },
      })),
    });
  }
  if (article) {
    const url = new URL(article.path, site).href;
    graph.push({
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      url,
      mainEntityOfPage: url,
      headline: article.headline,
      description: article.description,
      inLanguage: locale,
      datePublished: isoDate(article.published),
      dateModified: isoDate(article.updated ?? article.published),
      image: new URL(article.image, site).href,
      author: { "@type": "Person", name: blogAuthor, url: team },
      publisher: { "@id": organization },
      isPartOf: { "@id": `${home}#website` },
    });
  }
  if (service) {
    const url = page(service);
    graph.push({
      "@type": "Service",
      "@id": `${url}#service`,
      name: copy[`services.${service}`],
      description: copy[`service.${service}.metaDescription`],
      url,
      image: new URL(serviceImagePath(locale, service), site).href,
      provider: { "@id": organization },
      areaServed: area,
      offers: serviceById(service).offers.map((item) => ({
        "@type": "Offer",
        name: copy[item.name],
        priceSpecification: priceSpecification(item.once, item.monthly),
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

/** An article as llms.txt lists it. */
export interface ArticleLink {
  locale: Locale;
  title: string;
  description: string;
  path: string;
}

/** llms.txt (llmstxt.org) in English, the language models default to, linking the pages of both languages, the
 * service pages among them, and the articles of the blog, English first. */
export function llmsTxt(site: URL, articles: ArticleLink[] = []): string {
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
    ...services.map(
      ({ id }) =>
        `- [${copy[`services.${id}`]}](${new URL(servicePath("en", id), site).href}): ${copy[`services.${id}Line`]} ${copy[`services.${id}From`]}.`,
    ),
    "",
    "## Questions",
    "",
    ...questions.map(
      ([question, answer]) => `- [${copy[question]}](${url("en", "/")}#${copy["anchor.questions"]}): ${copy[answer]}`,
    ),
    "",
    "## Pages",
    "",
    `- [Home](${url("en", "/")}): what Retama builds, for whom and how it works, with the contact form.`,
    `- [Inicio](${url("es", "/")}): the home page in Spanish.`,
    `- [Legal information](${url("en", "/legal/")}): ${copy["legal.metaDescription"]}`,
    `- [Información legal](${url("es", "/legal/")}): the legal information in Spanish, which prevails.`,
    `- [Blog](${url("en", "/blog/")}): ${copy["blog.metaDescription"]}`,
    `- [Blog en español](${url("es", "/blog/")}): the blog in Spanish.`,
    ...services.map(
      ({ id }) =>
        `- [${t("es")[`services.${id}`]}](${new URL(servicePath("es", id), site).href}): ${copy[`services.${id}`]}, in Spanish.`,
    ),
    "",
    "## Blog",
    "",
    ...[...articles]
      .sort((a, b) => Number(b.locale === "en") - Number(a.locale === "en"))
      .map((article) => `- [${article.title}](${new URL(article.path, site).href}): ${article.description}`),
    "",
    "## Contact",
    "",
    `- Email: ${contactEmail}`,
    `- Contact form: ${url("en", "/")}#${copy["anchor.contact"]}`,
    "",
  ].join("\n");
}
