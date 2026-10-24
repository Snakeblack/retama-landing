import { expect, test } from "@playwright/test";

// Wiring of /api/report in workerd and of the pages' reporter: the route, the rate-limit binding and the beacon.
// What a report keeps and drops is proven by tests/unit/report.test.ts.

// Each call gets a random documentation /64, so the 20-a-minute limit of one test never reaches another.
const ip = () => `2001:db8:${Math.floor(Math.random() * 0xffff).toString(16)}::1`;

test.describe("informes de errores de cliente (ADR 0011)", () => {
  test("un error sin capturar de la página llega a /api/report/ como JSON del sitio, sin query", async ({ page }) => {
    // Playwright only shows a beacon's body to a route; this one lets it through to the Worker.
    const bodies: string[] = [];
    const statuses: number[] = [];
    await page.route("**/api/report/", async (route) => {
      bodies.push(route.request().postDataBuffer()?.toString("utf8") ?? "");
      const response = await route.fetch();
      statuses.push(response.status());
      await route.fulfill({ response });
    });
    await page.goto("/en/?ref=mail");
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error("e2e boom");
      });
    });
    await expect.poll(() => statuses).toEqual([204]);
    expect(JSON.parse(bodies[0] ?? "")).toMatchObject({
      type: "error",
      page: "/en/",
      message: expect.stringMatching(/e2e boom/),
    });
  });

  test("acepta un informe de la CSP de report-to con 204", async ({ request, baseURL }) => {
    const response = await request.post("/api/report/", {
      headers: { "Content-Type": "application/reports+json", "CF-Connecting-IP": ip() },
      data: JSON.stringify([
        {
          type: "csp-violation",
          body: { documentURL: `${baseURL}/`, blockedURL: "inline", effectiveDirective: "script-src-elem" },
        },
      ]),
    });
    expect(response.status()).toBe(204);
  });

  test("rechaza más de 8 KB con 413", async ({ request, baseURL }) => {
    const response = await request.post("/api/report/", {
      headers: { "Content-Type": "application/json", Origin: new URL(baseURL ?? "").origin, "CF-Connecting-IP": ip() },
      data: JSON.stringify({ type: "error", page: "/", message: "x".repeat(9 * 1024) }),
    });
    expect(response.status()).toBe(413);
  });

  test("cuenta los informes por IP con su propio límite: el 21.º del minuto recibe 429", async ({ request }) => {
    const sameIp = { "Content-Type": "application/json", "CF-Connecting-IP": ip() };
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++)
      statuses.push((await request.post("/api/report/", { headers: sameIp, data: "{}" })).status());
    expect(statuses.slice(0, 20)).toEqual(Array(20).fill(204));
    expect(statuses[20]).toBe(429);
  });
});
