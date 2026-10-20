import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", lang: "es", other: "/en/" },
  { path: "/en/", lang: "en", other: "/" },
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
    await expect(page.locator(`a[hreflang][href="${other}"]`)).toBeVisible();
  });
}

test.describe("sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { path } of pages) {
    test(`${path} tiene encabezado y texto en el HTML`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).not.toBeEmpty();
      await expect(page.locator("main p").first()).not.toBeEmpty();
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

test("las rutas desconocidas devuelven la 404 de su idioma", async ({ page }) => {
  for (const { path, lang } of pages) {
    const response = await page.goto(`${path}no-existe/`);
    expect(response?.status()).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
  }
});
