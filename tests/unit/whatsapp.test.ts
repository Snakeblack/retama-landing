import { describe, expect, it } from "vitest";
import { whatsapp } from "../../src/lib/board";

describe("whatsapp", () => {
  it("enlaza a wa.me con el número internacional y lo muestra en grupos de tres", () => {
    expect(whatsapp("34600000000")).toEqual({ href: "https://wa.me/34600000000", label: "+34 600 000 000" });
  });

  it("acepta el número como se escribe a mano, con + y espacios", () => {
    expect(whatsapp("+34 600 00 00 00")).toEqual(whatsapp("34600000000"));
  });

  // Sin número no hay WhatsApp: la página nunca publica uno inventado.
  it("no da WhatsApp sin número", () => {
    expect(whatsapp(undefined)).toBeNull();
    expect(whatsapp("")).toBeNull();
    expect(whatsapp(" + ")).toBeNull();
  });
});
