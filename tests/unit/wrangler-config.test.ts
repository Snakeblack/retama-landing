import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// wrangler.jsonc only has whole-line comments, so dropping them leaves plain JSON.
const config = JSON.parse(
  readFileSync(new URL("../../wrangler.jsonc", import.meta.url), "utf8").replace(/^\s*\/\/.*$/gm, ""),
);

type RateLimit = { name: string; namespace_id: string; simple: { limit: number; period: number } };

const limiter = (ratelimits?: RateLimit[]) => ratelimits?.find(({ name }) => name === "CONTACT_LIMITER");

describe("límite de envíos en las Previews (ADR 0002)", () => {
  // Las Previews no heredan los bindings de producción: sin el suyo, /api/contact/ responde siempre 503.
  it("cada Preview tiene su CONTACT_LIMITER con el mismo límite que producción", () => {
    expect(limiter(config.previews?.ratelimits)?.simple).toEqual(limiter(config.ratelimits)?.simple);
  });

  it("las Previews cuentan los envíos aparte de producción", () => {
    const preview = limiter(config.previews?.ratelimits);
    expect(preview?.namespace_id).toBeDefined();
    expect(preview?.namespace_id).not.toBe(limiter(config.ratelimits)?.namespace_id);
  });
});
