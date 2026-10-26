import { expect, test } from "@playwright/test";

const pages = [
  {
    path: "/",
    title: "Quiénes somos",
    after: "Cómo trabajamos",
    before: "Lo que nos preguntan",
    roles: ["Producto y desarrollo", "Clientes y ventas"],
  },
  {
    path: "/en/",
    title: "Who we are",
    after: "How we work",
    before: "Common questions",
    roles: ["Product and development", "Clients and sales"],
  },
];
// The partner the client talks to comes first (owner, 2026-10-26).
const names = ["Paul Macorny Retamozo García", "Manuel Michael Retamozo García"];

test.describe("el capítulo Quiénes somos (DESIGN.md Layout)", () => {
  test.describe("sin JavaScript (ADR 0001)", () => {
    test.use({ javaScriptEnabled: false });

    for (const { path, title, after, before, roles } of pages) {
      test(`${path} presenta a los dos socios, entre el método y las preguntas`, async ({ page }) => {
        await page.goto(path);
        const chapter = page.getByRole("region", { name: title });
        await expect(chapter.getByRole("heading", { level: 2, name: title })).toBeVisible();
        await expect(chapter.getByRole("heading", { level: 3 })).toHaveText(names);
        for (const role of roles) await expect(chapter.getByText(role, { exact: true })).toBeVisible();

        // Only Michael has a LinkedIn profile for now (owner, 2026-10-26).
        const links = chapter.getByRole("link");
        await expect(links).toHaveCount(1);
        await expect(links).toHaveAttribute("href", "https://www.linkedin.com/in/mmretamozo/");

        // Until the photos exist, each slot holds the initials, a picture with nothing to read.
        const placeholders = chapter.locator("[data-portrait]");
        await expect(placeholders).toHaveText(["PR", "MR"]);
        for (const placeholder of await placeholders.all())
          await expect(placeholder).toHaveAttribute("aria-hidden", "true");

        const headings = await page
          .getByRole("heading", { level: 2 })
          .evaluateAll((all) => all.map((heading) => heading.textContent?.trim()));
        expect(headings.indexOf(title)).toBe(headings.indexOf(after) + 1);
        expect(headings.indexOf(before)).toBe(headings.indexOf(title) + 1);
      });
    }
  });

  test("en escritorio cada socio ocupa media fila, su retrato junto a su texto y a la misma altura", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const boxes = await page
      .getByRole("region", { name: "Quiénes somos" })
      .locator("[data-partner] > *")
      .evaluateAll((tiles) => tiles.map((tile) => tile.getBoundingClientRect()));
    expect(boxes).toHaveLength(4);
    expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
    expect(new Set(boxes.map((box) => Math.round(box.height))).size).toBe(1);
  });
});
