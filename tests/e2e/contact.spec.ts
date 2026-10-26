import { expect, test } from "@playwright/test";

// Wiring of /api/contact in workerd: the route, the rate-limit binding and the missing secrets.
// The behaviour with Turnstile and Resend is proven by tests/unit/contact.test.ts with doubles.
const body = {
  name: "Ana Pérez",
  email: "ana@example.com",
  projectType: "web",
  message: "Necesitamos una web nueva para la tienda.",
  locale: "es",
  website: "",
  turnstileToken: "token",
};

// Each call gets a random documentation /64 (the limiter counts IPv6 by /64), so the 3-a-minute
// limit of one test never reaches another, nor a retry the attempt before it.
function headers(baseURL: string | undefined, origin = new URL(baseURL ?? "").origin) {
  const ip = `2001:db8:${Math.floor(Math.random() * 0xffff).toString(16)}::1`;
  return { Origin: origin, "CF-Connecting-IP": ip, "Content-Type": "application/json" };
}

test.describe("función de contacto (ADR 0002)", () => {
  test("rechaza otro origen con 403", async ({ request, baseURL }) => {
    const response = await request.post("/api/contact/", {
      headers: headers(baseURL, "https://evil.example"),
      data: body,
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "origin" });
  });

  test("responde 400 con los campos inválidos", async ({ request, baseURL }) => {
    const response = await request.post("/api/contact/", {
      headers: headers(baseURL),
      data: { ...body, email: "ana", projectType: "crypto" },
    });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "invalid", fields: ["email", "projectType"] });
    expect(response.headers()["cache-control"]).toBe("no-store");
  });

  test("finge un éxito al honeypot", async ({ request, baseURL }) => {
    const response = await request.post("/api/contact/", {
      headers: headers(baseURL),
      data: { ...body, website: "https://spam.example" },
    });
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("sin secretos rechaza el envío con 503 (fail-closed)", async ({ request, baseURL }) => {
    const response = await request.post("/api/contact/", { headers: headers(baseURL), data: body });
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
  });

  // Con el binding pero sin secretos (el build de los tests), la comprobación de salud responde 503.
  test("GET responde a la comprobación de salud sin gastar envíos", async ({ request, baseURL }) => {
    const response = await request.get("/api/contact/", { headers: headers(baseURL) });
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({ ok: false, error: "unavailable" });
    expect(response.headers()["cache-control"]).toBe("no-store");
  });

  // UptimeRobot gratis manda HEAD: Astro lo contesta con el handler del GET, con su estado y sin el cuerpo.
  test("HEAD, lo que manda el uptime, responde como el GET sin cuerpo", async ({ request, baseURL }) => {
    const response = await request.head("/api/contact/", { headers: headers(baseURL) });
    expect(response.status()).toBe(503);
    expect(await response.body()).toHaveLength(0);
    expect(response.headers()["cache-control"]).toBe("no-store");
  });

  test("el binding corta en el cuarto envío del mismo IP en un minuto", async ({ request, baseURL }) => {
    const sameIp = headers(baseURL);
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) {
      statuses.push((await request.post("/api/contact/", { headers: sameIp, data: body })).status());
    }
    expect(statuses).toEqual([503, 503, 503, 429]);
  });
});
