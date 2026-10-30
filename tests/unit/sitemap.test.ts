import { describe, expect, it } from "vitest";
import { frontMatter, readArticles, type SitemapArticle, sitemapExtras } from "../../src/lib/sitemap";

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

  it("no fecha las páginas sin una fecha propia, como la portada y la legal", () => {
    for (const path of ["/", "/en/", "/legal/", "/en/legal/"]) expect(extras.has(new URL(path, site).href)).toBe(false);
  });

  it("empareja cada página de servicio con su traducción, sin fecha", () => {
    const pair = [
      { url: "https://retama.example/servicios/software-a-medida/", lang: "es" },
      { url: "https://retama.example/en/services/custom-software/", lang: "en" },
    ];
    expect(extras.get("https://retama.example/servicios/software-a-medida/")).toEqual({ links: pair });
    expect(extras.get("https://retama.example/en/services/custom-software/")).toEqual({ links: pair });
    // The four articles, the two blog indexes and the eight service pages.
    expect([...extras.keys()]).toHaveLength(14);
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
