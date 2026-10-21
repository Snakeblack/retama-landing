import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const config = JSON.parse(readFileSync(new URL("../../release-please-config.json", import.meta.url), "utf8"));

describe("versionado de release-please (ADR 0009)", () => {
  it("en 0.x un feat sube el minor; el patch queda solo para los fix", () => {
    // release-please baja feat a patch antes de 1.0 si esta opción está activa.
    expect(config["bump-patch-for-minor-pre-major"] ?? false).toBe(false);
  });
});
