import { type Locale, locales, localizedPath } from "../i18n/index";

// The four services of the home's cards, each with a page of its own in every language (owner, 2026-10-30): the cards,
// the pages, the JSON-LD, the sitemap and llms.txt read them from here.

/** The services in the order of their cards. Each has its slug in every language; the offers its page prices, the
 * card's starting price first, each with the keys of its name and of the text that gives its figures and its minimum in
 * euros excluding VAT, once and, when it has one, a month (business proposal 1.4); the part of the hero's retama its card frames from lg (x, y, width and height in the frame of HERO),
 * which its page shows too; and the keys of its page (DESIGN.md Layout, the service pages): what it includes, when it
 * fits, how it starts and the decision sheets of the method it shows (src/lib/board.ts, sheets); and the articles of
 * the blog about it, by key, which its page lists and which link it in their text (owner, 2026-10-30). */
export const services = [
  {
    id: "web",
    slugs: { es: "webs-y-cms", en: "websites-and-cms" },
    offers: [
      { name: "service.web.landing", text: "service.web.landingFrom", once: 1500, monthly: null },
      { name: "offers.cms", text: "service.web.cmsFrom", once: 3500, monthly: null },
    ],
    part: "560 60 480 470",
    includes: [
      ["service.web.i1", "service.web.i1Text"],
      ["service.web.i2", "service.web.i2Text"],
      ["service.web.i3", "service.web.i3Text"],
      ["service.web.i4", "service.web.i4Text"],
    ],
    fits: ["service.web.fit1", "service.web.fit2", "service.web.fit3"],
    steps: [
      ["service.proposal", "service.proposalRest"],
      ["service.deliveries", "service.deliveriesRest"],
      ["service.warranty", "service.warrantyRest"],
    ],
    sheets: ["web"],
    articles: ["web-security-updates"],
  },
  {
    id: "custom",
    slugs: { es: "software-a-medida", en: "custom-software" },
    offers: [
      { name: "service.custom.app", text: "service.custom.appFrom", once: 8000, monthly: null },
      { name: "offers.desktop", text: "service.custom.desktopFrom", once: 10000, monthly: null },
    ],
    part: "600 330 400 390",
    includes: [
      ["service.custom.i1", "service.custom.i1Text"],
      ["service.custom.i2", "service.custom.i2Text"],
      ["service.custom.i3", "service.custom.i3Text"],
      ["service.custom.i4", "service.custom.i4Text"],
    ],
    fits: ["service.custom.fit1", "service.custom.fit2", "service.custom.fit3"],
    steps: [
      ["service.diagnosis", "service.diagnosisRest"],
      ["service.deliveries", "service.deliveriesRest"],
      ["service.warranty", "service.warrantyRest"],
    ],
    sheets: ["custom", "desktop"],
    articles: ["software-cost", "written-decisions"],
  },
  {
    id: "agents",
    slugs: { es: "agentes-y-automatizaciones", en: "agents-and-automation" },
    offers: [{ name: "services.agents", text: "services.agentsFrom", once: 4000, monthly: 150 }],
    part: "380 560 840 820",
    includes: [
      ["service.agents.i1", "service.agents.i1Text"],
      ["service.agents.i2", "service.agents.i2Text"],
      ["service.agents.i3", "service.agents.i3Text"],
    ],
    fits: ["service.agents.fit1", "service.agents.fit2", "service.agents.fit3"],
    steps: [
      ["service.diagnosis", "service.diagnosisRest"],
      ["service.deliveries", "service.deliveriesRest"],
      ["service.warranty", "service.warrantyRest"],
    ],
    sheets: ["agents"],
    articles: [],
  },
  {
    id: "seo",
    slugs: { es: "seo-y-analitica", en: "seo-and-analytics" },
    offers: [{ name: "services.seo", text: "services.seoFrom", once: 800, monthly: null }],
    part: "100 1100 1400 800",
    includes: [
      ["service.seo.i1", "service.seo.i1Text"],
      ["service.seo.i2", "service.seo.i2Text"],
      ["service.seo.i3", "service.seo.i3Text"],
      ["service.seo.i4", "service.seo.i4Text"],
    ],
    fits: ["service.seo.fit1", "service.seo.fit2", "service.seo.fit3"],
    steps: [
      ["service.proposal", "service.proposalRest"],
      ["service.seo.step2", "service.seo.step2Rest"],
      ["service.warranty", "service.warrantyRest"],
    ],
    sheets: ["seo"],
    articles: [],
  },
] as const;

export type Service = (typeof services)[number];
export type ServiceId = Service["id"];

// The folder of the service pages in each language (src/pages/servicios, src/pages/en/services).
const folders: Record<Locale, string> = { es: "servicios", en: "services" };

export function serviceById(id: ServiceId): Service {
  const found = services.find((item) => item.id === id);
  if (!found) throw new Error(`unknown service: ${id}`);
  return found;
}

export function servicePath(locale: Locale, id: ServiceId): string {
  return localizedPath(locale, `/${folders[locale]}/${serviceById(id).slugs[locale]}/`);
}

/** A service page's path in every language, for its alternates and the language switch. */
export function servicePaths(id: ServiceId): Record<Locale, string> {
  return Object.fromEntries(locales.map((locale) => [locale, servicePath(locale, id)])) as Record<Locale, string>;
}

/** The Open Graph image of a service page, drawn at build time by scripts/postbuild.mjs from its Service: under og/,
 * at the page's own path, so no slug of another page can take it. */
export function serviceImagePath(locale: Locale, id: ServiceId): string {
  return `/og${servicePath(locale, id).replace(/\/$/, "")}.png`;
}
