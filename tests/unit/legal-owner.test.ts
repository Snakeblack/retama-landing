import { describe, expect, it } from "vitest";
import { missingOwner } from "../../scripts/lib/legal-owner.mjs";
import { owner } from "../../src/lib/board";

describe("owner", () => {
  it("da el titular con su nombre y su municipio, sin NIF ni domicilio si no los hay", () => {
    expect(owner({ name: "Ana Pérez", town: "Fuenlabrada (Madrid)" })).toEqual({
      name: "Ana Pérez",
      town: "Fuenlabrada (Madrid)",
      nif: null,
      address: null,
    });
  });

  it("añade el NIF y el domicilio cuando existen, sin espacios sobrantes", () => {
    expect(
      owner({ name: " Ana Pérez ", town: "Fuenlabrada (Madrid)", nif: " 00000000T ", address: " Calle Falsa 1 " }),
    ).toEqual({ name: "Ana Pérez", town: "Fuenlabrada (Madrid)", nif: "00000000T", address: "Calle Falsa 1" });
  });

  it("trata un NIF o un domicilio vacíos como ausentes", () => {
    expect(owner({ name: "Ana Pérez", town: "Fuenlabrada (Madrid)", nif: " ", address: "" })).toMatchObject({
      nif: null,
      address: null,
    });
  });

  // Sin nombre o sin municipio no hay titular: la página nunca publica uno a medias ni inventado.
  it("no da titular sin nombre o sin municipio", () => {
    expect(owner({})).toBeNull();
    expect(owner({ name: "Ana Pérez" })).toBeNull();
    expect(owner({ town: "Fuenlabrada (Madrid)" })).toBeNull();
    expect(owner({ name: " ", town: "Fuenlabrada (Madrid)" })).toBeNull();
  });
});

describe("missingOwner", () => {
  const complete = { PUBLIC_LEGAL_NAME: "Ana Pérez", PUBLIC_LEGAL_TOWN: "Fuenlabrada (Madrid)" };

  it("en Workers Builds exige el nombre y el municipio del titular", () => {
    expect(missingOwner({ WORKERS_CI: "1" })).toEqual(["PUBLIC_LEGAL_NAME", "PUBLIC_LEGAL_TOWN"]);
    expect(missingOwner({ WORKERS_CI: "1", PUBLIC_LEGAL_NAME: "Ana Pérez", PUBLIC_LEGAL_TOWN: " " })).toEqual([
      "PUBLIC_LEGAL_TOWN",
    ]);
  });

  it("en Workers Builds no pide nada más cuando están, ni el NIF ni el domicilio", () => {
    expect(missingOwner({ WORKERS_CI: "1", ...complete })).toEqual([]);
  });

  // En local y en GitHub Actions el build sigue sin titular; el E2E pone uno de prueba.
  it("fuera de Workers Builds no exige nada", () => {
    expect(missingOwner({})).toEqual([]);
    expect(missingOwner({ CI: "true" })).toEqual([]);
  });
});
