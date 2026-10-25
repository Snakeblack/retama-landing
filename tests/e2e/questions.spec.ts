import { expect, test } from "@playwright/test";

const pages = [
  {
    path: "/",
    anchor: "preguntas",
    before: "nosotros",
    after: "contacto",
    title: "Lo que nos preguntan",
    first: "¿Cuánto tarda un proyecto?",
    second: "¿Cómo se presupuesta?",
    owner: "¿De quién es el código?",
  },
  {
    path: "/en/",
    anchor: "questions",
    before: "about-us",
    after: "contact",
    title: "What clients ask us",
    first: "How long does a project take?",
    second: "How is it priced?",
    owner: "Who owns the code?",
  },
];

test.describe("las preguntas sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { path, anchor, before, after, title, first, second } of pages) {
    test(`${path} tiene las seis preguntas entre quiénes somos y el contacto, la primera abierta`, async ({ page }) => {
      await page.goto(path);
      const chapter = page.locator(`main section#${anchor}`);
      await expect(chapter.getByRole("heading", { level: 2, name: title })).toBeVisible();
      // DESIGN.md Layout: the chapters run services, sectors, method, team, questions, contact.
      const order = await page.locator("main section[id]").evaluateAll((sections) => sections.map((s) => s.id));
      expect(order.indexOf(anchor)).toBe(order.indexOf(before) + 1);
      expect(order.indexOf(after)).toBe(order.indexOf(anchor) + 1);

      const items = chapter.locator("details");
      await expect(items).toHaveCount(6);
      await expect(items.first()).toHaveAttribute("open", "");
      await expect(items.first().locator("summary")).toHaveText(first);
      await expect(items.first().locator("p")).toBeVisible();
      // Not exclusive: opening another leaves the first open.
      await items.nth(1).locator("summary").click();
      await expect(items.nth(1).locator("summary")).toHaveText(second);
      await expect(items.nth(1).locator("p")).toBeVisible();
      await expect(items.first().locator("p")).toBeVisible();
    });
  }
});

for (const { path, anchor, title, owner } of pages) {
  test(`${path} repite las preguntas en el JSON-LD con el texto del capítulo`, async ({ page }) => {
    await page.goto(path);
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    const faq = (data["@graph"] as { "@type": unknown; mainEntity?: unknown }[]).find(
      (node) => node["@type"] === "FAQPage",
    );
    const entities = faq?.mainEntity as { name: string; acceptedAnswer: { text: string } }[];
    const chapter = page.locator(`main section#${anchor}`);
    const summaries = await chapter.locator("summary").allTextContents();
    expect(entities.map((entity) => entity.name)).toEqual(summaries.map((text) => text.trim()));
    const ownerAnswer = entities.find((entity) => entity.name === owner)?.acceptedAnswer.text;
    await expect(chapter.locator("details", { hasText: owner }).locator("p")).toHaveText(ownerAnswer ?? "");
    // The heading never runs past two lines (DESIGN.md Do's and Don'ts).
    const heading = chapter.getByRole("heading", { level: 2, name: title });
    const lines = await heading.evaluate((node) =>
      Math.round(node.clientHeight / Number.parseFloat(getComputedStyle(node).lineHeight)),
    );
    expect(lines).toBeLessThanOrEqual(2);
  });
}

test("la página legal no lleva FAQPage", async ({ page }) => {
  await page.goto("/legal/");
  await expect(page.locator('script[type="application/ld+json"]')).not.toContainText("FAQPage");
});
