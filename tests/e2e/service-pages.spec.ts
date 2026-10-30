import { expect, type Page, test } from "@playwright/test";

const languages = [
  {
    lang: "es",
    home: "/",
    chapter: "Lo que construimos",
    headings: ["Qué incluye", "Cuándo encaja", "Cómo empieza", "Lo primero que decidiríamos", "Otros servicios"],
    others: "Otros servicios",
    example: "Ejemplo",
    talk: "Hablemos",
    contact: "/#contacto",
    footer: "Servicios",
    pages: [
      { path: "/servicios/webs-y-cms/", other: "/en/services/websites-and-cms/", h1: "Diseño web y CMS para empresas" },
      {
        path: "/servicios/software-a-medida/",
        other: "/en/services/custom-software/",
        h1: "Desarrollo de software a medida",
      },
      {
        path: "/servicios/agentes-y-automatizaciones/",
        other: "/en/services/agents-and-automation/",
        h1: "Agentes de IA y automatizaciones",
      },
      { path: "/servicios/seo-y-analitica/", other: "/en/services/seo-and-analytics/", h1: "SEO técnico y analítica" },
    ],
  },
  {
    lang: "en",
    home: "/en/",
    chapter: "What we build",
    headings: ["What it includes", "When it fits", "How it starts", "What we would decide first", "Other services"],
    others: "Other services",
    example: "Example",
    talk: "Let's talk",
    contact: "/en/#contact",
    footer: "Services",
    pages: [
      {
        path: "/en/services/websites-and-cms/",
        other: "/servicios/webs-y-cms/",
        h1: "Web design and CMS",
      },
      {
        path: "/en/services/custom-software/",
        other: "/servicios/software-a-medida/",
        h1: "Custom software development",
      },
      {
        path: "/en/services/agents-and-automation/",
        other: "/servicios/agentes-y-automatizaciones/",
        h1: "AI agents and automation",
      },
      {
        path: "/en/services/seo-and-analytics/",
        other: "/servicios/seo-y-analitica/",
        h1: "Technical SEO and analytics",
      },
    ],
  },
];

/** The meta description of the page. */
const description = (page: Page) => page.locator('meta[name="description"]').getAttribute("content");

test.describe("páginas de servicio sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { lang, home, headings, others, example, talk, contact, pages } of languages)
    for (const { path, h1 } of pages)
      test(`${path} tiene su título, sus precios, sus apartados, sus decisiones y la vuelta al contacto en el HTML`, async ({
        page,
      }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
        await expect(page.getByRole("heading", { level: 2 })).toHaveText(headings);
        // The starting price excluding VAT, with its lead time or its monthly fee.
        await expect(
          page
            .locator("main")
            .getByText(/\d( €)? \+ (IVA|VAT)/)
            .first(),
        ).toBeVisible();
        await expect(page.locator("main").getByRole("link", { name: talk, exact: true })).toHaveAttribute(
          "href",
          contact,
        );
        await expect(page.locator("figure[data-ui]").first()).toContainText(example);
        await expect(page.getByRole("navigation", { name: others }).getByRole("link")).toHaveCount(3);
        await expect(page.locator("main svg").first()).toHaveAttribute("aria-hidden", "true");

        // Its own title and description, apart from the home's (owner, 2026-10-30).
        const own = { title: await page.title(), description: await description(page) };
        await page.goto(home);
        expect(own.title).not.toBe(await page.title());
        expect(own.description).not.toBe(await description(page));
      });
});

for (const { pages } of languages)
  for (const { path, other } of pages)
    test(`${path} cambia de idioma a la misma página de servicio`, async ({ page }) => {
      await page.goto(path);
      await page.locator("header .lang-switch").click();
      await expect(page).toHaveURL(other);
    });

test("el título de una página de servicio nunca pasa de dos líneas (DESIGN.md)", async ({ page }) => {
  for (const width of [360, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const { pages } of languages)
      for (const { path } of pages) {
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const lines = await page
          .getByRole("heading", { level: 1 })
          .evaluate((h1) =>
            Math.round(h1.getBoundingClientRect().height / Number.parseFloat(getComputedStyle(h1).lineHeight)),
          );
        expect(lines, `${path} a ${width}px`).toBeLessThanOrEqual(2);
      }
  }
});

for (const { home, chapter, pages } of languages)
  test(`cada tarjeta de Servicios de ${home} lleva a su página, se pulse donde se pulse`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const [index, { path }] of pages.entries()) {
      await page.goto(home);
      const card = page.getByRole("region", { name: chapter }).getByRole("listitem").nth(index);
      await expect(card.getByRole("link")).toHaveAttribute("href", path);
      // The foot of the card, on its plant, far from the name.
      const box = await card.boundingBox();
      await card.click({ position: { x: 24, y: (box?.height ?? 0) - 24 } });
      await expect(page).toHaveURL(path);
    }
  });

for (const { home, footer, pages } of languages)
  test(`el pie de ${home}, de la legal, del blog y de una página de servicio enlaza los cuatro servicios`, async ({
    page,
  }) => {
    const legal = `${home}legal/`;
    for (const path of [home, legal, `${home}blog/`, pages[0]?.path ?? home]) {
      await page.goto(path);
      const links = page.locator("footer").getByRole("navigation", { name: footer }).getByRole("link");
      await expect(links, path).toHaveCount(4);
      expect(await links.evaluateAll((items) => items.map((item) => item.getAttribute("href"))), path).toEqual(
        pages.map(({ path: service }) => service),
      );
    }
  });

test("la carpeta de los servicios sola no es una página: da la 404 de su idioma", async ({ page }) => {
  for (const [path, lang] of [
    ["/servicios/", "es"],
    ["/en/services/", "en"],
  ] as const) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
  }
});
