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

  for (const path of [
    "/servicios/software-a-medida/",
    "/en/blog/",
    "/blog/cuanto-cuesta-un-software-a-medida/",
    "/legal/",
  ]) {
    test(`${path} no tiene escena y trae el grano desde el HTML, así que no retrasa el LCP hasta la carga`, async ({
      page,
    }) => {
      // The phone of Lighthouse's mobile run, where the title paints smaller than a 240×240 tile of the grain, on a slow
      // network, where the page loads after its first paint, as it does for a visitor.
      await page.setViewportSize({ width: 412, height: 823 });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });
      await page.goto(path);
      // Two frames after the load, where the grain used to come on and paint a new largest candidate.
      await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));
      const paints = await page.evaluate(
        () =>
          new Promise<{ first: number; largest: number; load: number }>((resolve) => {
            new PerformanceObserver((list) => {
              const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
              resolve({
                first: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0,
                largest: list.getEntries().at(-1)?.startTime ?? 0,
                load: navigation?.loadEventStart ?? 0,
              });
            }).observe({ type: "largest-contentful-paint", buffered: true });
          }),
      );
      expect(paints.load, "the page loads after its first paint").toBeGreaterThan(paints.first);
      expect(paints.largest - paints.first).toBeLessThan(50);
    });
  }

  test.describe("sin JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("una página sin escena lleva su grano igual, y la home espera a la carga", async ({ page }) => {
      await page.goto("/servicios/software-a-medida/");
      await expect(page.locator("html")).toHaveAttribute("data-grain", "");
      expect((await ground(page, "[data-grounds]")).image).toContain("data:image/svg+xml");
      await page.goto("/");
      await expect(page.locator("html")).not.toHaveAttribute("data-grain");
    });
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
