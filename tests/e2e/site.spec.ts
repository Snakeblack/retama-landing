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

test("el icono existe en ICO y en PNG de 180 px, la cabecera los enlaza y el PNG es el logo de Retama", async ({
  page,
  request,
}) => {
  for (const [path, type] of [
    ["/favicon.ico", /image\/(x-icon|vnd\.microsoft\.icon)/],
    ["/apple-touch-icon.png", /image\/png/],
  ] as const) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()["content-type"], path).toMatch(type);
  }
  await page.goto("/servicios/software-a-medida/");
  await expect(page.locator('link[rel="icon"][href="/favicon.ico"]')).toHaveAttribute("sizes", "32x32");
  await expect(page.locator('link[rel="icon"][href="/favicon.svg"]')).toHaveAttribute("type", "image/svg+xml");
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/apple-touch-icon.png");
  const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
  const retama = graph["@graph"].find((node: { "@id"?: string }) => node["@id"]?.endsWith("#organization"));
  expect(retama.logo).toBe("https://retama.dev/apple-touch-icon.png");
});

test.describe("sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { path, title } of pages) {
    test(`${path} tiene encabezado y texto en el HTML`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      // DESIGN.md Layout: the first chapter says what Retama makes. The title never names it; the lead does, as the
      // one that makes it (owner, 2026-10-30).
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      await expect(page.locator('[data-chapter="hero"] h1')).not.toContainText("Retama");
      await expect(page.locator('[data-chapter="hero"] p').first()).toHaveText(/^Retama /);
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
      // Services, sectors, method, team, questions and contact (DESIGN.md Layout).
      await expect(groups).toHaveCount(6);
      for (const group of await groups.all()) {
        await expect(group.locator("h2")).toHaveCount(1);
        await expect(group.locator("h2")).not.toBeEmpty();
      }

      // The header's chapter links, then the blog's; the footer's legal links lead to another page.
      const links = page.getByRole("banner").getByRole("navigation").getByRole("link");
      await expect(links).toHaveCount(6);
      const hrefs = await links.evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") ?? ""));
      expect(hrefs.filter((href) => href.startsWith("#"))).toHaveLength(5);
      for (const href of hrefs.filter((href) => href.startsWith("#"))) {
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

test("JSON-LD de Retama y del sitio en todas las páginas del sitemap, con miga de pan fuera del inicio", async ({
  page,
  request,
}) => {
  const urls = await sitemapUrls(request);
  for (const url of urls) {
    await page.goto(new URL(url).pathname);
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks, url).toHaveLength(1);
    const graph: Record<string, unknown>[] = JSON.parse(blocks[0] ?? "")["@graph"];
    const types = graph.flatMap((node) => [node["@type"]].flat());
    expect(types, url).toEqual(expect.arrayContaining(["OnlineBusiness", "WebSite"]));
    const retama = graph.find((node) => node["@id"] === new URL("/#organization", url).href);
    expect(retama, url).not.toHaveProperty("address");

    // The breadcrumb climbs from the page to the home of its language, one step per folder that is a page: legal,
    // blog, article; a service page hangs from the home, since its folder is none (owner, 2026-10-30).
    const trail = graph.find((node) => node["@type"] === "BreadcrumbList");
    const home = new URL(new URL(url).pathname.startsWith("/en/") ? "/en/" : "/", url).href;
    if (url !== home) {
      const folders = [url];
      while (folders[0] !== home) folders.unshift(new URL("..", folders[0]).href);
      const expected = folders.filter((folder) => folder === home || urls.includes(folder));
      const steps = trail?.itemListElement as { item: string }[];
      expect(
        steps.map((step) => step.item),
        url,
      ).toEqual(expected);
    } else expect(trail, url).toBeUndefined();
  }
});

test("Open Graph con la imagen de su idioma, o la suya en los artículos y los servicios, en todas las páginas del sitemap", async ({
  page,
  request,
}) => {
  for (const url of await sitemapUrls(request)) {
    await page.goto(new URL(url).pathname);
    const lang = (await page.locator("html").getAttribute("lang")) ?? "";
    const og = async (property: string) => page.locator(`meta[property="${property}"]`).getAttribute("content");
    expect(await og("og:url"), url).toBe(url);
    expect(await og("og:title"), url).toBe(await page.title());
    expect(await og("og:locale"), url).toBe(lang === "es" ? "es_ES" : "en_US");
    expect(await og("og:image:alt"), url).toBeTruthy();
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

    // An article has its own, named after its slug under its language's folder (src/lib/blog.ts, ogImagePath), and a
    // service page its own under og/ at the page's path (src/lib/services.ts, serviceImagePath).
    const image = await og("og:image");
    const { pathname } = new URL(url);
    const slug = pathname.match(/\/blog\/([^/]+)\/$/)?.[1];
    const service = /^(\/en)?\/(servicios|services)\/[^/]+\/$/.test(pathname);
    const own = service ? `/og${pathname.slice(0, -1)}.png` : slug ? `/og/${lang}/${slug}.png` : `/og/${lang}.png`;
    expect(image, url).toBe(new URL(own, url).href);
    const response = await request.get(new URL(image ?? "").pathname);
    expect(response.status(), image ?? "").toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    // The size from the PNG header (IHDR), as the tags declare it.
    const png = await response.body();
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([
      Number(await og("og:image:width")),
      Number(await og("og:image:height")),
    ]);
  }
});

test("los títulos de la portada y del blog nombran el software a medida y a Retama", async ({ page }) => {
  for (const [path, title] of [
    ["/", "Software a medida y aplicaciones web para empresas · Retama"],
    ["/en/", "Custom software and web apps for businesses · Retama"],
    ["/blog/", "Software a medida, explicado · Blog de Retama"],
    ["/en/blog/", "Custom software, explained · Retama blog"],
  ] as const) {
    await page.goto(path);
    await expect(page, path).toHaveTitle(title);
  }
});

test("el sitemap fecha cada página, empareja artículos y servicios con su x-default y fecha el índice con lo último", async ({
  request,
}) => {
  const index = await (await request.get("/sitemap-index.xml")).text();
  const entries = new Map<string, string>();
  for (const [, sitemap] of index.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const body = await (await request.get(new URL(sitemap ?? "").pathname)).text();
    for (const [entry, loc] of body.matchAll(/<url><loc>([^<]+)<\/loc>.*?<\/url>/g)) entries.set(loc ?? "", entry);
  }
  const entry = (path: string) => {
    const url = new URL(path, "https://retama.dev").href;
    expect(entries.has(url), url).toBe(true);
    return entries.get(url) ?? "";
  };
  // Each language has its own slug, so only the article's own data can pair it with its translation (ADR 0008).
  const pair = [
    '<xhtml:link rel="alternate" hreflang="es" href="https://retama.dev/blog/cuanto-cuesta-un-software-a-medida/"/>',
    '<xhtml:link rel="alternate" hreflang="en" href="https://retama.dev/en/blog/what-custom-software-costs/"/>',
  ];
  for (const path of ["/blog/cuanto-cuesta-un-software-a-medida/", "/en/blog/what-custom-software-costs/"]) {
    expect(entry(path), path).toMatch(/<lastmod>2026-10-30/);
    for (const link of pair) expect(entry(path), path).toContain(link);
  }
  for (const path of ["/blog/", "/en/blog/"]) expect(entry(path), path).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}/);
  // A service page too, with the date kept by hand in its data (owner, 2026-10-30).
  const service = [
    '<xhtml:link rel="alternate" hreflang="es" href="https://retama.dev/servicios/software-a-medida/"/>',
    '<xhtml:link rel="alternate" hreflang="en" href="https://retama.dev/en/services/custom-software/"/>',
    '<xhtml:link rel="alternate" hreflang="x-default" href="https://retama.dev/servicios/software-a-medida/"/>',
  ];
  for (const path of ["/servicios/software-a-medida/", "/en/services/custom-software/"]) {
    expect(entry(path), path).toMatch(/<lastmod>2026-10-30/);
    for (const link of service) expect(entry(path), path).toContain(link);
  }
  // Every page has its date, never the build's, and every translated page its x-default, as in the HTML (ADR 0008).
  const dates: string[] = [];
  for (const [url, item] of entries) {
    const date = item.match(/<lastmod>(\d{4}-\d{2}-\d{2})/)?.[1];
    expect(date, url).toBeDefined();
    dates.push(date ?? "");
    if (item.includes("hreflang=")) expect(item, url).toContain('hreflang="x-default"');
  }
  expect(entry("/en/legal/"), "/en/legal/").toContain(
    '<xhtml:link rel="alternate" hreflang="x-default" href="https://retama.dev/legal/"/>',
  );
  // The index dates its file with the newest page in it.
  expect(index).toContain(`<lastmod>${dates.sort().at(-1)}`);
});

// The other tests tie the canonicals, hreflang, robots.txt and llms.txt to the sitemap's URLs.
test("el sitemap nombra el dominio de producción, https://retama.dev", async ({ request }) => {
  const urls = await sitemapUrls(request);
  expect(urls.length).toBeGreaterThanOrEqual(pages.length);
  for (const url of urls) expect(new URL(url).origin).toBe("https://retama.dev");
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
    await expect(page.locator('meta[property^="og:"]')).toHaveCount(0);
  }
});
