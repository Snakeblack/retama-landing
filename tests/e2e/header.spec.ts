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

  for (const { path, index, close, method, sectors, here } of pages) {
    test(`${path} cambia la fila de enlaces por el índice, un diálogo modal que se cierra con Escape`, async ({
      page,
    }) => {
      await page.goto(path);
      // The header floats over the first chapter: the stage starts at the top of the screen.
      expect(await page.locator("[data-scene]").evaluate((stage) => stage.getBoundingClientRect().top)).toBe(0);
      await expect(page.getByRole("banner").getByRole("navigation")).toBeHidden();

      await page.getByRole("button", { name: index }).click();
      const dialog = page.getByRole("dialog", { name: index });
      await expect(dialog).toBeVisible();
      expect(await dialog.evaluate((node) => node.matches(":modal"))).toBe(true);
      await expect(dialog.getByRole("button", { name: close })).toBeFocused();
      await expect(dialog.getByRole("navigation").getByRole("link")).toHaveCount(4);
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

  test("los enlaces siguen en la cabecera y el índice no aparece", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("navigation").getByRole("link")).toHaveCount(3);
    await expect(page.getByRole("button", { name: "Índice" })).toBeHidden();
  });

  test("el selector de idioma muestra ES / EN y enlaza el otro idioma con su nombre completo", async ({ page }) => {
    await page.goto("/");
    const other = page.getByRole("banner").getByRole("link", { name: "EN Read in English" });
    await expect(other).toBeVisible();
    await expect(other).toHaveAttribute("href", "/en/");
    await expect(other).toHaveAttribute("hreflang", "en");
  });
});
