import { expect, type Page, test } from "@playwright/test";

/** The ground grain of an element: its background image and how it blends into the colour. */
const ground = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((node) => {
      const style = getComputedStyle(node);
      return { image: style.backgroundImage, blend: style.backgroundBlendMode };
    });

test.describe("el grano de los fondos (DESIGN.md Elevation & Depth)", () => {
  for (const path of ["/", "/en/"]) {
    test(`${path} lleva el grano en los fondos tras el hero y en sus teselas, multiplicado para que solo oscurezca`, async ({
      page,
    }) => {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-grain", "");
      for (const selector of ["[data-grounds]", "footer", "[data-grounds] .bg-surface-raised"]) {
        const { image, blend } = await ground(page, selector);
        expect(image, selector).toContain("data:image/svg+xml");
        expect(blend, selector).toBe("multiply");
      }
      // The first screen carries no grain of the page: the scene draws its own.
      expect((await ground(page, "body")).image).toBe("none");
      expect((await ground(page, "[data-scene]")).image).toBe("none");
    });
  }

  test("el grano llega tras la carga, así que pintar su ruido nunca retrasa la primera pantalla", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.documentElement.removeAttribute("data-grain"));
    expect((await ground(page, "[data-grounds]")).image).toBe("none");
  });

  test("una capa ligera del mismo grano cubre los capítulos sin tomar el puntero ni pedir nada a la red", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto("/");
    // The grains are inlined into the stylesheet.
    expect(requests.filter((url) => url.includes("grain"))).toEqual([]);
    const layer = await page.locator("[data-grounds]").evaluate((node) => {
      const style = getComputedStyle(node, "::after");
      return {
        image: style.backgroundImage,
        blend: style.mixBlendMode,
        opacity: Number(style.opacity),
        position: style.position,
        pointer: style.pointerEvents,
      };
    });
    expect(layer).toMatchObject({ blend: "multiply", opacity: 0.1, position: "absolute", pointer: "none" });
    expect(layer.image).toContain("data:image/svg+xml");
  });

  test("una tesela que pasa a papel bajo el puntero deja el grano fuerte", async ({ page }) => {
    await page.goto("/");
    const top = page.locator('footer a[href="#top"]');
    const image = () => top.evaluate((node) => getComputedStyle(node).backgroundImage);
    await expect.poll(image).toContain("data:image/svg+xml");
    await top.hover();
    await expect.poll(image).toBe("none");
  });

  test.describe("con movimiento reducido", () => {
    test.use({ reducedMotion: "reduce" });

    test("no hay escena, así que el escenario del hero lleva el grano desde el principio", async ({ page }) => {
      await page.goto("/");
      const { image, blend } = await ground(page, "[data-scene]");
      expect(image).toContain("data:image/svg+xml");
      expect(blend).toBe("multiply");
    });
  });
});
