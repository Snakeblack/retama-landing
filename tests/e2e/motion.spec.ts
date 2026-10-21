import { expect, type Page, test } from "@playwright/test";

const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };

const tileOpacities = (page: Page) =>
  page
    .locator("main section[id] > *")
    .evaluateAll((tiles) => tiles.map((tile) => Number(getComputedStyle(tile).opacity)));

const lensValue = (page: Page, name: string) =>
  page.locator("[data-lens]").evaluate((lens, property) => getComputedStyle(lens).getPropertyValue(property), name);

const SECTORS = "[data-sectors]";

/** Index of the active sector name and of the fragment on top of the stack. */
const sceneState = (page: Page) =>
  page.locator(SECTORS).evaluate((scene) => {
    const names = [...scene.querySelectorAll("[data-sectors-name]")];
    const frames = [...scene.querySelectorAll<HTMLElement>("[data-sectors-frame]")].map((frame) =>
      Number(frame.style.zIndex),
    );
    return {
      name: names.findIndex((name) => name.hasAttribute("data-active")),
      frame: frames.indexOf(Math.max(...frames)),
    };
  });

/** Every sector keeps its own fragment, labelled as an example, in the page. */
async function expectStackedSectors(page: Page) {
  await expect(page.locator(`${SECTORS}[data-pinned]`)).toHaveCount(0);
  const steps = page.locator("[data-sectors-steps] > li");
  await expect(steps).toHaveCount(4);
  for (const step of await steps.all()) {
    await expect(step.locator("[data-ui] [data-example]")).toBeVisible();
    await expect(step.locator("[data-sectors-note]")).toBeVisible();
  }
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

  test("Sectores se fija y cada cuarto del tramo trae el nombre y el fragmento de un sector", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(SECTORS)).toHaveAttribute("data-pinned", "");
    // The pin is held for two and a half screens from the moment the scene is centred in the window.
    const { start, hold } = await page.locator(SECTORS).evaluate((scene) => {
      const box = scene.getBoundingClientRect();
      return { start: box.top + scrollY - (innerHeight - box.height) / 2, hold: innerHeight * 2.5 };
    });
    for (const step of [0, 1, 2, 3]) {
      await page.evaluate((y) => scrollTo(0, y), start + ((step + 0.5) * hold) / 4);
      await expect.poll(() => sceneState(page)).toEqual({ name: step, frame: step });
      // Held whole inside the window while its quarter lasts.
      await expect
        .poll(async () => {
          const box = await page.locator(SECTORS).boundingBox();
          return Boolean(box && box.y >= 0 && box.y + box.height <= desktop.height);
        })
        .toBe(true);
    }
    await page.evaluate((y) => scrollTo(0, y), start + hold + 400);
    await expect.poll(async () => (await page.locator(SECTORS).boundingBox())?.y ?? 0).toBeLessThan(0);
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

  test("Sectores no se fija: cada sector trae su fragmento y la marca blanca cambia de marca", async ({ page }) => {
    await page.goto("/");
    await expectStackedSectors(page);
    const marks = page.locator("[data-portal] [data-brand-mark]");
    await expect(marks.nth(0)).toHaveAttribute("data-active", "");
    await page.locator("[data-portal]").scrollIntoViewIfNeeded();
    await expect(marks.nth(1)).toHaveAttribute("data-active", "", { timeout: 5000 });
    await expect(page.locator("[data-portal] [data-brand-mark][data-active]")).toHaveCount(1);
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
    await expectStackedSectors(page);
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
    await expectStackedSectors(page);
  });
});
