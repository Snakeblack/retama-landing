import { expect, type Page, test } from "@playwright/test";

const languages = [
  {
    lang: "es",
    home: "/",
    chapter: "Lo que construimos",
    headings: ["Qué incluye", "Cuándo encaja", "Cómo empieza", "Lo primero que decidiríamos", "Otros servicios"],
    blog: "Del blog",
    others: "Otros servicios",
    example: "Ejemplo",
    talk: "Hablemos",
    contact: "#contacto",
    footer: "Servicios",
    pages: [
      {
        path: "/servicios/webs-y-cms/",
        other: "/en/services/websites-and-cms/",
        h1: "Diseño web y CMS para empresas",
        type: "web",
        articles: ["/blog/seguridad-web-actualizar-sin-romper/"],
      },
      {
        path: "/servicios/software-a-medida/",
        other: "/en/services/custom-software/",
        h1: "Desarrollo de software a medida",
        type: "software",
        articles: ["/blog/cuanto-cuesta-un-software-a-medida/", "/blog/por-que-escribimos-cada-decision/"],
      },
      {
        path: "/servicios/agentes-y-automatizaciones/",
        other: "/en/services/agents-and-automation/",
        h1: "Agentes de IA y automatizaciones",
        type: "agents",
      },
      {
        path: "/servicios/seo-y-analitica/",
        other: "/en/services/seo-and-analytics/",
        h1: "SEO técnico y analítica",
        type: "seo",
      },
    ],
  },
  {
    lang: "en",
    home: "/en/",
    chapter: "What we build",
    headings: ["What it includes", "When it fits", "How it starts", "What we would decide first", "Other services"],
    blog: "From the blog",
    others: "Other services",
    example: "Example",
    talk: "Let's talk",
    contact: "#contact",
    footer: "Services",
    pages: [
      {
        path: "/en/services/websites-and-cms/",
        other: "/servicios/webs-y-cms/",
        h1: "Web design and CMS",
        type: "web",
        articles: ["/en/blog/web-security-updating-without-breaking/"],
      },
      {
        path: "/en/services/custom-software/",
        other: "/servicios/software-a-medida/",
        h1: "Custom software development",
        type: "software",
        articles: ["/en/blog/what-custom-software-costs/", "/en/blog/why-we-write-every-decision-down/"],
      },
      {
        path: "/en/services/agents-and-automation/",
        other: "/servicios/agentes-y-automatizaciones/",
        h1: "AI agents and automation",
        type: "agents",
      },
      {
        path: "/en/services/seo-and-analytics/",
        other: "/servicios/seo-y-analitica/",
        h1: "Technical SEO and analytics",
        type: "seo",
      },
    ],
  },
];

/** The meta description of the page. */
const description = (page: Page) => page.locator('meta[name="description"]').getAttribute("content");

test.describe("páginas de servicio sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { lang, home, headings, blog, others, example, talk, contact, pages } of languages)
    for (const { path, h1, type, articles = [] } of pages)
      test(`${path} tiene su título, sus precios, sus apartados, sus decisiones y la vuelta al contacto en el HTML`, async ({
        page,
      }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.locator("html")).toHaveAttribute("lang", lang);
        await expect(page.getByRole("heading", { level: 1 })).toHaveText(h1);
        // A service the blog writes about lists its articles before the other services (owner, 2026-10-30).
        await expect(page.getByRole("heading", { level: 2 })).toHaveText(
          articles.length > 0 ? [...headings.slice(0, -1), blog, others] : headings,
        );
        // The starting price excluding VAT, with its lead time or its monthly fee.
        await expect(
          page
            .locator("main")
            .getByText(/\d( €)? \+ (IVA|VAT)/)
            .first(),
        ).toBeVisible();
        // The action leads to the home's form with this service chosen (owner, 2026-10-30).
        await expect(page.locator("main").getByRole("link", { name: talk, exact: true })).toHaveAttribute(
          "href",
          `${home}?projectType=${type}${contact}`,
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

for (const { blog, pages } of languages)
  for (const { path, articles = [] } of pages.filter((item) => item.articles))
    test(`${path} enlaza sus artículos del blog, y cada uno la enlaza a ella en su texto`, async ({ page }) => {
      await page.goto(path);
      const row = page.getByRole("region", { name: blog });
      const links = await row.getByRole("link").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href")));
      expect(links.toSorted()).toEqual(articles.toSorted());
      await expect(row.getByRole("heading", { level: 3 })).toHaveCount(articles.length);
      for (const article of articles) {
        await page.goto(article);
        await expect(page.locator(`[data-article] a[href="${path}"]`)).toHaveCount(1);
      }
    });

for (const { home, talk, contact, pages } of languages)
  test(`Hablemos de cada página de servicio en ${home} abre el formulario con su servicio marcado`, async ({
    page,
  }) => {
    for (const { path, type } of pages) {
      await page.goto(path);
      await page.locator("main").getByRole("link", { name: talk, exact: true }).click();
      await expect(page).toHaveURL(`${home}?projectType=${type}${contact}`);
      await expect(page.locator(`input[name="projectType"][value="${type}"]`), path).toBeChecked();
      await expect(page.locator('input[name="projectType"]:checked'), path).toHaveCount(1);
    }
  });

test("el formulario no marca nada con un tipo desconocido y respeta la elección que el navegador recupera", async ({
  page,
}) => {
  await page.goto("/?projectType=Software#contacto");
  await expect(page.locator("[data-contact] button[type=submit]")).toBeEnabled();
  await expect(page.locator('input[name="projectType"]:checked')).toHaveCount(0);

  // Going back, the browser brings back the visitor's choice, and the type in the address does not take its place.
  await page.goto("/?projectType=seo#contacto");
  await expect(page.locator('input[name="projectType"][value="seo"]')).toBeChecked();
  await page.locator('label:has(input[name="projectType"][value="web"])').click();
  await page.goto("/legal/");
  await page.goBack();
  await expect(page.locator("[data-contact] button[type=submit]")).toBeEnabled();
  await expect(page.locator('input[name="projectType"][value="web"]')).toBeChecked();
  await expect(page.locator('input[name="projectType"]:checked')).toHaveCount(1);
});
