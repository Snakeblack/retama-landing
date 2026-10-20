import { describe, expect, it } from "vitest";
import { extractMetaCsp, mergePolicies, serializePolicy } from "../../scripts/lib/csp.mjs";

describe("extractMetaCsp", () => {
  it("lee la política de la meta http-equiv que emite Astro", () => {
    const html = `<head><meta http-equiv="content-security-policy" content="default-src 'self'; script-src 'self' 'sha256-a=';"></head>`;
    expect(extractMetaCsp(html)).toBe("default-src 'self'; script-src 'self' 'sha256-a=';");
  });

  it("devuelve null si la página no tiene CSP", () => {
    expect(extractMetaCsp("<head><title>x</title></head>")).toBeNull();
  });
});

describe("mergePolicies", () => {
  it("une las fuentes de cada directiva sin duplicados y en orden de aparición", () => {
    const merged = mergePolicies([
      "default-src 'self'; script-src 'self' 'sha256-a=';",
      "default-src 'self';script-src 'self' 'sha256-b='; style-src 'self' 'sha256-c=';",
    ]);
    expect(serializePolicy(merged)).toBe(
      "default-src 'self'; script-src 'self' 'sha256-a=' 'sha256-b='; style-src 'self' 'sha256-c='",
    );
  });

  it("añade las directivas que solo pueden ir en cabecera", () => {
    const merged = mergePolicies(["default-src 'self'"], ["frame-ancestors 'none'"]);
    expect(serializePolicy(merged)).toBe("default-src 'self'; frame-ancestors 'none'");
  });

  it("rechaza fuentes inseguras (ADR 0006)", () => {
    expect(() => mergePolicies(["script-src 'self' 'unsafe-inline'"])).toThrow(/unsafe-inline/);
    expect(() => mergePolicies(["script-src 'unsafe-eval'"])).toThrow(/unsafe-eval/);
  });

  it("falla si no hay ninguna política: el build no puede salir sin CSP", () => {
    expect(() => mergePolicies([])).toThrow(/no CSP/);
  });
});
