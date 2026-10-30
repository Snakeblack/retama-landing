import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { locales } from "../../src/i18n/index";
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

  it("existen en el blog, y cada uno enlaza en su texto a la página de su servicio, en cada idioma", () => {
    for (const service of services)
      for (const key of service.articles)
        for (const locale of locales) {
          const article = blog.find((item) => item.key === key && item.locale === locale);
          expect(article, `${key} (${locale})`).toBeDefined();
          expect(article?.body, `${key} (${locale})`).toContain(`](${servicePath(locale, service.id)})`);
        }
  });

  it("dan a cada artículo un único servicio", () => {
    const keys = services.flatMap((service) => service.articles);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
