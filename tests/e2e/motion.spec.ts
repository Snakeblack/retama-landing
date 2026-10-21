import { expect, type Page, test } from "@playwright/test";

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };

const tileOpacities = (page: Page) =>
  page
    .locator("main section[id] > *")
    .evaluateAll((tiles) => tiles.map((tile) => Number(getComputedStyle(tile).opacity)));

const lensValue = (page: Page, name: string) =>
  page.locator("[data-lens]").evaluate((lens, property) => getComputedStyle(lens).getPropertyValue(property), name);

async function scrollThrough(page: Page) {
  for (const group of await page.locator("main section[id]").all()) await group.scrollIntoViewIfNeeded();
  await page.keyboard.press("End");
}

test.describe("movimiento en escritorio (DESIGN.md Motion)", () => {
  test.use({ viewport: desktop });

  test("la escena abre con el shutter en CSS y la cifra cuenta hasta su valor", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-shutter]")).toHaveCSS("animation-name", "shutter");
    await expect(page.locator("[data-count]")).toHaveText("100");
  });

  test("la lupa aparece bajo el puntero, lo sigue y se va al salir", async ({ page }) => {
    await page.goto("/");
    const box = await page.locator("[data-lens]").boundingBox();
    if (!box) throw new Error("no lens");
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 4 });
    await expect.poll(() => lensValue(page, "--lens")).toBe("1");
    await expect.poll(async () => Number.parseFloat(await lensValue(page, "--lens-x"))).toBeCloseTo(200, -1);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height + 200);
    await expect.poll(() => lensValue(page, "--lens")).toBe("0");
  });

  test("cada grupo entra una vez al llegar y al final todo queda visible", async ({ page }) => {
    await page.goto("/");
    expect((await tileOpacities(page)).some((opacity) => opacity < 1)).toBe(true);

    await scrollThrough(page);
    await expect.poll(async () => (await tileOpacities(page)).every((opacity) => opacity === 1)).toBe(true);
  });
});

test.describe("movimiento en el móvil (DESIGN.md Motion)", () => {
  test.use({ viewport: phone, hasTouch: true, isMobile: true });

  test("la lupa hace una pasada sola al cargar", async ({ page }) => {
    await page.goto("/");
    await expect.poll(() => lensValue(page, "--lens"), { timeout: 5000 }).toBe("1");
    await expect.poll(() => lensValue(page, "--lens"), { timeout: 5000 }).toBe("0");
  });
});

test.describe("con movimiento reducido (DESIGN.md Motion, ADR 0004)", () => {
  test.use({ viewport: desktop, reducedMotion: "reduce" });

  test("sin shutter ni cuenta; las entradas solo funden y la lupa no viaja", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-shutter]")).toHaveCSS("animation-name", "none");
    await expect(page.locator("[data-count]")).toHaveText("100");
    await expect(page.locator("[data-lens]")).toHaveAttribute("data-lens-still", "");

    await scrollThrough(page);
    await expect.poll(async () => (await tileOpacities(page)).every((opacity) => opacity === 1)).toBe(true);
    const moved = await page
      .locator("main section[id] > *")
      .evaluateAll((tiles) => tiles.filter((tile) => getComputedStyle(tile).transform !== "none").length);
    expect(moved).toBe(0);
  });
});

test.describe("sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false, viewport: desktop });

  test("todo el tablero queda visible, la cifra dice su valor y la lupa no dibuja nada", async ({ page }) => {
    await page.goto("/");
    expect((await tileOpacities(page)).every((opacity) => opacity === 1)).toBe(true);
    await expect(page.locator("[data-count]")).toHaveText("100");
    const layer = await page.locator("[data-lens]").evaluate((lens) => getComputedStyle(lens, "::after").opacity);
    expect(layer).toBe("0");
  });
});
