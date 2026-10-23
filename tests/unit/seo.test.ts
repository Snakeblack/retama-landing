import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { questions } from "../../src/lib/board";
import {
  alternates,
  type Crumb,
  canonicalUrl,
  jsonLd,
  llmsTxt,
  openGraph,
  robotsTxt,
  structuredData,
} from "../../src/lib/seo";

const site = new URL("https://retama.example/");

describe("canonicalUrl", () => {
  it("es absoluta, del propio idioma y con barra final", () => {
    expect(canonicalUrl(site, "/")).toBe("https://retama.example/");
    expect(canonicalUrl(site, "/en/")).toBe("https://retama.example/en/");
    expect(canonicalUrl(site, "/en/servicios")).toBe("https://retama.example/en/servicios/");
  });

  it("descarta query y fragmento", () => {
    expect(canonicalUrl(site, "/en/?utm_source=x#hero")).toBe("https://retama.example/en/");
  });
});

describe("alternates", () => {
  it("declara todos los idiomas y x-default apuntando al idioma por defecto", () => {
    expect(alternates(site, "/")).toEqual([
      { hreflang: "es", href: "https://retama.example/" },
      { hreflang: "en", href: "https://retama.example/en/" },
      { hreflang: "x-default", href: "https://retama.example/" },
    ]);
  });

  it("son recíprocos: la misma lista desde cualquier idioma de la página", () => {
    expect(alternates(site, "/en/servicios/")).toEqual(alternates(site, "/servicios/"));
  });
});

describe("structuredData", () => {
  const graph = (trail?: Crumb[]) => structuredData(site, "en", trail)["@graph"] as Record<string, unknown>[];
  const node = (nodes: Record<string, unknown>[], type: string) =>
    nodes.find((item) => [item["@type"]].flat().includes(type));

  it("describe Retama como organización y servicio profesional, solo con datos que existen", () => {
    const retama = node(graph(), "ProfessionalService");
    expect(retama).toMatchObject({
      "@type": ["Organization", "ProfessionalService"],
      "@id": "https://retama.example/#organization",
      name: "Retama",
      url: "https://retama.example/",
      logo: "https://retama.example/favicon.svg",
      email: "hola@retama.dev",
      description: en["meta.description"],
      knowsLanguage: ["es", "en"],
    });
    // No company yet: no address, tax ID, founder, profiles or service area (seo-structured-data, owner's answers).
    for (const missing of ["address", "taxID", "legalName", "founder", "sameAs", "areaServed"])
      expect(retama).not.toHaveProperty(missing);
  });

  it("lista los servicios de la portada en el idioma de la página", () => {
    const retama = node(structuredData(site, "es")["@graph"] as Record<string, unknown>[], "ProfessionalService");
    const catalog = retama?.hasOfferCatalog as { itemListElement: { itemOffered: { name: string } }[] };
    expect(catalog.itemListElement.map((offer) => offer.itemOffered.name)).toEqual([
      es["services.web"],
      es["services.custom"],
      es["services.agents"],
      es["services.seo"],
    ]);
  });

  it("declara el sitio bilingüe publicado por Retama", () => {
    expect(node(graph(), "WebSite")).toEqual({
      "@type": "WebSite",
      "@id": "https://retama.example/#website",
      name: "Retama",
      url: "https://retama.example/",
      inLanguage: ["es", "en"],
      publisher: { "@id": "https://retama.example/#organization" },
    });
  });

  it("repite las preguntas de la portada como FAQPage, con el texto de la página, solo cuando la página las tiene", () => {
    expect(node(graph(), "FAQPage")).toBeUndefined();
    const faq = node(structuredData(site, "es", [], true)["@graph"] as Record<string, unknown>[], "FAQPage");
    expect(faq).toMatchObject({
      "@type": "FAQPage",
      "@id": "https://retama.example/#preguntas",
      url: "https://retama.example/#preguntas",
      inLanguage: "es",
      isPartOf: { "@id": "https://retama.example/#website" },
    });
    const entities = faq?.mainEntity as { name: string; acceptedAnswer: { "@type": string; text: string } }[];
    expect(entities).toHaveLength(questions.length);
    questions.forEach(([question, answer], index) => {
      expect(entities[index]).toEqual({
        "@type": "Question",
        name: es[question],
        acceptedAnswer: { "@type": "Answer", text: es[answer] },
      });
    });
  });

  it("añade la miga de pan desde el inicio del idioma solo cuando la página la da", () => {
    expect(node(graph(), "BreadcrumbList")).toBeUndefined();
    expect(node(graph([{ name: "Legal information", path: "/en/legal/" }]), "BreadcrumbList")).toEqual({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: en["nav.home"], item: "https://retama.example/en/" },
        { "@type": "ListItem", position: 2, name: "Legal information", item: "https://retama.example/en/legal/" },
      ],
    });
  });
});

describe("jsonLd", () => {
  it("no deja cerrar el script desde un texto", () => {
    const html = jsonLd({ name: "</script><script>alert(1)</script>" });
    expect(html).not.toContain("<");
    expect(JSON.parse(html)).toEqual({ name: "</script><script>alert(1)</script>" });
  });
});

describe("robotsTxt", () => {
  it("admite a todos los rastreadores, también los de IA, y nombra el sitemap del sitio", () => {
    expect(robotsTxt(site)).toBe(
      "User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: https://retama.example/sitemap-index.xml\n",
    );
  });
});

describe("llmsTxt", () => {
  const text = llmsTxt(site);

  it("sigue llmstxt.org: título, resumen en cita y secciones de enlaces", () => {
    const lines = text.split("\n");
    expect(lines[0]).toBe("# Retama");
    expect(lines[2]).toBe(`> ${en["meta.description"]}`);
    expect(text).toMatch(/^## Pages$/m);
  });

  it("enlaza cada página indexable en los dos idiomas, con URL absoluta", () => {
    for (const path of ["/", "/en/", "/legal/", "/en/legal/"]) expect(text).toContain(`](${new URL(path, site).href})`);
  });

  it("da el correo de contacto y los servicios", () => {
    expect(text).toContain("hola@retama.dev");
    for (const key of ["services.web", "services.custom", "services.agents", "services.seo"] as const)
      expect(text).toContain(en[key]);
  });

  it("responde las preguntas de la portada, cada una enlazada a su capítulo", () => {
    expect(text).toMatch(/^## Questions$/m);
    for (const [question, answer] of questions)
      expect(text).toContain(`- [${en[question]}](https://retama.example/en/#questions): ${en[answer]}`);
  });
});

describe("openGraph", () => {
  it("describe la página con su URL canónica y la imagen absoluta de su idioma", () => {
    expect(openGraph(site, "en", "/en/legal/?utm_source=x", "Legal · Retama", "What is in it.")).toEqual([
      ["og:type", "website"],
      ["og:site_name", "Retama"],
      ["og:title", "Legal · Retama"],
      ["og:description", "What is in it."],
      ["og:url", "https://retama.example/en/legal/"],
      ["og:locale", "en_US"],
      ["og:locale:alternate", "es_ES"],
      ["og:image", "https://retama.example/og/en.png"],
      ["og:image:type", "image/png"],
      ["og:image:width", "1200"],
      ["og:image:height", "630"],
      ["og:image:alt", en["og.imageAlt"]],
    ]);
  });

  it("usa la imagen y el territorio del español en las páginas en español", () => {
    const tags = new Map(openGraph(site, "es", "/", "Retama", "Qué hace."));
    expect(tags.get("og:locale")).toBe("es_ES");
    expect(tags.get("og:locale:alternate")).toBe("en_US");
    expect(tags.get("og:image")).toBe("https://retama.example/og/es.png");
    expect(tags.get("og:image:alt")).toBe(es["og.imageAlt"]);
  });
});
