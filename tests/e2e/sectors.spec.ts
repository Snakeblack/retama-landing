import { expect, test } from "@playwright/test";

const pages = [
  {
    path: "/",
    tabs: ["Logística", "Empresa", "Hortofrutícola", "Otros"],
    caption: "Pedidos del día",
    statuses: ["Recibido", "Preparando", "Sin stock"],
  },
  {
    path: "/en/",
    tabs: ["Logistics", "Business", "Fresh produce", "Others"],
    caption: "Today's orders",
    statuses: ["Received", "Preparing", "Out of stock"],
  },
];

test.describe("el capítulo Sectores (DESIGN.md Imagery y Motion)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { path, tabs, caption, statuses } of pages) {
    test(`${path} trabaja para el sector hortofrutícola en el puesto de gaming, con sus pedidos del día`, async ({
      page,
    }) => {
      await page.goto(path);
      const switcher = page.locator("[data-sectors]");
      await expect(switcher.locator("summary")).toHaveText(tabs);

      // The third sector, the business model's entry sector (owner, 2026-10-26), with its example fragment.
      const produce = switcher.locator("details").nth(2);
      await produce.locator("summary").click();
      const fragment = produce.locator("figure[data-ui]");
      await expect(fragment.locator("figcaption")).toContainText(caption);
      await expect(fragment.locator("[data-live-text]")).toHaveText(statuses);
      await expect(fragment.locator("[data-alert]")).toHaveCount(1);

      // Gaming is gone from the page in every language.
      await expect(page.locator("body")).not.toContainText(/gaming|videojuego|video game/i);
    });
  }
});

test.describe("el capítulo Sectores a ancho de tableta (DESIGN.md Layout)", () => {
  test.use({ javaScriptEnabled: false });

  for (const width of [768, 1024]) {
    for (const path of ["/", "/en/"]) {
      test(`${path} a ${width} px no se sale de la pantalla ni de sus teselas, con cualquier sector abierto`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 1024 });
        await page.goto(path);
        const sectors = page.locator("#sectors-title").locator("xpath=ancestor::section");
        const overflowing = () =>
          sectors.evaluate((section) =>
            [...section.querySelectorAll<HTMLElement>(":scope > p, [data-sectors] summary")]
              .filter((tile) => tile.scrollWidth > tile.clientWidth)
              .map((tile) => tile.textContent?.trim()),
          );
        const summaries = sectors.locator("[data-sectors] summary");
        for (let index = 0; index < (await summaries.count()); index++) {
          await summaries.nth(index).click();
          expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
          expect(await overflowing()).toEqual([]);
        }
      });
    }
  }
});
