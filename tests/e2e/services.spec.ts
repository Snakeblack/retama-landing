import { expect, type Locator, type Page, test } from "@playwright/test";

const pages = [
  {
    path: "/",
    title: "Lo que construimos",
    method: "Cómo trabajamos",
    services: ["Webs y CMS", "Software a medida", "Agentes y automatizaciones", "SEO y analítica"],
    contact: "Hablemos",
  },
  {
    path: "/en/",
    title: "What we build",
    method: "How we work",
    services: ["Websites and CMS", "Custom software", "Agents and automation", "SEO and analytics"],
    contact: "Let's talk",
  },
];

/** The dot screens on show, card by card: the viewBox each frames and the size of the plant drawn in it. */
const screens = (page: Page, title: string) =>
  page
    .getByRole("region", { name: title })
    .getByRole("listitem")
    .evaluateAll((cards) =>
      cards.map((card) => {
        const svg = [...card.querySelectorAll<SVGSVGElement>("svg[data-dots]")].find(
          (node) => node.getBoundingClientRect().width > 0,
        );
        const box = svg?.querySelector("use")?.getBBox();
        return { viewBox: svg?.getAttribute("viewBox") ?? "", drawn: (box?.width ?? 0) * (box?.height ?? 0) };
      }),
    );

test.describe("el capítulo Servicios (DESIGN.md Layout e Imagery)", () => {
  test.describe("sin JavaScript (ADR 0001)", () => {
    test.use({ javaScriptEnabled: false });

    for (const { path, title, services } of pages) {
      test(`${path} muestra cuatro tarjetas, cada una con su nombre, su frase y su trama de la retama`, async ({
        page,
      }) => {
        await page.goto(path);
        const chapter = page.getByRole("region", { name: title });
        await expect(chapter.getByRole("heading", { level: 2, name: title })).toBeVisible();
        const cards = chapter.getByRole("listitem");
        await expect(cards).toHaveCount(4);
        await expect(chapter.getByRole("heading", { level: 3 })).toHaveText(services);
        for (const card of await cards.all()) await expect(card.locator("p")).not.toBeEmpty();

        const drawn = await screens(page, title);
        expect(drawn.every(({ drawn }) => drawn > 0)).toBe(true);
        // The dots are a picture with nothing to read.
        await expect(chapter.locator("svg[data-dots]").first()).toHaveAttribute("aria-hidden", "true");
      });
    }
  });

  test("en escritorio las cuatro tarjetas van en fila y cada una enmarca su parte de la planta", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const tops = await page
      .getByRole("region", { name: "Lo que construimos" })
      .getByRole("listitem")
      .evaluateAll((cards) => cards.map((card) => card.getBoundingClientRect().top));
    expect(new Set(tops).size).toBe(1);
    const views = (await screens(page, "Lo que construimos")).map(({ viewBox }) => viewBox);
    expect(new Set(views).size).toBe(4);
  });

  test("en el móvil una sola planta baja por las cuatro: cada tarjeta sigue donde acaba la anterior", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const views = (await screens(page, "Lo que construimos")).map(({ viewBox }) => viewBox.split(" ").map(Number));
    expect(views).toHaveLength(4);
    for (let index = 1; index < views.length; index++) {
      const [x, y, width] = views[index] ?? [];
      const [previousX, previousY, previousWidth, previousHeight] = views[index - 1] ?? [];
      expect([x, width]).toEqual([previousX, previousWidth]);
      expect(y).toBe((previousY ?? 0) + (previousHeight ?? 0));
    }
  });

  test("la trama se dibuja de arriba abajo mientras la tarjeta cruza la pantalla, no de golpe", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const dots = page.locator("svg[data-dots]:visible").first();
    // Halfway through its range the dots are cut partway from the bottom, not either all there or all gone.
    await dots.evaluate((svg) => scrollTo(0, svg.getBoundingClientRect().top + scrollY - innerHeight * 0.6));
    await expect
      .poll(() => dots.evaluate((svg) => getComputedStyle(svg).clipPath))
      .toMatch(/^inset\(0px 0px (?:[1-9]\d?(?:\.\d+)?)%\)$/);
  });

  test("con movimiento reducido la trama ya está dibujada", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const clips = await page
      .locator("svg[data-dots]")
      .evaluateAll((screens) => screens.map((svg) => getComputedStyle(svg).clipPath));
    expect(clips.every((clip) => clip === "none")).toBe(true);
  });

  for (const { path, method, contact } of pages) {
    test(`${path} cuenta el método sin jerga, con la cifra del interlocutor`, async ({ page }) => {
      await page.goto(path);
      const chapter = page.getByRole("region", { name: method });
      await expect(chapter.getByText("1", { exact: true })).toBeVisible();
      // The page speaks to clients, not engineers: no tooling names, in any project of the switcher either.
      await expect(chapter).not.toContainText(/\b(ADR|lint|tests?|E2E|Lighthouse|CMS|JavaScript|runtime)\b/i);
    });

    test(`${path} pone los proyectos en pestañas y abre sus decisiones al lado desde lg`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(path);
      const projects = page.getByRole("region", { name: method }).locator('details[name="project"]');
      // Boxes in page coordinates, so a click that scrolls does not move them.
      const box = (element: Locator) =>
        element.evaluate((node) => {
          const { x, y, width } = node.getBoundingClientRect();
          return { x, y: y + window.scrollY, width };
        });
      const tabs = await Promise.all((await projects.locator("summary").all()).map(box));
      const sheet = await box(projects.first().locator("figure"));
      // Two by two: the first two tabs share a row, the next two the row under it.
      expect(tabs[0]?.y).toBe(tabs[1]?.y);
      expect(tabs[2]?.y).toBe(tabs[3]?.y);
      expect(tabs[2]?.y).toBeGreaterThan(tabs[0]?.y ?? 0);
      expect(sheet?.x).toBeGreaterThan((tabs[1]?.x ?? 0) + (tabs[1]?.width ?? 0));

      await projects.nth(3).locator("summary").click();
      const next = await box(projects.nth(3).locator("figure"));
      expect(next?.x).toBe(sheet?.x);
      expect(next?.y).toBe(sheet?.y);
    });

    test(`${path} dice qué pasa después de escribir: tres pasos en el contacto`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("region", { name: contact }).locator("ol").last().locator("> li")).toHaveCount(3);
    });
  }
});
