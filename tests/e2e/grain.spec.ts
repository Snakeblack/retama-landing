import { expect, test } from "@playwright/test";

test.describe("el grano de los fondos (DESIGN.md Elevation & Depth)", () => {
  for (const path of ["/", "/en/"]) {
    test(`${path} lleva el grano en el suelo y en las teselas oscuras, multiplicado para que solo oscurezca`, async ({
      page,
    }) => {
      await page.goto(path);
      const ground = (selector: string) =>
        page
          .locator(selector)
          .first()
          .evaluate((node) => {
            const style = getComputedStyle(node);
            return { image: style.backgroundImage, blend: style.backgroundBlendMode };
          });
      for (const selector of ["body", "main .bg-surface-raised"]) {
        const { image, blend } = await ground(selector);
        expect(image, selector).toContain("data:image/svg+xml");
        expect(blend, selector).toBe("multiply");
      }
    });
  }

  test("una capa ligera del mismo grano cubre la página sin tomar el puntero ni pedir nada a la red", async ({
    page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => requests.push(request.url()));
    await page.goto("/");
    // The grains are inlined into the stylesheet, so they never delay the largest paint.
    expect(requests.filter((url) => url.includes("grain"))).toEqual([]);
    const layer = await page.evaluate(() => {
      const style = getComputedStyle(document.body, "::after");
      return {
        image: style.backgroundImage,
        blend: style.mixBlendMode,
        opacity: Number(style.opacity),
        position: style.position,
        pointer: style.pointerEvents,
      };
    });
    expect(layer).toMatchObject({ blend: "multiply", opacity: 0.1, position: "fixed", pointer: "none" });
    expect(layer.image).toContain("data:image/svg+xml");
  });

  test("una tesela que pasa a papel bajo el puntero deja el grano fuerte", async ({ page }) => {
    await page.goto("/");
    const top = page.locator('footer a[href="#top"]');
    const image = () => top.evaluate((node) => getComputedStyle(node).backgroundImage);
    expect(await image()).toContain("data:image/svg+xml");
    await top.hover();
    await expect.poll(image).toBe("none");
  });
});
