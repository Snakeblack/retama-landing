import { readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";

// The articles of a language, one Markdown file each, so a new article needs no change here.
const articleCount = (lang: string) =>
  readdirSync(`src/content/blog/${lang}`).filter((file) => file.endsWith(".md")).length;

const blogs = [
  {
    lang: "es",
    home: "/",
    index: "/blog/",
    title: "El software, explicado",
    article: "/blog/cuanto-cuesta-un-software-a-medida/",
    headline: "Cuánto cuesta un software a medida",
    other: "/en/blog/what-custom-software-costs/",
    all: "Todos los artículos",
    talk: "Hablemos",
    contact: "/#contacto",
    byline: "Escrito por",
    team: "/#nosotros",
  },
  {
    lang: "en",
    home: "/en/",
    index: "/en/blog/",
    title: "Software, in plain English",
    article: "/en/blog/what-custom-software-costs/",
    headline: "What custom software costs",
    other: "/blog/cuanto-cuesta-un-software-a-medida/",
    all: "All articles",
    talk: "Let's talk",
    contact: "/en/#contact",
    byline: "Written by",
    team: "/en/#about-us",
  },
];

test.describe("blog sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { lang, index, title, article, headline, all, byline, team } of blogs) {
    test(`${index} lista los artículos de su idioma, del más reciente al más antiguo`, async ({ page }) => {
      const response = await page.goto(index);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      const links = page.getByRole("main").getByRole("listitem").getByRole("link");
      await expect(links).toHaveCount(articleCount(lang));
      for (const href of await links.evaluateAll((all) => all.map((a) => a.getAttribute("href"))))
        expect(href?.startsWith(index)).toBe(true);
      await expect(page.getByRole("link", { name: headline })).toHaveAttribute("href", article);
      // Each one gives its date in the page's language, machine-readable too.
      await expect(page.getByRole("main").locator("time").first()).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}$/);
    });

    test(`${article} tiene su título, su firma, sus fechas y su cuerpo en el HTML`, async ({ page }) => {
      const response = await page.goto(article);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1, name: headline })).toBeVisible();
      await expect(page.locator("[data-article] h2").first()).toBeVisible();
      await expect(page.locator("[data-article] li").first()).toBeVisible();
      // Signed by Manuel M. (owner, 2026-10-26), first of the facts beside the title.
      await expect(page.locator("dl dt").first()).toHaveText(byline);
      await expect(page.locator("dl dd").first()).toHaveText("Manuel M.");
      // The signature leads to the team chapter, where his card is (owner, 2026-10-30).
      await expect(page.locator("dl dd").first().getByRole("link", { name: "Manuel M." })).toHaveAttribute(
        "href",
        team,
      );
      // Published, then updated when its warranty and its floor price followed proposal 1.4 and, last, when it linked
      // its service's page (2026-10-30).
      await expect(page.locator("dl time")).toHaveCount(2);
      await expect(page.locator("dl time").first()).toHaveAttribute("datetime", "2026-10-23");
      await expect(page.locator("dl time").last()).toHaveAttribute("datetime", "2026-10-30");
      await expect(page.getByRole("link", { name: all })).toHaveAttribute("href", index);
      // No code in an article (DESIGN.md: no monospace outside the first chapter).
      await expect(page.locator("[data-article] code, [data-article] pre")).toHaveCount(0);
    });
  }
});

for (const { lang, home, index, article, other, talk, contact, team } of blogs) {
  test(`${article} cambia de idioma al mismo artículo traducido`, async ({ page }) => {
    await page.goto(article);
    const switcher = page.locator("a.lang-switch");
    await expect(switcher).toHaveAttribute("href", other);
    await switcher.click();
    await expect(page).toHaveURL(new RegExp(`${other}$`));
    await expect(page.locator("html")).not.toHaveAttribute("lang", lang);
    await expect(page.locator("a.lang-switch")).toHaveAttribute("href", article);
  });

  test(`${article} lleva al contacto de la portada`, async ({ page }) => {
    await page.goto(article);
    await expect(page.getByRole("complementary").getByRole("link", { name: talk })).toHaveAttribute("href", contact);
  });

  test(`${article} se describe como BlogPosting de Retama, firmado por Manuel M.`, async ({ page }) => {
    await page.goto(article);
    const canonical = (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? "";
    const graph: Record<string, unknown>[] = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent()) ?? "",
    )["@graph"];
    const posting = graph.find((node) => node["@type"] === "BlogPosting");
    expect(posting).toMatchObject({
      headline: await page.locator("h1").textContent(),
      inLanguage: lang,
      datePublished: "2026-10-23",
      // Absolute on the production origin, like the canonical: the author leads to the team chapter.
      // and his public profile names him (owner, 2026-10-30).
      author: {
        "@type": "Person",
        name: "Manuel M.",
        url: new URL(team, canonical).href,
        sameAs: ["https://www.linkedin.com/in/mmretamozo/"],
      },
      publisher: { "@id": new URL("/#organization", canonical).href },
    });
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "article");
  });

  test(`el blog se enlaza desde la cabecera y el pie de ${home}, de la legal y de los artículos`, async ({ page }) => {
    for (const from of [home, `${home}legal/`, article]) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(from);
      await expect(page.getByRole("banner").getByRole("link", { name: "Blog" })).toHaveAttribute("href", index);
      await expect(page.getByRole("contentinfo").getByRole("link", { name: "Blog" })).toHaveAttribute("href", index);
    }
    await page.goto(index);
    await expect(page.getByRole("banner").getByRole("link", { name: "Blog" })).toHaveAttribute("aria-current", "page");
  });

  test(`en el móvil, el blog está en la barra de sus páginas y en el índice de capítulos de ${home}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(article);
    await expect(page.getByRole("banner").getByRole("link", { name: "Blog" })).toBeVisible();

    await page.goto(home);
    await page.getByRole("button", { name: lang === "es" ? "Índice" : "Contents" }).click();
    const entry = page.getByRole("dialog").getByRole("link", { name: /^Blog/ });
    await expect(entry).toHaveAttribute("href", index);
    await entry.click();
    await expect(page).toHaveURL(new RegExp(`${index}$`));
  });
}

for (const { lang, index, article, headline } of blogs) {
  const feed = `${index}rss.xml`;

  test(`${feed} da los artículos de su idioma con su resumen y su enlace`, async ({ request, baseURL }) => {
    const response = await request.get(feed);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("xml");
    const xml = await response.text();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain(`<language>${lang}</language>`);
    expect(xml).toMatch(new RegExp(`<atom:link href="[^"]+${feed}" rel="self"`));
    expect(xml.match(/<item>/g)).toHaveLength(articleCount(lang));
    const origin = xml.match(/<link>(https?:\/\/[^/]+)\//)?.[1] ?? baseURL;
    expect(xml).toContain(`<title>${headline}</title>`);
    expect(xml).toContain(`<link>${origin}${article}</link>`);
    // A summary, not the text: no article body in the feed.
    expect(xml).not.toContain("<content:encoded>");
  });

  test(`el índice y los artículos de ${index} anuncian su RSS, y el índice da su dirección sin enlazar el XML`, async ({
    page,
  }) => {
    for (const path of [index, article]) {
      await page.goto(path);
      await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute("href", feed);
    }
    await page.goto(index.replace("blog/", ""));
    await expect(page.locator('link[type="application/rss+xml"]')).toHaveCount(0);

    // A browser shows the feed as raw XML, so the index explains it and gives the address for a reader instead.
    await page.goto(index);
    await expect(page.locator(`a[href$="rss.xml"]`)).toHaveCount(0);
    const canonical = (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? "";
    const address = page.getByRole("main").locator("[data-feed-address]");
    await expect(address).toHaveText(new URL(feed, canonical).href);
    await expect(address).toBeVisible();
  });

  test(`en el móvil, la dirección del RSS de ${index} se selecciona entera de un toque`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(index);
    const address = page.locator("[data-feed-address]");
    // The board's text is not selectable on touch screens (global.css); the address is, as a whole.
    expect(await address.evaluate((node) => getComputedStyle(node).userSelect)).toBe("all");
    await expect(address).toBeInViewport();
  });

  test(`${article} declara su propia imagen Open Graph, con su título en el texto alternativo`, async ({
    page,
    request,
  }) => {
    await page.goto(article);
    const image = (await page.locator('meta[property="og:image"]').getAttribute("content")) ?? "";
    const slug = article.split("/").filter(Boolean).pop();
    expect(new URL(image).pathname).toBe(`/og/${lang}/${slug}.png`);
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      "content",
      new RegExp(`^${headline}, `),
    );
    const response = await request.get(new URL(image).pathname);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  });
}

test.describe("artículos en pantallas táctiles", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const { article } of blogs) {
    test(`${article} deja seleccionar y copiar su texto, aunque el tablero no lo deje`, async ({ page }) => {
      await page.goto(article);
      // global.css turns selection off in main on touch screens; an article is read and quoted, so it opts back in.
      for (const selector of ["h1", "header p", "[data-article] p", "[data-article] li"])
        expect(
          await page
            .locator(selector)
            .first()
            .evaluate((node) => getComputedStyle(node).userSelect),
          selector,
        ).not.toBe("none");
      await page.goto(article.startsWith("/en/") ? "/en/" : "/");
      expect(await page.locator("main h1").evaluate((node) => getComputedStyle(node).userSelect)).toBe("none");
    });
  }
});

// The blog's price tables (owner, 2026-10-30 and 2026-10-31), each with its rows.
const tables = [
  { article: "/blog/cuanto-cuesta-un-software-a-medida/", rows: 4 },
  { article: "/en/blog/what-custom-software-costs/", rows: 4 },
  { article: "/blog/cuanto-cuesta-un-agente-de-ia/", rows: 3 },
  { article: "/en/blog/what-an-ai-agent-costs/", rows: 3 },
  { article: "/blog/cuanto-cuesta-el-seo-de-una-web/", rows: 4 },
  { article: "/en/blog/what-website-seo-costs/", rows: 4 },
];

for (const { article, rows } of tables)
  test(`la tabla de precios de ${article} cabe en su tesela a ancho de móvil (DESIGN.md)`, async ({ page }) => {
    for (const width of [320, 360, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(article);
      await page.evaluate(() => document.fonts.ready);
      const table = page.locator("[data-article] table");
      await expect(table.locator("tbody tr")).toHaveCount(rows);
      const { right, tile } = await table.evaluate((node) => ({
        right: node.getBoundingClientRect().right,
        tile: (node.parentElement as HTMLElement).getBoundingClientRect().right,
      }));
      expect(right, `${article} a ${width}px`).toBeLessThanOrEqual(tile);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${article} a ${width}px`).toBe(width);
    }
  });
