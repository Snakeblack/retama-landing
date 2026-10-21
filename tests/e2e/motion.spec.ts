import { expect, type Page, test } from "@playwright/test";

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };

const tileOpacities = (page: Page) =>
  page
    .locator("main section[id] > *")
    .evaluateAll((tiles) => tiles.map((tile) => Number(getComputedStyle(tile).opacity)));

const lensValue = (page: Page, name: string) =>
  page.locator("[data-lens]").evaluate((lens, property) => getComputedStyle(lens).getPropertyValue(property), name);

const TABS = "[data-sectors] > details";

/** Index of the open sector of the switcher. */
const openSector = (page: Page) =>
  page.locator(TABS).evaluateAll((tabs) => tabs.findIndex((tab) => (tab as HTMLDetailsElement).open));

/** Status texts of the live rows of the open sector. */
const liveStatuses = (page: Page) =>
  page
    .locator(`${TABS}[open] [data-live] [data-live-text]`)
    .evaluateAll((cells) => cells.map((cell) => cell.textContent));

async function showSectors(page: Page) {
  await page
    .locator("#sectores, #sectors")
    .first()
    .evaluate((group) => group.scrollIntoView());
}

async function scrollThrough(page: Page) {
  for (const group of await page.locator("main section[id]").all()) await group.scrollIntoViewIfNeeded();
  await page.keyboard.press("End");
}

test.describe("movimiento en escritorio (DESIGN.md Motion)", () => {
  test.use({ viewport: desktop });

  test("la escena abre con el shutter en CSS, la cifra cuenta y el texto se puede seleccionar", async ({ page }) => {
    await page.goto("/");
    expect(await page.locator("main h1").evaluate((node) => getComputedStyle(node).userSelect)).not.toBe("none");
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

  test("Sectores cabe en una pantalla, sin pin, y la vuelta avanza sola con fragmentos vivos", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".pin-spacer")).toHaveCount(0);
    expect((await page.locator("#sectores").boundingBox())?.height).toBeLessThan(desktop.height);
    const before = await liveStatuses(page);
    await showSectors(page);
    // The open fragment comes alive: a row moves to its next status.
    await expect.poll(() => liveStatuses(page), { timeout: 4000 }).not.toEqual(before);
    await expect.poll(() => openSector(page), { timeout: 9000 }).toBe(1);
  });

  test("elegir un sector detiene la vuelta y la pestaña abierta no se cierra", async ({ page }) => {
    await page.goto("/");
    await showSectors(page);
    const summaries = page.locator(`${TABS} > summary`);
    await summaries.nth(2).click();
    await expect.poll(() => openSector(page)).toBe(2);
    await summaries.nth(2).click();
    await page.waitForTimeout(7000);
    expect(await openSector(page)).toBe(2);
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

  test("el código barre la palabra entera de izquierda a derecha y sale por la derecha", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-lens]")).toHaveAttribute("data-lens-wipe", "");
    const edge = async (name: string) => Number.parseFloat(await lensValue(page, name));
    // Covered: the leading edge has crossed the word while the trailing edge has not moved yet.
    await expect.poll(() => edge("--wipe-lead"), { timeout: 5000 }).toBe(1);
    expect(await edge("--wipe-tail")).toBe(0);
    expect(await lensValue(page, "--lens")).toBe("1");
    // Then the trailing edge follows it out to the right and the layer is gone.
    await expect.poll(() => edge("--wipe-tail"), { timeout: 5000 }).toBe(1);
    await expect.poll(() => lensValue(page, "--lens"), { timeout: 5000 }).toBe("0");
  });

  test("Sectores lleva las pestañas en 2×2, la vuelta avanza y la marca blanca cambia de marca", async ({ page }) => {
    await page.goto("/");
    const tabs = page.locator(`${TABS} > summary`);
    const [first, second, third] = await Promise.all([0, 1, 2].map((index) => tabs.nth(index).boundingBox()));
    expect(second?.y).toBe(first?.y);
    expect(third?.x).toBe(first?.x);
    expect(third?.y).toBeGreaterThan(first?.y ?? 0);
    await showSectors(page);
    await expect.poll(() => openSector(page), { timeout: 9000 }).toBe(1);
    await tabs.nth(3).click();
    const marks = page.locator("[data-portal] [data-brand-mark]");
    await expect(marks.nth(1)).toHaveAttribute("data-active", "", { timeout: 4000 });
  });

  test("el texto del tablero no se selecciona, salvo el contacto", async ({ page }) => {
    await page.goto("/");
    const select = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((node) => getComputedStyle(node).userSelect);
    expect(await select("main h1")).toBe("none");
    expect(await select("footer li")).toBe("none");
    expect(await select('main a[href^="mailto:"]')).not.toBe("none");
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
    // No tour and no live fragments: the first sector stays as written.
    const before = await liveStatuses(page);
    await page.waitForTimeout(7000);
    expect(await openSector(page)).toBe(0);
    expect(await liveStatuses(page)).toEqual(before);
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
    // The switcher is a native exclusive accordion: every sector is in the HTML and opens one at a time.
    await expect(page.locator(TABS)).toHaveCount(4);
    expect(await openSector(page)).toBe(0);
    await page.locator(`${TABS} > summary`).nth(3).click();
    expect(await openSector(page)).toBe(3);
    await expect(page.locator(`${TABS}[open] [data-portal]`)).toBeVisible();
  });
});
