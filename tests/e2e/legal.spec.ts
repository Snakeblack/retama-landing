import { expect, test } from "@playwright/test";

// The owner shows only in a build given PUBLIC_LEGAL_NAME and PUBLIC_LEGAL_TOWN: CI builds with test ones, a plain local
// run without. The NIF and the address are never set here, as in production today.
const ownerName = process.env.PUBLIC_LEGAL_NAME?.trim();
const ownerTown = process.env.PUBLIC_LEGAL_TOWN?.trim();
const withOwner = Boolean(ownerName && ownerTown);

const pages = [
  {
    path: "/legal/",
    lang: "es",
    home: "/",
    missing: "/no-existe/",
    title: "Información legal",
    owner: "Titular",
    anchors: ["aviso-legal", "privacidad", "cookies"],
    form: "Política de privacidad",
  },
  {
    path: "/en/legal/",
    lang: "en",
    home: "/en/",
    missing: "/en/no-existe/",
    title: "Legal information",
    owner: "Owner",
    anchors: ["legal-notice", "privacy", "cookies"],
    form: "Privacy policy",
  },
];

test.describe("información legal sin JavaScript (ADR 0001)", () => {
  test.use({ javaScriptEnabled: false });

  for (const { path, lang, title, anchors } of pages) {
    test(`${path} tiene sus tres secciones en el HTML`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
      for (const anchor of anchors) {
        await expect(page.locator(`main section#${anchor} h2`)).toBeVisible();
        await expect(page.getByRole("navigation", { name: title }).locator(`a[href="#${anchor}"]`)).toBeVisible();
      }
    });
  }
});

for (const { path, owner } of pages) {
  test(`${path} nombra al titular del build y nada inventado`, async ({ page }) => {
    await page.goto(path);
    const data = page.locator("[data-owner]");
    await expect(data).toContainText("hola@retama.dev");
    if (withOwner) {
      await expect(data.locator("div", { has: page.locator("dt", { hasText: owner }) }).locator("dd")).toHaveText(
        ownerName ?? "",
      );
      await expect(data).toContainText(ownerTown ?? "");
    } else {
      await expect(data.locator("dt", { hasText: owner })).toHaveCount(0);
    }
    // Sin NIF ni domicilio en el build, sus líneas no salen.
    await expect(data.locator("dt", { hasText: "NIF" })).toHaveCount(0);
  });
}

for (const { path, home, missing, anchors } of pages) {
  test(`el pie de ${home} y de su 404 lleva a las tres secciones de ${path}`, async ({ page }) => {
    for (const from of [home, missing, path]) {
      await page.goto(from);
      const links = page.locator("footer nav a");
      await expect(links).toHaveCount(3);
      expect(await links.evaluateAll((all) => all.map((a) => a.getAttribute("href")))).toEqual(
        anchors.map((anchor) => `${path}#${anchor}`),
      );
    }
    await page.goto(home);
    await page.locator("footer nav a").nth(1).click();
    await expect(page).toHaveURL(new RegExp(`${path}#${anchors[1]}$`));
    await expect(page.locator(`section#${anchors[1]}`)).toBeInViewport();
  });
}

for (const { path, home, anchors, form } of pages) {
  test(`el formulario de ${home} enlaza la privacidad y nombra al responsable del build`, async ({ page }) => {
    await page.goto(home);
    const line = page.locator("[data-privacy]");
    await expect(line.getByRole("link", { name: form })).toHaveAttribute("href", `${path}#${anchors[1]}`);
    if (withOwner) await expect(line).toContainText(ownerName ?? "");
    else await expect(line).not.toContainText(":");
  });
}
