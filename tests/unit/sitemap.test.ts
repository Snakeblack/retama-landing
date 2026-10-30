import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { services } from "../../src/lib/services";
import {
  frontMatter,
  pageUpdates,
  readArticles,
  type SitemapArticle,
  sitemapEntry,
  sitemapExtras,
} from "../../src/lib/sitemap";

const site = new URL("https://retama.example/");

describe("frontMatter", () => {
  it("lee la clave y las fechas del artículo", () => {
    const source =
      "---\nkey: software-cost\ntitle: What it costs\npublished: 2026-10-23\nupdated: 2026-10-26\n---\n\nBody.";
    expect(frontMatter("en/what-it-costs", source)).toEqual({
      id: "en/what-it-costs",
      key: "software-cost",
      published: new Date("2026-10-23"),
      updated: new Date("2026-10-26"),
    });
  });

  it("admite valores entre comillas y un artículo nunca actualizado", () => {
    const source = "---\r\nkey: \"software-cost\"\r\npublished: '2026-10-23'\r\n---\r\n";
    expect(frontMatter("es/cuanto-cuesta", source)).toEqual({
      id: "es/cuanto-cuesta",
      key: "software-cost",
      published: new Date("2026-10-23"),
      updated: undefined,
    });
  });

  it("falla, nombrando el artículo, sin clave o sin fecha de publicación", () => {
    expect(() => frontMatter("es/a", "---\npublished: 2026-10-23\n---\n")).toThrow("es/a");
    expect(() => frontMatter("es/a", "---\nkey: a\n---\n")).toThrow("es/a");
    expect(() => frontMatter("es/a", "Sin cabecera.")).toThrow("es/a");
  });
});

describe("sitemapExtras", () => {
  const articles: SitemapArticle[] = [
    { id: "es/cuanto-cuesta", key: "cost", published: new Date("2026-10-23"), updated: new Date("2026-10-26") },
    { id: "en/what-it-costs", key: "cost", published: new Date("2026-10-23"), updated: new Date("2026-10-26") },
    { id: "es/decisiones", key: "decisions", published: new Date("2026-10-24") },
    { id: "en/decisions", key: "decisions", published: new Date("2026-10-24") },
  ];
  const extras = sitemapExtras(site, articles);

  it("da a cada artículo su última fecha y su traducción, en el orden de los idiomas", () => {
    const pair = [
      { url: "https://retama.example/blog/cuanto-cuesta/", lang: "es" },
      { url: "https://retama.example/en/blog/what-it-costs/", lang: "en" },
    ];
    expect(extras.get("https://retama.example/blog/cuanto-cuesta/")).toEqual({ lastmod: "2026-10-26", links: pair });
    expect(extras.get("https://retama.example/en/blog/what-it-costs/")).toEqual({ lastmod: "2026-10-26", links: pair });
  });

  it("usa la fecha de publicación del artículo que nunca se ha actualizado", () => {
    expect(extras.get("https://retama.example/blog/decisiones/")?.lastmod).toBe("2026-10-24");
  });

  it("fecha el índice de cada idioma con su artículo más reciente, sin tocar sus pares", () => {
    expect(extras.get("https://retama.example/blog/")).toEqual({ lastmod: "2026-10-26" });
    expect(extras.get("https://retama.example/en/blog/")).toEqual({ lastmod: "2026-10-26" });
  });

  it("fecha la portada y la legal con su fecha puesta a mano, sin tocar sus pares", () => {
    expect(extras.get("https://retama.example/")).toEqual({ lastmod: "2026-10-30" });
    expect(extras.get("https://retama.example/en/")).toEqual({ lastmod: "2026-10-30" });
    expect(extras.get("https://retama.example/legal/")).toEqual({ lastmod: "2026-10-24" });
    expect(extras.get("https://retama.example/en/legal/")).toEqual({ lastmod: "2026-10-26" });
  });

  it("empareja cada página de servicio con su traducción y la fecha con su servicio", () => {
    const pair = [
      { url: "https://retama.example/servicios/software-a-medida/", lang: "es" },
      { url: "https://retama.example/en/services/custom-software/", lang: "en" },
    ];
    const custom = { lastmod: "2026-10-30", links: pair };
    expect(extras.get("https://retama.example/servicios/software-a-medida/")).toEqual(custom);
    expect(extras.get("https://retama.example/en/services/custom-software/")).toEqual(custom);
    // The four articles, the two blog indexes, the eight service pages and the four dated by hand.
    expect([...extras.keys()]).toHaveLength(18);
  });

  it("toma las fechas a mano en formato AAAA-MM-DD, y la legal es la que muestra su texto en cada idioma", () => {
    const dates = [...Object.values(pageUpdates), ...services.map((service) => service.updated)];
    for (const date of dates) expect(new Date(date).toISOString().slice(0, 10)).toBe(date);
    const shown = (date: string | undefined, locale: string) =>
      new Date(date ?? "").toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      });
    expect(es["legal.updated"]).toContain(shown(pageUpdates["/legal/"], "es"));
    expect(en["legal.updated"]).toContain(shown(pageUpdates["/en/legal/"], "en-GB"));
  });

  it("no fecha el índice de un blog sin artículos", () => {
    const empty = sitemapExtras(site, []);
    expect([...empty.keys()].some((url) => url.includes("/blog/"))).toBe(false);
  });
});

describe("readArticles", () => {
  it("lee todos los artículos de src/content/blog, cada uno en su carpeta de idioma", () => {
    const articles = readArticles(new URL("../../src/content/blog/", import.meta.url));
    expect(articles.length).toBeGreaterThanOrEqual(4);
    expect(articles.map((article) => article.id)).toEqual(
      expect.arrayContaining(["es/cuanto-cuesta-un-software-a-medida", "en/what-custom-software-costs"]),
    );
    for (const article of articles) expect(Number.isNaN(article.published.getTime()), article.id).toBe(false);
  });
});

describe("sitemapEntry", () => {
  const extras = sitemapExtras(site, []);
  const pair = [
    { url: "https://retama.example/legal/", lang: "es" },
    { url: "https://retama.example/en/legal/", lang: "en" },
  ];

  it("añade a las traducciones el x-default de la versión en español, como el HTML (ADR 0008)", () => {
    expect(sitemapEntry({ url: "https://retama.example/en/legal/", links: pair }, extras)).toEqual({
      url: "https://retama.example/en/legal/",
      lastmod: "2026-10-26",
      links: [...pair, { url: "https://retama.example/legal/", lang: "x-default" }],
    });
  });

  it("también a las traducciones que traen los extras, y nunca dos veces", () => {
    const entry = sitemapEntry({ url: "https://retama.example/servicios/software-a-medida/" }, extras);
    expect(entry.links?.filter((link) => link.lang === "x-default")).toEqual([
      { url: "https://retama.example/servicios/software-a-medida/", lang: "x-default" },
    ]);
    expect(sitemapEntry(entry, new Map())).toEqual(entry);
  });

  it("deja como está una página sin traducciones", () => {
    expect(sitemapEntry({ url: "https://retama.example/otra/" }, extras)).toEqual({
      url: "https://retama.example/otra/",
    });
  });
});
