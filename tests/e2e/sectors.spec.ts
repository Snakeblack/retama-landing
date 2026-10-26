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
