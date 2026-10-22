import { describe, expect, it } from "vitest";
import { bookingUrl } from "../../src/lib/board";
import { bookingEmbedSrc, bookingFrameDirective } from "../../src/lib/booking";

describe("bookingEmbedSrc", () => {
  it("pide a Cal.com su página para un iframe, en oscuro y con el mes a la vista", () => {
    const src = new URL(bookingEmbedSrc("https://cal.com/retama/llamada"));
    expect(src.origin + src.pathname).toBe("https://cal.com/retama/llamada");
    expect(Object.fromEntries(src.searchParams)).toEqual({ embed: "true", theme: "dark", layout: "month_view" });
  });

  it("conserva los parámetros que ya traiga la página y no los repite", () => {
    const src = new URL(bookingEmbedSrc("https://cal.com/retama/llamada?duration=30&theme=light"));
    expect(src.searchParams.get("duration")).toBe("30");
    expect(src.searchParams.getAll("theme")).toEqual(["dark"]);
  });
});

describe("bookingFrameDirective (ADR 0006)", () => {
  // Cal.com va en un iframe: la CSP admite el origen de la página de reserva, y solo ese, como marco.
  it("admite como marco el origen de la página de reserva y nada más", () => {
    expect(bookingFrameDirective("https://cal.com/retama/llamada?duration=30")).toBe("frame-src https://cal.com");
  });

  // La página provisional y la definitiva viven en cal.com; otro origen tendría que pasar por la allowlist del ADR.
  it("la página de reserva está en cal.com", () => {
    expect(new URL(bookingUrl).origin).toBe("https://cal.com");
  });
});
