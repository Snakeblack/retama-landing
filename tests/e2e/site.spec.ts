import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", lang: "es", other: "/en/", title: "Software a medida" },
  { path: "/en/", lang: "en", other: "/", title: "Software made to measure" },
];

async function sitemapUrls(request: import("@playwright/test").APIRequestContext): Promise<string[]> {
  const index = await (await request.get("/sitemap-index.xml")).text();
  const urls: string[] = [];
  for (const [, sitemap] of index.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const body = await (await request.get(new URL(sitemap ?? "").pathname)).text();
    for (const [, loc] of body.matchAll(/<url><loc>([^<]+)<\/loc>/g)) urls.push(loc ?? "");
  }
  return urls;
}

for (const { path, lang, other } of pages) {
  test(`${path} sirve su idioma y enlaza la página equivalente`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    // The header's switch; the chapter index of phones holds a copy of it.
    await expect(page.locator(`a.lang-switch[hreflang][href="${other}"]`)).toBeVisible();
  });
}

for (const { path } of pages) {
  test(`${path} muestra el wordmark y carga Stack Sans desde el propio sitio (DESIGN.md)`, async ({
    page,
    baseURL,
  }) => {
    const fontOrigins: string[] = [];
    page.on("request", (request) => {
      if (request.resourceType() === "font") fontOrigins.push(new URL(request.url()).origin);
    });
    await page.goto(path);

    const home = page.getByRole("banner").getByRole("link", { name: "Retama" });
    await expect(home).toBeVisible();
    await expect(home.locator("svg")).toBeVisible();

    const loaded = await page.evaluate(async () => {
      await document.fonts.ready;
      return [...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family);
    });
    expect(loaded.some((family) => family.startsWith("Stack Sans Headline"))).toBe(true);
    expect(loaded.some((family) => family.startsWith("Stack Sans Text"))).toBe(true);
    expect(fontOrigins.length).toBeGreaterThan(0);
    expect(new Set(fontOrigins)).toEqual(new Set([new URL(baseURL ?? "").origin]));
  });
}

test.describe("sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { path, title } of pages) {
    test(`${path} tiene encabezado y texto en el HTML`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      // DESIGN.md Layout: the first chapter says what Retama makes; "Retama" is only the wordmark.
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.locator('[data-chapter="hero"]')).not.toContainText("Retama");
      await expect(page.locator("main p").first()).not.toBeEmpty();
    });

    // scenario:perf-mobile: every module script of the head is a round trip before the first paint for Lighthouse.
    test(`${path} carga sus islas en un único script de módulo`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('script[type="module"][src]')).toHaveCount(1);
    });

    test(`${path} lleva a contacto desde la acción fija de la cabecera`, async ({ page }) => {
      await page.goto(path);
      // It may be faded out over the first chapter, but it is always in the header.
      const talk = page.locator("header a[data-talk]");
      await expect(talk).toHaveCount(1);
      await expect(page.locator(`main ${await talk.getAttribute("href")}`)).toHaveCount(1);
    });

    test(`${path} trae el tablero completo: grupos, fragmentos, imágenes acreditadas y contacto (DESIGN.md)`, async ({
      page,
    }) => {
      await page.goto(path);

      const groups = page.locator("main section[id]");
      await expect(groups).toHaveCount(4);
      for (const group of await groups.all()) {
        await expect(group.locator("h2")).toHaveCount(1);
        await expect(group.locator("h2")).not.toBeEmpty();
      }

      // The header's chapter links; the footer's legal links lead to another page.
      const links = page.getByRole("banner").getByRole("navigation").getByRole("link");
      await expect(links).toHaveCount(3);
      for (const href of await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")))) {
        await expect(page.locator(`main ${href}`)).toHaveCount(1);
      }

      // DESIGN.md Imagery: the retama only as a signature, interface fragments for the rest, examples labelled.
      await expect(page.locator("main [data-ui]")).toHaveCount(8);
      for (const label of await page.locator("main [data-ui] [data-example]").all())
        await expect(label).not.toBeEmpty();
      await expect(page.locator("main [data-ui] [data-example]")).toHaveCount(8);
      const pictures = page.locator("main picture img");
      for (const alt of await pictures.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("alt")))) {
        expect(alt?.trim()).toBeTruthy();
      }
      const credits = page.locator('footer a[href^="https://commons.wikimedia.org/wiki/File:"]');
      expect(await credits.count()).toBe(await pictures.count());

      const contact = page.locator(`main [data-contact-direct] a[href^="mailto:"]`);
      await expect(contact).toHaveCount(1);
      const address = (await contact.getAttribute("href"))?.replace("mailto:", "");
      await expect(contact).toHaveText(address ?? "");
      const action = page.locator("main a.bg-primary");
      await expect(action).toHaveCount(1);
      await expect(page.locator(`main ${await action.getAttribute("href")}`)).toContainText(address ?? "");
    });

    test(`${path} cambia de tipo de proyecto sin JavaScript, de uno en uno`, async ({ page }) => {
      await page.goto(path);
      const projects = page.locator(`main details[name="project"]`);
      await expect(projects).toHaveCount(4);
      await expect(projects.first()).toHaveAttribute("open", "");
      await expect(projects.first().locator("ol > li")).toHaveCount(3);

      await projects.nth(2).locator("summary").click();
      await expect(projects.nth(2)).toHaveAttribute("open", "");
      await expect(projects.nth(2).locator("ol > li").first()).toBeVisible();
      await expect(projects.first()).not.toHaveAttribute("open");
    });
  }
});

test("hreflang recíproco con x-default en todas las páginas del sitemap (ADR 0008)", async ({ page, request }) => {
  const urls = await sitemapUrls(request);
  expect(urls.length).toBeGreaterThanOrEqual(pages.length);

  const declared = new Map<string, string[]>();
  for (const url of urls) {
    await page.goto(new URL(url).pathname);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toBe(url);
    const links = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((nodes) => nodes.map((node) => `${node.getAttribute("hreflang")} ${node.getAttribute("href")}`));
    expect(links.some((link) => link.startsWith("x-default "))).toBe(true);
    declared.set(url, links.sort());
  }

  for (const [url, links] of declared) {
    for (const link of links) {
      const target = link.split(" ")[1] ?? "";
      expect(declared.get(target), `${url} → ${target}`).toEqual(links);
    }
  }
});

test("JSON-LD de Retama y del sitio en todas las páginas del sitemap, con miga de pan en las legales", async ({
  page,
  request,
}) => {
  for (const url of await sitemapUrls(request)) {
    await page.goto(new URL(url).pathname);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks, url).toHaveLength(1);
    const graph: Record<string, unknown>[] = JSON.parse(blocks[0] ?? "")["@graph"];
    const types = graph.flatMap((node) => [node["@type"]].flat());
    expect(types, url).toEqual(expect.arrayContaining(["Organization", "ProfessionalService", "WebSite"]));
    const retama = graph.find((node) => node["@id"] === new URL("/#organization", url).href);
    expect(retama, url).not.toHaveProperty("address");

    const trail = graph.find((node) => node["@type"] === "BreadcrumbList");
    if (new URL(url).pathname.endsWith("/legal/")) {
      const steps = trail?.itemListElement as { item: string }[];
      expect(
        steps.map((step) => step.item),
        url,
      ).toEqual([new URL("..", url).href, url]);
    } else expect(trail, url).toBeUndefined();
  }
});

test("robots.txt admite a todos los rastreadores y llms.txt enlaza las páginas del sitemap", async ({ request }) => {
  const urls = await sitemapUrls(request);

  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  const rules = await robots.text();
  expect(rules).toMatch(/^User-agent: \*\nAllow: \/$/m);
  expect(rules).toContain(`Sitemap: ${new URL("/sitemap-index.xml", urls[0]).href}`);

  const llms = await request.get("/llms.txt");
  expect(llms.status()).toBe(200);
  expect(llms.headers()["content-type"]).toContain("text/plain");
  const text = await llms.text();
  expect(text.startsWith("# Retama\n")).toBe(true);
  for (const url of urls) expect(text).toContain(`](${url})`);
});

test("las rutas desconocidas devuelven la 404 de su idioma", async ({ page }) => {
  for (const { path, lang } of pages) {
    const response = await page.goto(`${path}no-existe/`);
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
  }
});
