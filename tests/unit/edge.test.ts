import { describe, expect, it } from "vitest";
import { isOnDemand, SECURITY_HEADERS, secure } from "../../src/server/edge";

describe("rutas que el Worker entrega a Astro (ADR 0002, ADR 0011)", () => {
  it.each(["/api/contact/", "/api/report/", "/api/contact", "/api/report"])("%s se renderiza bajo demanda", (path) => {
    expect(isOnDemand(path)).toBe(true);
  });

  // The routes Astro and the adapter inject, and the paths Astro would decode or route to them, stay with the assets.
  it.each([
    "/_image/",
    "/_image",
    "/_server-islands/Team/",
    "/%5Fimage/",
    "/api/%63ontact/",
    "/api/contact%2F",
    "/API/contact/",
    "/api/contact/x/",
    "/api/contact//",
    "/api/",
    "/",
  ])("%s no llega a Astro", (path) => {
    expect(isOnDemand(path)).toBe(false);
  });
});

describe("cabeceras de seguridad de las respuestas del Worker (ADR 0006)", () => {
  it("una respuesta sin cabeceras las recibe todas, con la CSP que no carga nada", async () => {
    const response = secure(new Response('{"ok":true}', { status: 503, statusText: "Service Unavailable" }));
    expect(Object.fromEntries(response.headers)).toMatchObject(
      Object.fromEntries(Object.entries(SECURITY_HEADERS).map(([name, value]) => [name.toLowerCase(), value])),
    );
    expect(response.status).toBe(503);
    expect(response.statusText).toBe("Service Unavailable");
    expect(await response.text()).toBe('{"ok":true}');
  });

  it("las cabeceras que ya trae, como la CSP de página de un asset, se quedan", () => {
    const page = "default-src 'self'; frame-ancestors 'none'";
    const response = secure(
      new Response("<!doctype html>", {
        status: 404,
        headers: { "content-security-policy": page, "Cache-Control": "no-store", "content-type": "text/html" },
      }),
    );
    expect(response.headers.get("Content-Security-Policy")).toBe(page);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
  });

  // Response.redirect gives immutable headers, like a response of fetch or of the assets binding.
  it("también una redirección, cuyas cabeceras no se pueden cambiar", () => {
    const response = secure(Response.redirect("https://retama.dev/api/contact/", 301));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe("https://retama.dev/api/contact/");
    expect(response.headers.get("strict-transport-security")).toBe(SECURITY_HEADERS["Strict-Transport-Security"]);
  });
});
