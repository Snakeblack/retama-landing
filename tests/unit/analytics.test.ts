import { describe, expect, it } from "vitest";
import { analyticsToken, BEACON_SRC, beaconConfig, beaconCsp, loadBeacon } from "../../src/lib/analytics";

describe("analyticsToken", () => {
  it("devuelve el token sin espacios alrededor", () => {
    expect(analyticsToken("  0123456789abcdef0123456789abcdef\n")).toBe("0123456789abcdef0123456789abcdef");
  });

  it("sin token, o con uno vacío, no hay medición", () => {
    expect(analyticsToken(undefined)).toBeNull();
    expect(analyticsToken("")).toBeNull();
    expect(analyticsToken("   ")).toBeNull();
  });
});

describe("beaconConfig", () => {
  it("da al beacon el token como JSON, y nada más", () => {
    expect(JSON.parse(beaconConfig("abc"))).toEqual({ token: "abc" });
  });
});

describe("beaconCsp (ADR 0006)", () => {
  it("admite solo el origen del script y el del envío de las medidas", () => {
    expect(beaconCsp()).toEqual({
      script: "https://static.cloudflareinsights.com",
      connect: "connect-src https://cloudflareinsights.com",
    });
  });
});

// A document double: its load state, the load listener it receives and the scripts appended to its body.
function fakeDocument(readyState: DocumentReadyState) {
  const appended: Record<string, unknown>[] = [];
  let onLoad: (() => void) | undefined;
  const doc = {
    readyState,
    createElement: () => ({ dataset: {} }),
    body: { append: (node: Record<string, unknown>) => appended.push(node) },
    defaultView: {
      addEventListener: (type: string, listener: () => void, options: AddEventListenerOptions) => {
        expect(type).toBe("load");
        expect(options).toEqual({ once: true });
        onLoad = listener;
      },
    },
  };
  return { doc: doc as unknown as Document, appended, load: () => onLoad?.() };
}

describe("loadBeacon (ADR 0001)", () => {
  it("espera al evento load para añadir el beacon, así que no entra en el JavaScript de inicio", () => {
    const { doc, appended, load } = fakeDocument("interactive");
    loadBeacon(doc, "abc");
    expect(appended).toEqual([]);
    load();
    expect(appended).toEqual([{ defer: true, src: BEACON_SRC, dataset: { cfBeacon: '{"token":"abc"}' } }]);
  });

  it("si la página ya ha cargado, lo añade en el momento", () => {
    const { doc, appended } = fakeDocument("complete");
    loadBeacon(doc, "abc");
    expect(appended).toHaveLength(1);
  });
});
