import { expect, test } from "@playwright/test";

const paths = ["/", "/en/", "/no-existe/", "/en/no-existe/"];

const expectedHeaders: Record<string, RegExp> = {
  "strict-transport-security": /^max-age=\d{8,}; includeSubDomains$/,
  "x-content-type-options": /^nosniff$/,
  "x-frame-options": /^DENY$/,
  "referrer-policy": /^strict-origin-when-cross-origin$/,
  "permissions-policy": /camera=\(\)/,
  "cross-origin-opener-policy": /^same-origin$/,
};

test.describe("cabeceras de seguridad (ADR 0006)", () => {
  for (const path of paths) {
    test(`${path} lleva todas las cabeceras y una única CSP estricta`, async ({ request }) => {
      const response = await request.get(path);
      const headers = response.headers();
      for (const [name, pattern] of Object.entries(expectedHeaders)) {
        expect(headers[name], name).toMatch(pattern);
      }
      const csp = headers["content-security-policy"] ?? "";
      // Cloudflare joins repeated values with commas: that would be several policies.
      expect(csp).not.toContain(",");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("object-src 'none'");
      // ADR 0006 allowlist: Turnstile, the one third party, for the contact form.
      expect(csp).toMatch(/script-src 'self' https:\/\/challenges\.cloudflare\.com( 'sha256-[^']+')*;/);
      expect(csp).toContain("frame-src https://challenges.cloudflare.com");
      expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
    });
  }
});

test.describe("navegación sin violaciones de CSP ni rastreo (ADR 0006, ADR 0007)", () => {
  for (const path of ["/", "/en/"]) {
    test(`${path} no viola la CSP, no crea cookies y no sale del propio origen`, async ({ page, context, baseURL }) => {
      const violations: string[] = [];
      page.on("console", (message) => {
        if (/Content Security Policy/i.test(message.text())) violations.push(message.text());
      });
      const foreign: string[] = [];
      page.on("request", (request) => {
        const url = new URL(request.url());
        if (!["http:", "https:"].includes(url.protocol)) return;
        if (url.origin !== new URL(baseURL ?? "").origin) foreign.push(url.href);
      });
      await page.addInitScript(() => {
        document.addEventListener("securitypolicyviolation", (event) => {
          console.error(`Content Security Policy violation: ${event.violatedDirective} ${event.blockedURI}`);
        });
      });

      await page.goto(path);
      await page.locator("a.lang-switch").click();
      await page.waitForLoadState("load");

      expect(violations).toEqual([]);
      expect(foreign).toEqual([]);
      expect(await context.cookies()).toEqual([]);
    });
  }
});

test("las transiciones entre páginas son nativas: CSS @view-transition sin router de cliente (ADR 0006)", async ({
  page,
}) => {
  await page.goto("/");
  const rules = await page.evaluate(() =>
    [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules].map((rule) => rule.cssText)),
  );
  expect(rules.some((rule) => rule.startsWith("@view-transition"))).toBe(true);
  expect(await page.locator("script[src*='ClientRouter'], script[data-astro-transition]").count()).toBe(0);
});
