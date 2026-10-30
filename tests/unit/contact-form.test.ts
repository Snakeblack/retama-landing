import { describe, expect, it } from "vitest";
import { PROJECT_TYPES } from "../../src/lib/contact";
import { failureOf, MAILTO_BODY_MAX, mailtoHref, presetSearch, presetType } from "../../src/lib/contact-form";

describe("presetSearch y presetType", () => {
  it("escriben y leen el tipo de proyecto como lo enviaría un formulario GET con ese campo", () => {
    expect(presetSearch("software")).toBe("?projectType=software");
    for (const type of PROJECT_TYPES) expect(presetType(presetSearch(type))).toBe(type);
  });

  it("leen el tipo entre otros parámetros", () => {
    expect(presetType("?utm_source=x&projectType=seo")).toBe("seo");
  });

  it("no marcan nada con un valor que no es uno de los cinco, sin normalizarlo", () => {
    for (const search of [
      "",
      "?projectType=",
      "?projectType=xyz",
      "?projectType=Software",
      "?projectType=%20web",
      "?tipo=web",
    ])
      expect(presetType(search), search).toBeUndefined();
  });
});

describe("failureOf", () => {
  it("devuelve los campos que el visitante puede corregir cuando la función los rechaza", () => {
    expect(failureOf(400, { ok: false, error: "invalid", fields: ["email", "message"] })).toEqual({
      kind: "invalid",
      fields: ["email", "message"],
    });
  });

  it("trata como fallo del servicio un 400 sin campos que el visitante pueda corregir", () => {
    expect(failureOf(400, { ok: false, error: "invalid", fields: [] })).toEqual({ kind: "unavailable", fields: [] });
    expect(failureOf(400, { ok: false, error: "invalid", fields: ["locale", "turnstileToken"] })).toEqual({
      kind: "unavailable",
      fields: [],
    });
    expect(failureOf(400, { ok: false, error: "invalid", fields: "email" })).toEqual({
      kind: "unavailable",
      fields: [],
    });
  });

  it("distingue la verificación fallida, el exceso de envíos y el resto", () => {
    expect(failureOf(403, { ok: false, error: "verification" }).kind).toBe("verification");
    expect(failureOf(429, { ok: false, error: "rate-limited" }).kind).toBe("rate-limited");
    expect(failureOf(403, { ok: false, error: "origin" }).kind).toBe("unavailable");
    expect(failureOf(502, { ok: false, error: "delivery" }).kind).toBe("unavailable");
    expect(failureOf(503, { ok: false, error: "unavailable" }).kind).toBe("unavailable");
  });

  it("trata como fallo del servicio la red caída y una respuesta que no es JSON", () => {
    expect(failureOf(null, undefined).kind).toBe("unavailable");
    expect(failureOf(500, "<html>")).toEqual({ kind: "unavailable", fields: [] });
  });

  it("trata como fallo del servicio un 429 que no es de la función: el límite diario de Workers (ADR 0012)", () => {
    expect(failureOf(429, undefined)).toEqual({ kind: "unavailable", fields: [] });
    expect(failureOf(429, "<html>")).toEqual({ kind: "unavailable", fields: [] });
    expect(failureOf(429, { ok: false, error: "unavailable" })).toEqual({ kind: "unavailable", fields: [] });
  });
});

describe("mailtoHref", () => {
  const draft = { subject: "Mi proyecto", message: "Hola & adiós?\nSegunda línea", name: "Ana Pérez" };

  it("precarga el asunto y el mensaje firmado, codificados", () => {
    const href = mailtoHref("hola@retama.es", draft);
    expect(href.startsWith("mailto:hola@retama.es?subject=Mi%20proyecto&body=")).toBe(true);
    const body = new URL(href).searchParams.get("body");
    expect(body).toBe("Hola & adiós?\nSegunda línea\n\nAna Pérez");
    expect(href).not.toContain("+");
  });

  it("sin nombre ni mensaje deja solo el asunto", () => {
    expect(mailtoHref("hola@retama.es", { subject: "Mi proyecto", message: " ", name: "" })).toBe(
      "mailto:hola@retama.es?subject=Mi%20proyecto",
    );
  });

  it("recorta un mensaje largo para que el enlace quepa en cualquier cliente de correo", () => {
    const body = new URL(mailtoHref("hola@retama.es", { ...draft, message: "a".repeat(4000) })).searchParams.get(
      "body",
    );
    expect(body?.length).toBeLessThanOrEqual(MAILTO_BODY_MAX);
    expect(body?.endsWith("…\n\nAna Pérez")).toBe(true);
  });
});
