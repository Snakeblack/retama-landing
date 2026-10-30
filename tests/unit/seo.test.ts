import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { questions } from "../../src/lib/board";
import {
  type Article,
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

  it("usan las rutas traducidas de la página cuando las tiene, como un artículo del blog", () => {
    const paths = { es: "/blog/cuanto-cuesta/", en: "/en/blog/what-it-costs/" };
    expect(alternates(site, "/en/blog/what-it-costs/", paths)).toEqual([
      { hreflang: "es", href: "https://retama.example/blog/cuanto-cuesta/" },
      { hreflang: "en", href: "https://retama.example/en/blog/what-it-costs/" },
      { hreflang: "x-default", href: "https://retama.example/blog/cuanto-cuesta/" },
    ]);
    expect(alternates(site, "/blog/cuanto-cuesta/", paths)).toEqual(alternates(site, "/en/blog/what-it-costs/", paths));
  });
});

describe("structuredData", () => {
  const graph = (trail?: Crumb[]) => structuredData(site, "en", trail)["@graph"] as Record<string, unknown>[];
  const node = (nodes: Record<string, unknown>[], type: string) =>
    nodes.find((item) => [item["@type"]].flat().includes(type));

  it("describe Retama como negocio online, sin local ni dirección, solo con datos que existen", () => {
    const retama = node(graph(), "OnlineBusiness");
    expect(retama).toMatchObject({
      "@type": "OnlineBusiness",
      "@id": "https://retama.example/#organization",
      name: "Retama",
      url: "https://retama.example/",
      logo: "https://retama.example/apple-touch-icon.png",
      email: "hola@retama.dev",
      description: en["meta.description"],
      knowsLanguage: ["es", "en"],
    });
    // No company yet: no address, tax ID, legal name or founder, and no profile of its own (seo-structured-data,
    // team-section).
    for (const missing of ["address", "taxID", "legalName", "founder", "sameAs"])
      expect(retama).not.toHaveProperty(missing);
  });

  it("sirve a España, Portugal e Hispanoamérica, cada país con su nombre en el idioma de la página", () => {
    const area = (locale: "es" | "en") =>
      node(structuredData(site, locale)["@graph"] as Record<string, unknown>[], "OnlineBusiness")?.areaServed as Record<
        string,
        unknown
      >[];
    expect(area("es")).toHaveLength(21);
    for (const country of area("es")) expect(country["@type"]).toBe("Country");
    const names = (locale: "es" | "en") => area(locale).map((country) => country.name);
    expect(names("es").slice(0, 2)).toEqual(["España", "Portugal"]);
    expect(names("es")).toEqual(expect.arrayContaining(["México", "Argentina", "Colombia", "Puerto Rico"]));
    expect(names("es")).not.toContain("Brasil");
    expect(names("en").slice(0, 2)).toEqual(["Spain", "Portugal"]);
    expect(names("en")).toContain("Mexico");
  });

  it("presenta a los dos socios como miembros de Retama, con su cargo y, si lo hay, su perfil", () => {
    const members = (locale: "es" | "en") =>
      node(structuredData(site, locale)["@graph"] as Record<string, unknown>[], "OnlineBusiness")?.member as Record<
        string,
        unknown
      >[];
    expect(members("es")).toEqual([
      {
        "@type": "Person",
        "@id": "https://retama.example/#paul",
        name: "Paul Macorny Retamozo García",
        jobTitle: es["team.paulRole"],
      },
      {
        "@type": "Person",
        "@id": "https://retama.example/#michael",
        name: "Manuel Michael Retamozo García",
        jobTitle: es["team.michaelRole"],
        sameAs: ["https://www.linkedin.com/in/mmretamozo/"],
      },
    ]);
    expect(members("en").map((member) => member.jobTitle)).toEqual([en["team.paulRole"], en["team.michaelRole"]]);
  });

  it("lista las cuatro tarjetas y lo que solo precian las preguntas, en el idioma de la página", () => {
    const retama = node(structuredData(site, "es")["@graph"] as Record<string, unknown>[], "OnlineBusiness");
    const catalog = retama?.hasOfferCatalog as { itemListElement: { itemOffered: Record<string, unknown> }[] };
    expect(catalog.itemListElement.map((offer) => offer.itemOffered.name)).toEqual([
      es["services.web"],
      es["services.custom"],
      es["services.agents"],
      es["services.seo"],
      es["offers.diagnosis"],
      es["offers.cms"],
      es["offers.desktop"],
      es["offers.maintenance"],
    ]);
    // A card's offer carries its line; the others have no text of their own on the page.
    expect(catalog.itemListElement[0]?.itemOffered.description).toBe(es["services.webLine"]);
    expect(catalog.itemListElement[4]?.itemOffered).not.toHaveProperty("description");
    // A card's service links its page in the page's language (owner, 2026-10-30); the others have none.
    expect(catalog.itemListElement.slice(0, 4).map((offer) => offer.itemOffered.url)).toEqual([
      "https://retama.example/servicios/webs-y-cms/",
      "https://retama.example/servicios/software-a-medida/",
      "https://retama.example/servicios/agentes-y-automatizaciones/",
      "https://retama.example/servicios/seo-y-analitica/",
    ]);
    expect(catalog.itemListElement[4]?.itemOffered).not.toHaveProperty("url");
  });

  it("da el precio mínimo de cada oferta sin IVA, el mismo que su tarjeta o sus preguntas, y al mes lo mensual", () => {
    for (const [locale, copy, amount] of [
      ["es", es, (value: number) => `${value.toLocaleString("de-DE")} €`],
      ["en", en, (value: number) => `€${value.toLocaleString("en-GB")}`],
    ] as const) {
      const retama = node(structuredData(site, locale)["@graph"] as Record<string, unknown>[], "OnlineBusiness");
      const catalog = retama?.hasOfferCatalog as { itemListElement: { priceSpecification: unknown }[] };
      const prices = catalog.itemListElement.map(
        (offer) => [offer.priceSpecification].flat() as Record<string, unknown>[],
      );
      const once = (minPrice: number) => ({ "@type": "PriceSpecification", minPrice });
      const monthly = (minPrice: number) => ({ "@type": "UnitPriceSpecification", minPrice, unitCode: "MON" });
      expect(prices).toMatchObject([
        [once(1500)],
        [once(8000)],
        [once(4000), monthly(150)],
        [once(800)],
        [once(900)],
        [once(3500)],
        [once(10000)],
        [monthly(120)],
      ]);
      for (const price of prices.flat())
        expect(price).toMatchObject({ priceCurrency: "EUR", valueAddedTaxIncluded: false });
      // Each figure is the one the page gives: the card's "From" text, else the questions on prices and maintenance.
      const sources = [
        "services.webFrom",
        "services.customFrom",
        "services.agentsFrom",
        "services.seoFrom",
        "faq.a2",
        "faq.a2",
        "faq.a2",
        "faq.a6",
      ] as const;
      sources.forEach((key, index) => {
        for (const price of prices[index] ?? []) expect(copy[key], key).toContain(amount(price.minPrice as number));
      });
    }
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

describe("structuredData de un artículo", () => {
  const article: Article = {
    headline: "What custom software costs",
    description: "What drives the cost.",
    published: new Date("2026-10-23"),
    path: "/en/blog/what-it-costs/",
    image: "/og/en/what-it-costs.png",
  };
  const nodes = (item?: Article) => structuredData(site, "en", [], false, item)["@graph"] as Record<string, unknown>[];
  const posting = (item?: Article) => nodes(item).find((node) => node["@type"] === "BlogPosting");

  it("lo firma Manuel M., con su enlace al capítulo del equipo, en el idioma de la página, y su perfil", () => {
    expect(posting(article)?.author).toEqual({
      "@type": "Person",
      name: "Manuel M.",
      url: "https://retama.example/en/#about-us",
      sameAs: ["https://www.linkedin.com/in/mmretamozo/"],
    });
    const spanish = structuredData(site, "es", [], false, { ...article, path: "/blog/cuanto-cuesta/" })[
      "@graph"
    ] as Record<string, unknown>[];
    expect(spanish.find((node) => node["@type"] === "BlogPosting")?.author).toMatchObject({
      url: "https://retama.example/#nosotros",
    });
  });

  it("lo describe como BlogPosting de Retama, en su idioma y con su propia imagen", () => {
    expect(posting()).toBeUndefined();
    expect(posting(article)).toEqual({
      "@type": "BlogPosting",
      "@id": "https://retama.example/en/blog/what-it-costs/#article",
      url: "https://retama.example/en/blog/what-it-costs/",
      mainEntityOfPage: "https://retama.example/en/blog/what-it-costs/",
      headline: "What custom software costs",
      description: "What drives the cost.",
      inLanguage: "en",
      datePublished: "2026-10-23",
      dateModified: "2026-10-23",
      image: "https://retama.example/og/en/what-it-costs.png",
      author: {
        "@type": "Person",
        name: "Manuel M.",
        url: "https://retama.example/en/#about-us",
        sameAs: ["https://www.linkedin.com/in/mmretamozo/"],
      },
      publisher: { "@id": "https://retama.example/#organization" },
      isPartOf: { "@id": "https://retama.example/#website" },
    });
  });

  it("da la fecha de actualización cuando la hay", () => {
    expect(posting({ ...article, updated: new Date("2026-11-02") })).toMatchObject({
      datePublished: "2026-10-23",
      dateModified: "2026-11-02",
    });
  });
});

describe("structuredData de una página de servicio", () => {
  const nodes = (locale: "es" | "en", service?: "custom" | "agents") =>
    structuredData(site, locale, [], false, undefined, service)["@graph"] as Record<string, unknown>[];
  const described = (locale: "es" | "en", service?: "custom" | "agents") =>
    nodes(locale, service).find((node) => node["@type"] === "Service");

  it("describe el servicio que presta Retama, en el idioma de la página y con su propia imagen", () => {
    expect(described("en")).toBeUndefined();
    expect(described("en", "custom")).toMatchObject({
      "@type": "Service",
      "@id": "https://retama.example/en/services/custom-software/#service",
      name: en["services.custom"],
      description: en["service.custom.metaDescription"],
      url: "https://retama.example/en/services/custom-software/",
      image: "https://retama.example/og/en/services/custom-software.png",
      provider: { "@id": "https://retama.example/#organization" },
    });
    expect(described("es", "custom")).toMatchObject({
      name: es["services.custom"],
      url: "https://retama.example/servicios/software-a-medida/",
    });
  });

  it("sirve a la misma zona que Retama", () => {
    const retama = nodes("es", "custom").find((node) => [node["@type"]].flat().includes("OnlineBusiness"));
    expect(described("es", "custom")?.areaServed).toEqual(retama?.areaServed);
  });

  it("da cada oferta de la página con su nombre y su precio mínimo sin IVA", () => {
    expect(described("es", "custom")?.offers).toEqual([
      {
        "@type": "Offer",
        name: es["service.custom.app"],
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: 8000,
          priceCurrency: "EUR",
          valueAddedTaxIncluded: false,
        },
      },
      {
        "@type": "Offer",
        name: es["offers.desktop"],
        priceSpecification: {
          "@type": "PriceSpecification",
          minPrice: 10000,
          priceCurrency: "EUR",
          valueAddedTaxIncluded: false,
        },
      },
    ]);
    const agents = described("en", "agents")?.offers as { priceSpecification: unknown }[];
    expect(agents).toHaveLength(1);
    expect(agents[0]?.priceSpecification).toMatchObject([
      { "@type": "PriceSpecification", minPrice: 4000 },
      { "@type": "UnitPriceSpecification", minPrice: 150, unitCode: "MON" },
    ]);
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
  const text = llmsTxt(site, [
    { locale: "es", title: "Cuánto cuesta", description: "Qué lo encarece.", path: "/blog/cuanto-cuesta/" },
    { locale: "en", title: "What it costs", description: "What drives it.", path: "/en/blog/what-it-costs/" },
  ]);

  it("lista los artículos del blog, primero los de inglés, con su entradilla", () => {
    expect(text).toMatch(/^## Blog$/m);
    const english = text.indexOf("- [What it costs](https://retama.example/en/blog/what-it-costs/): What drives it.");
    const spanish = text.indexOf("- [Cuánto cuesta](https://retama.example/blog/cuanto-cuesta/): Qué lo encarece.");
    expect(english).toBeGreaterThan(-1);
    expect(spanish).toBeGreaterThan(english);
  });

  it("sigue llmstxt.org: título, resumen en cita y secciones de enlaces", () => {
    const lines = text.split("\n");
    expect(lines[0]).toBe("# Retama");
    expect(lines[2]).toBe(`> ${en["meta.description"]}`);
    expect(text).toMatch(/^## Pages$/m);
  });

  it("enlaza cada página indexable en los dos idiomas, con URL absoluta", () => {
    for (const path of ["/", "/en/", "/legal/", "/en/legal/", "/blog/", "/en/blog/"])
      expect(text).toContain(`](${new URL(path, site).href})`);
  });

  it("da el correo de contacto y los servicios, cada uno enlazado a su página en inglés", () => {
    expect(text).toContain("hola@retama.dev");
    expect(text).toContain(
      `- [${en["services.custom"]}](https://retama.example/en/services/custom-software/): ${en["services.customLine"]} ${en["services.customFrom"]}.`,
    );
    for (const key of ["services.web", "services.custom", "services.agents", "services.seo"] as const)
      expect(text).toContain(`- [${en[key]}](`);
  });

  it("enlaza también las páginas de servicio en español", () => {
    expect(text).toContain(
      `- [${es["services.seo"]}](https://retama.example/servicios/seo-y-analitica/): ${en["services.seo"]}, in Spanish.`,
    );
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

  it("marca un artículo como article, con sus fechas", () => {
    const tags = openGraph(site, "en", "/en/blog/a/", "A", "B", {
      headline: "A",
      description: "B",
      published: new Date("2026-10-23"),
      updated: new Date("2026-11-02"),
      path: "/en/blog/a/",
      image: "/og/en/a.png",
    });
    expect(new Map(tags).get("og:type")).toBe("article");
    // Its own image, named after it.
    expect(new Map(tags).get("og:image")).toBe("https://retama.example/og/en/a.png");
    expect(new Map(tags).get("og:image:alt")).toBe(`A, ${en["blog.imageAlt"]}`);
    expect(tags).toContainEqual(["article:published_time", "2026-10-23"]);
    expect(tags).toContainEqual(["article:modified_time", "2026-11-02"]);
    expect(tags.filter(([property]) => property === "og:type")).toHaveLength(1);
  });

  it("usa la imagen propia de la página cuando la tiene, como una página de servicio", () => {
    const image = { path: "/og/servicios/webs-y-cms.png", alt: `${es["services.web"]}, ${es["service.imageAlt"]}` };
    const tags = new Map(openGraph(site, "es", "/servicios/webs-y-cms/", "Webs", "Qué hace.", undefined, image));
    expect(tags.get("og:type")).toBe("website");
    expect(tags.get("og:image")).toBe("https://retama.example/og/servicios/webs-y-cms.png");
    expect(tags.get("og:image:alt")).toBe("Webs y CMS, servicio de Retama");
  });

  it("usa la imagen y el territorio del español en las páginas en español", () => {
    const tags = new Map(openGraph(site, "es", "/", "Retama", "Qué hace."));
    expect(tags.get("og:locale")).toBe("es_ES");
    expect(tags.get("og:locale:alternate")).toBe("en_US");
    expect(tags.get("og:image")).toBe("https://retama.example/og/es.png");
    expect(tags.get("og:image:alt")).toBe(es["og.imageAlt"]);
  });
});
