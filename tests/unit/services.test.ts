import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { type Locale, locales, localizedPath } from "../../src/i18n/index";
import { PROJECT_TYPES } from "../../src/lib/contact";
import { serviceImagePath, servicePath, servicePaths, services } from "../../src/lib/services";
import { frontMatter } from "../../src/lib/sitemap";

describe("services", () => {
  it("son las cuatro tarjetas de la portada, en su orden", () => {
    expect(services.map((service) => service.id)).toEqual(["web", "custom", "agents", "seo"]);
  });

  it("no repiten un slug dentro de un idioma", () => {
    for (const locale of locales) {
      const slugs = services.map((service) => service.slugs[locale]);
      expect(new Set(slugs).size, locale).toBe(slugs.length);
    }
  });

  it("dan en cada oferta el precio que dice su texto, sin IVA, en los dos idiomas", () => {
    for (const [copy, amount] of [
      [es, (value: number) => `${value.toLocaleString("de-DE")} €`],
      [en, (value: number) => `€${value.toLocaleString("en-GB")}`],
    ] as const)
      for (const service of services)
        for (const offer of service.offers) {
          expect(copy[offer.text], offer.text).toContain(amount(offer.once));
          if (offer.monthly !== null) expect(copy[offer.text], offer.text).toContain(amount(offer.monthly));
        }
  });

  it("marcan cada uno un tipo distinto del formulario de contacto", () => {
    expect(services.map((service) => service.projectType)).toEqual(["web", "software", "agents", "seo"]);
    for (const service of services) expect(PROJECT_TYPES, service.id).toContain(service.projectType);
  });

  it("empiezan por el precio de su tarjeta", () => {
    for (const service of services) expect(service.offers[0]?.once, service.id).toBeGreaterThan(0);
    expect(services.map((service) => service.offers[0]?.once)).toEqual([1500, 8000, 4000, 800]);
  });
});

describe("servicePath", () => {
  it("cuelga de /servicios/ en español y de /en/services/ en inglés, con el slug de cada idioma", () => {
    expect(servicePath("es", "custom")).toBe("/servicios/software-a-medida/");
    expect(servicePath("en", "custom")).toBe("/en/services/custom-software/");
    expect(servicePath("es", "seo")).toBe("/servicios/seo-y-analitica/");
    expect(servicePath("en", "web")).toBe("/en/services/websites-and-cms/");
  });
});

describe("servicePaths", () => {
  it("da la ruta de la página en cada idioma, para las alternativas y el cambio de idioma", () => {
    expect(servicePaths("agents")).toEqual({
      es: "/servicios/agentes-y-automatizaciones/",
      en: "/en/services/agents-and-automation/",
    });
  });
});

describe("serviceImagePath", () => {
  it("pone la imagen Open Graph en og/ con la ruta de su página", () => {
    expect(serviceImagePath("es", "web")).toBe("/og/servicios/webs-y-cms.png");
    expect(serviceImagePath("en", "seo")).toBe("/og/en/services/seo-and-analytics.png");
  });
});

describe("los artículos de cada servicio", () => {
  const blog = locales.flatMap((locale) =>
    readdirSync(`src/content/blog/${locale}`).map((file) => {
      const source = readFileSync(`src/content/blog/${locale}/${file}`, "utf8");
      return { locale, key: frontMatter(file, source).key, body: source.replace(/^---[\s\S]*?---/, "") };
    }),
  );

  /** The rows of an article's table after its header and its separator, each as its cells. */
  const table = (key: string, locale: Locale) =>
    (blog.find((item) => item.key === key && item.locale === locale)?.body ?? "")
      .split("\n")
      .filter((line) => line.startsWith("| "))
      .slice(2)
      .map((line) =>
        line
          .split("|")
          .slice(1, -1)
          // A no-break space keeps a figure with its sign on a phone.
          .map((cell) => cell.trim().replaceAll("\u00a0", " ")),
      );

  it("existen en el blog, y cada uno enlaza en su texto a la página de su servicio, en cada idioma", () => {
    for (const service of services)
      for (const key of service.articles)
        for (const locale of locales) {
          const article = blog.find((item) => item.key === key && item.locale === locale);
          expect(article, `${key} (${locale})`).toBeDefined();
          expect(article?.body, `${key} (${locale})`).toContain(`](${servicePath(locale, service.id)})`);
        }
  });

  // The cost article's table (owner, 2026-10-30): the diagnosis, the two offers of custom software and its
  // maintenance, in that order, each with the figure the page gives. The sentence above it links the service's page
  // once; the maintenance links the questions, where its terms are.
  it("dan en la tabla del artículo de costes las cifras de software a medida, en cada idioma", () => {
    // Custom software is the second card (the first test).
    const [app, desktop] = services[1].offers;
    for (const [locale, copy, amount, software] of [
      ["es", es, (value: number) => `${value.toLocaleString("de-DE")} €`, "para un software a medida"],
      ["en", en, (value: number) => `€${value.toLocaleString("en-GB")}`, "for custom software"],
    ] as const) {
      const rows = table("software-cost", locale);
      const questions = `${localizedPath(locale, "/")}#${copy["anchor.questions"]}`;
      expect(
        rows.map(([name]) => name?.match(/\]\((.+)\)$/)?.[1]),
        locale,
      ).toEqual([undefined, undefined, undefined, questions]);

      const [diagnosis, ...rest] = rows;
      expect(copy["service.diagnosis"], locale).toContain(diagnosis?.[1]);
      for (const [row, offer] of [
        [rest[0], app],
        [rest[1], desktop],
      ] as const) {
        expect(row?.[1], `${locale} ${offer.name}`).toBe(amount(offer.once));
        expect(row?.[2], `${locale} ${offer.name}`).toBe(copy[offer.text].split(" · ")[1]);
      }
      // The maintenance of custom software, as the questions give it.
      const monthly = rest[2]?.[1]?.replace(/ (al mes|a month)$/, "");
      expect(copy["faq.a6"], locale).toContain(`${monthly} ${software}`);
    }
  });

  // The agents article's table (owner, 2026-10-31): the diagnosis, the set-up and the monthly fee, in that order, each
  // with the figure and the time or the minimum the page gives. No row links anything: the sentence above it links the
  // service's page once.
  it("dan en la tabla del artículo de agentes las cifras de su servicio, en cada idioma", () => {
    // Agents and automation is the third card (the first test).
    const [offer] = services[2].offers;
    for (const [locale, copy, amount, month] of [
      ["es", es, (value: number) => `${value.toLocaleString("de-DE")} €`, "al mes"],
      ["en", en, (value: number) => `€${value.toLocaleString("en-GB")}`, "a month"],
    ] as const) {
      const rows = table("agents-cost", locale);
      expect(rows, locale).toHaveLength(3);
      expect(
        rows.filter(([name]) => name?.includes("](")),
        locale,
      ).toEqual([]);

      const [diagnosis, setUp, fee] = rows;
      expect(copy["service.diagnosis"], locale).toContain(diagnosis?.[1]);
      expect(setUp?.[1], locale).toBe(amount(offer.once));
      expect(setUp?.[2], locale).toBe(copy[offer.text].split(" · ")[1]);
      expect(fee?.[1], locale).toBe(`${amount(offer.monthly)} ${month}`);
    }
  });

  // The SEO article's table (owner, 2026-10-31): the free proposal, the job from its price, no monthly fee and who makes
  // the plan's improvements, in that order, as the page gives them.
  it("dan en la tabla del artículo de SEO el precio de su servicio y ninguna cuota, en cada idioma", () => {
    // SEO and analytics is the fourth card (the first test).
    const [offer] = services[3].offers;
    expect(offer.monthly).toBeNull();
    for (const [locale, copy, price, free, none] of [
      ["es", es, (value: number) => `desde ${value.toLocaleString("de-DE")} €`, "gratis", "no hay"],
      ["en", en, (value: number) => `from €${value.toLocaleString("en-GB")}`, "free", "none"],
    ] as const) {
      const rows = table("seo-cost", locale);
      expect(rows, locale).toHaveLength(4);
      expect(
        rows.filter(([name]) => name?.includes("](")),
        locale,
      ).toEqual([]);

      const [proposal, job, fee] = rows;
      expect(proposal?.[1], locale).toBe(free);
      expect(copy["service.proposal"], locale).toContain(free);
      expect(job?.[1], locale).toBe(price(offer.once));
      expect(fee?.[1], locale).toBe(none);
    }
  });

  it("dan a cada artículo un único servicio", () => {
    const keys = services.flatMap((service) => service.articles);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
