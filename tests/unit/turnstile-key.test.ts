import { describe, expect, it } from "vitest";
import { refusedSiteKey, TEST_SITE_KEY } from "../../scripts/lib/turnstile-key.mjs";

describe("refusedSiteKey", () => {
  const real = "0x4AAAAAAFhBi8PjbC1-gViF";

  // Con la clave de pruebas el widget siempre pasa: Workers Builds nunca publica con ella, ni en producción ni en las
  // Previews.
  it("en Workers Builds rechaza un build sin clave de sitio", () => {
    expect(refusedSiteKey({ WORKERS_CI: "1" })).toBe(true);
    expect(refusedSiteKey({ WORKERS_CI: "1", PUBLIC_TURNSTILE_SITE_KEY: " " })).toBe(true);
  });

  it("en Workers Builds rechaza cualquier clave de pruebas de Turnstile", () => {
    for (const key of [
      TEST_SITE_KEY,
      "2x00000000000000000000AB",
      "1x00000000000000000000BB",
      "2x00000000000000000000BB",
      "3x00000000000000000000FF",
      " 1x00000000000000000000AA ",
    ]) {
      expect(refusedSiteKey({ WORKERS_CI: "1", PUBLIC_TURNSTILE_SITE_KEY: key }), key).toBe(true);
    }
  });

  it("en Workers Builds admite la clave de un widget real", () => {
    expect(refusedSiteKey({ WORKERS_CI: "1", PUBLIC_TURNSTILE_SITE_KEY: real })).toBe(false);
  });

  // En local, en GitHub Actions y en el E2E el build sigue con la clave de pruebas.
  it("fuera de Workers Builds no exige nada", () => {
    expect(refusedSiteKey({})).toBe(false);
    expect(refusedSiteKey({ CI: "true", PUBLIC_TURNSTILE_SITE_KEY: TEST_SITE_KEY })).toBe(false);
  });
});
