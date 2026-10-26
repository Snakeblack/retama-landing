import { type APIRequestContext, type APIResponse, expect, test } from "@playwright/test";

const paths = ["/", "/en/", "/no-existe/", "/en/no-existe/"];

// Cloudflare Web Analytics waits for its token (src/lib/analytics.ts): CI builds with a test one, a plain local run
// without. The beacon is a double at the boundary, served from its real URL so the CSP still decides whether it runs
// and whether it may send its measures.
const analyticsToken = process.env.PUBLIC_CF_ANALYTICS_TOKEN?.trim();
const BEACON = "https://static.cloudflareinsights.com/beacon.min.js";
const REPORT = "https://cloudflareinsights.com/cdn-cgi/rum";
const BEACON_DOUBLE = `navigator.sendBeacon(${JSON.stringify(REPORT)}, document.currentScript.dataset.cfBeacon);`;

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
      // ADR 0011: violations go to the site's own /api/report/, through report-to and, where it is missing, report-uri.
      expect(csp).toContain("report-uri /api/report/");
      expect(csp).toContain("report-to csp");
      expect(headers["reporting-endpoints"]).toBe('csp="/api/report/"');
      // ADR 0006 allowlist: Turnstile for the contact form and, only while the booking is on (PUBLIC_BOOKING), the
      // Cal.com calendar as a frame.
      const insights = analyticsToken ? " https://static.cloudflareinsights.com" : "";
      expect(csp).toMatch(
        new RegExp(
          `script-src 'self' https://challenges\\.cloudflare\\.com${insights.replaceAll(".", "\\.")}( 'sha256-[^']+')*;`,
        ),
      );
      expect(csp.split(/;\s*/).find((directive) => directive.startsWith("connect-src "))).toBe(
        `connect-src 'self'${analyticsToken ? " https://cloudflareinsights.com" : ""}`,
      );
      const booking = process.env.PUBLIC_BOOKING === "true" ? " https://cal.com" : "";
      expect(csp.split(/;\s*/).find((directive) => directive.startsWith("frame-src "))).toBe(
        `frame-src https://challenges.cloudflare.com${booking}`,
      );
      expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
    });
  }
});

// public/_headers only reaches the static assets: what the Worker answers itself carries the same headers from
// src/server/edge.ts, with a CSP that loads nothing, since none of it is a page (M7, worker-headers).
const WORKER_CSP = "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

test.describe("respuestas del Worker (ADR 0002, ADR 0006, ADR 0011)", () => {
  const answers: [string, (request: APIRequestContext) => Promise<APIResponse>][] = [
    ["GET /api/contact/", (request) => request.get("/api/contact/")],
    ["POST /api/report/", (request) => request.post("/api/report/", { data: {} })],
    ["GET /api/contact, que redirige a la barra final", (request) => request.get("/api/contact", { maxRedirects: 0 })],
  ];
  for (const [name, send] of answers) {
    test(`${name} lleva las cabeceras de seguridad y una CSP que no carga nada`, async ({ request }) => {
      const headers = (await send(request)).headers();
      for (const [header, pattern] of Object.entries(expectedHeaders)) {
        expect(headers[header], header).toMatch(pattern);
      }
      expect(headers["content-security-policy"]).toBe(WORKER_CSP);
    });
  }

  // Astro and the adapter inject the image endpoint and the server islands into the build; the site uses neither, and
  // Astro decodes the path before it routes it, so an encoded one must not reach them either.
  for (const path of ["/_image/?href=/favicon.svg", "/%5Fimage/?href=/favicon.svg", "/_server-islands/Team/"]) {
    test(`${path} responde como una ruta que no existe`, async ({ request }) => {
      const missing = await request.get("/no-existe/");
      const response = await request.get(path);
      expect(response.status()).toBe(404);
      expect(await response.text()).toBe(await missing.text());
      expect(response.headers()["content-security-policy"]).toBe(missing.headers()["content-security-policy"]);
    });
  }
});

test.describe("navegación sin violaciones de CSP ni rastreo (ADR 0006, ADR 0007)", () => {
  // Without the token nothing leaves the site's origin; with it, only the beacon and the measures it sends.
  const allowed = analyticsToken ? [BEACON, REPORT] : [];
  for (const path of ["/", "/en/", "/legal/", "/en/legal/", "/no-existe/"]) {
    test(`${path} no viola la CSP, no guarda nada en el navegador y solo sale de su origen para medir sin cookies`, async ({
      page,
      context,
      baseURL,
    }) => {
      const reports: string[] = [];
      await context.route(BEACON, (route) => route.fulfill({ contentType: "text/javascript", body: BEACON_DOUBLE }));
      await context.route(REPORT, (route) => {
        reports.push(route.request().postData() ?? "");
        return route.fulfill({ status: 204 });
      });
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

      // Each page measures once it has loaded: wait for its report before leaving it.
      const measured = (count: number) => analyticsToken && expect.poll(() => reports.length).toBe(count);
      await page.goto(path);
      await measured(1);
      await page.locator("a.lang-switch").click();
      await page.waitForLoadState("load");
      await measured(2);

      expect(violations).toEqual([]);
      expect([...new Set(foreign)].sort()).toEqual([...allowed].sort());
      expect(reports.map((report) => JSON.parse(report))).toEqual(
        analyticsToken ? [{ token: analyticsToken }, { token: analyticsToken }] : [],
      );
      expect(await context.cookies()).toEqual([]);
      expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);
    });
  }
});

test("el beacon llega después del evento load, fuera del JavaScript de inicio (ADR 0001, ADR 0007)", async ({
  page,
}) => {
  test.skip(!analyticsToken, "the build has no analytics token");
  await page.route(BEACON, (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
  await page.goto("/");
  await page.waitForLoadState("load");
  const timing = () =>
    page.evaluate((beacon) => {
      const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      return { start: performance.getEntriesByName(beacon)[0]?.startTime, load: navigation?.loadEventStart };
    }, BEACON);
  await expect.poll(async () => (await timing()).start).toBeDefined();
  const { start, load } = await timing();
  expect(load).toBeGreaterThan(0);
  expect(start).toBeGreaterThanOrEqual(load ?? Number.POSITIVE_INFINITY);
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
