import { expect, type Page, test } from "@playwright/test";

const phone = { width: 390, height: 844 };
const desktop = { width: 1440, height: 900 };

const pages = [
  { path: "/", index: "Índice", close: "Cerrar", method: "Método", sectors: "#sectores", here: "Estás aquí" },
  { path: "/en/", index: "Contents", close: "Close", method: "Method", sectors: "#sectors", here: "You are here" },
];

const bar = (page: Page) => page.locator("[data-header-bar]");
const barTop = (page: Page) => bar(page).evaluate((node) => Math.round(node.getBoundingClientRect().top));

test.describe("cabecera flotante e índice de capítulos en el móvil (DESIGN.md Layout)", () => {
  test.use({ viewport: phone, hasTouch: true });

  for (const path of ["/", "/servicios/software-a-medida/", "/en/blog/"])
    test(`${path} da al logotipo un objetivo táctil de 48 px de alto sin agrandar la cabecera`, async ({ page }) => {
      await page.goto(path);
      const home = bar(page).getByRole("link", { name: "Retama" });
      expect(await home.evaluate((node) => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(48);
      const height = await bar(page).evaluate((node) => node.getBoundingClientRect().height);
      // The primary bar (6), the row's padding (2 × 16) and a touch-tall row (48).
      expect(height).toBe(6 + 32 + 48);
    });

  for (const { path, index, close, method, sectors, here } of pages) {
    test(`${path} cambia la fila de enlaces por el índice, un diálogo modal que se cierra con Escape`, async ({
      page,
    }) => {
      await page.goto(path);
      // The header floats over the first chapter: the stage starts at the top of the screen.
      expect(await page.locator("[data-scene]").evaluate((stage) => stage.getBoundingClientRect().top)).toBe(0);
      await expect(page.getByRole("banner").getByRole("navigation")).toBeHidden();
      // The title keeps clear of the bar.
      const title = await page.locator("h1").evaluate((node) => node.getBoundingClientRect().top);
      expect(title).toBeGreaterThanOrEqual(
        (await bar(page).evaluate((node) => node.getBoundingClientRect().bottom)) + 24,
      );

      // Both buttons of the index are icons on a touch-sized tile, named for assistive technology only.
      const iconOnly = async (button: import("@playwright/test").Locator) => {
        await expect(button).toHaveText("");
        expect(await button.boundingBox()).toMatchObject({ width: 48, height: 48 });
      };
      const opener = page.getByRole("button", { name: index });
      await iconOnly(opener);
      await opener.click();
      const dialog = page.getByRole("dialog", { name: index });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((node) => node.matches(":modal"))).toBe(true);
      await expect(dialog.getByRole("button", { name: close })).toBeFocused();
      await iconOnly(dialog.getByRole("button", { name: close }));
      // The six entries of the home and its chapters, then the blog.
      await expect(dialog.getByRole("navigation").getByRole("link")).toHaveCount(7);
      // Above every chapter, the first entry is the one on screen.
      await expect(dialog.locator('[aria-current="location"]')).toHaveCount(1);
      await expect(dialog.locator("[data-index-link]").first()).toHaveAttribute("aria-current", "location");

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();

      await page.locator(sectors).evaluate((chapter) => chapter.scrollIntoView());
      await page.getByRole("button", { name: index }).click();
      const current = dialog.locator('[aria-current="location"]');
      await expect(current).toHaveAttribute("href", sectors);
      await expect(current).toContainText(here);
    });

    test(`${path} cierra el índice al elegir un capítulo y lo deja a la vista bajo la cabecera`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole("button", { name: index }).click();
      const link = page.getByRole("dialog").getByRole("link", { name: new RegExp(`^${method}`) });
      const target = await link.getAttribute("href");
      await link.click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`${target}$`));
      const header = await bar(page).evaluate((node) => (node as HTMLElement).offsetHeight);
      await expect
        .poll(() => page.locator(target ?? "").evaluate((chapter) => Math.round(chapter.getBoundingClientRect().top)))
        .toBeGreaterThanOrEqual(header - 1);
    });
  }

  test("el índice baja como una cortina al abrirse, no aparece de golpe", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Índice" }).click();
    const dialog = page.getByRole("dialog", { name: "Índice" });
    // Halfway through the wipe the index is cut partway from the bottom, not either all there or all gone.
    const halfway = await dialog.evaluate((node) => {
      const [wipe] = node
        .getAnimations()
        .filter((animation) => (animation as CSSAnimation).animationName === "index-wipe");
      if (!wipe) return "no animation";
      wipe.pause();
      wipe.currentTime = Number(wipe.effect?.getComputedTiming().duration) / 2;
      return getComputedStyle(node).clipPath;
    });
    expect(halfway).toMatch(/^inset\(0px 0px (?:[1-9]\d?(?:\.\d+)?)%\)$/);
  });

  test("la cabecera se va al bajar y vuelve al subir", async ({ page }) => {
    await page.goto("/");
    expect(await barTop(page)).toBe(0);
    await page.mouse.wheel(0, 2400);
    await expect.poll(() => barTop(page)).toBeLessThan(0);
    await page.mouse.wheel(0, -200);
    await expect.poll(() => barTop(page)).toBe(0);
  });

  test("sobre el primer capítulo la cabecera no tiene fondo y lo toma al salir de él", async ({ page }) => {
    await page.goto("/");
    const ground = () => bar(page).evaluate((node) => getComputedStyle(node).backgroundColor);
    expect(await ground()).toBe("rgba(0, 0, 0, 0)");
    await page.locator("#servicios").evaluate((chapter) => chapter.scrollIntoView());
    await expect.poll(ground).toBe("rgb(24, 25, 27)");
  });

  test.describe("sin JavaScript (ADR 0001)", () => {
    test.use({ javaScriptEnabled: false });

    test("el índice se abre y se cierra con los comandos nativos del botón", async ({ page }) => {
      await page.goto("/");
      await page.getByRole("button", { name: "Índice" }).click();
      const dialog = page.getByRole("dialog", { name: "Índice" });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("button", { name: "Cerrar" }).click();
      await expect(dialog).toBeHidden();
    });
  });
});

test.describe("cabecera en escritorio (DESIGN.md Layout)", () => {
  test.use({ viewport: desktop });

  test("los enlaces siguen en la cabecera, a la derecha junto al idioma, y el índice no aparece", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("banner").getByRole("navigation");
    // The five chapters, then the blog.
    await expect(nav.getByRole("link")).toHaveCount(6);
    await expect(page.getByRole("button", { name: "Índice" })).toBeHidden();
    // The wordmark stands alone on the left; the links gather on the right, next to the language switch.
    const links = await nav.boundingBox();
    const switcher = await page.locator("a.lang-switch").locator("..").boundingBox();
    expect(links?.x ?? 0).toBeGreaterThan(desktop.width / 2);
    expect((switcher?.x ?? 0) - ((links?.x ?? 0) + (links?.width ?? 0))).toBeLessThanOrEqual(48);
  });

  test("el selector de idioma muestra ES / EN y enlaza el otro idioma con su nombre completo", async ({ page }) => {
    await page.goto("/");
    const other = page.getByRole("banner").getByRole("link", { name: "EN Read in English" });
    await expect(other).toBeVisible();
    await expect(other).toHaveAttribute("href", "/en/");
    await expect(other).toHaveAttribute("hreflang", "en");
  });
});
