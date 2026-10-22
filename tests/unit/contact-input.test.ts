import { describe, expect, it } from "vitest";
import { LIMITS, parseContact } from "../../src/lib/contact";

const valid = {
  name: "Ana Pérez",
  email: "ana@example.com",
  projectType: "web",
  message: "Necesitamos una web nueva para la tienda.",
  locale: "es",
  website: "",
  turnstileToken: "token",
};

function fieldsOf(input: unknown): string[] {
  const result = parseContact(input);
  return result.ok ? [] : result.fields;
}

describe("parseContact", () => {
  it("acepta un envío completo y recorta los espacios de los extremos", () => {
    const result = parseContact({ ...valid, name: "  Ana Pérez ", email: " Ana@Example.com " });
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Ana Pérez",
        email: "Ana@Example.com",
        projectType: "web",
        message: "Necesitamos una web nueva para la tienda.",
        locale: "es",
        website: "",
        turnstileToken: "token",
      },
    });
  });

  it("no pasa el email a minúsculas", () => {
    const result = parseContact({ ...valid, email: "Ana@Example.com" });
    expect(result.ok && result.value.email).toBe("Ana@Example.com");
  });

  it("exige nombre, email, tipo de proyecto, mensaje e idioma", () => {
    expect(fieldsOf({})).toEqual(["name", "email", "projectType", "message", "locale"]);
    expect(fieldsOf({ ...valid, name: "   " })).toEqual(["name"]);
  });

  it("limita la longitud de cada campo", () => {
    expect(fieldsOf({ ...valid, name: "a".repeat(LIMITS.name) })).toEqual([]);
    expect(fieldsOf({ ...valid, name: "a".repeat(LIMITS.name + 1) })).toEqual(["name"]);
    const local = "a".repeat(LIMITS.email - "@example.com".length);
    expect(fieldsOf({ ...valid, email: `${local}@example.com` })).toEqual([]);
    expect(fieldsOf({ ...valid, email: `a${local}@example.com` })).toEqual(["email"]);
    expect(fieldsOf({ ...valid, message: "a".repeat(LIMITS.messageMin - 1) })).toEqual(["message"]);
    expect(fieldsOf({ ...valid, message: "a".repeat(LIMITS.messageMin) })).toEqual([]);
    expect(fieldsOf({ ...valid, message: "a".repeat(LIMITS.messageMax) })).toEqual([]);
    expect(fieldsOf({ ...valid, message: "a".repeat(LIMITS.messageMax + 1) })).toEqual(["message"]);
  });

  it("cuenta el mensaje sin los espacios de los extremos", () => {
    expect(fieldsOf({ ...valid, message: `   ${"a".repeat(LIMITS.messageMin - 1)}   ` })).toEqual(["message"]);
  });

  it("rechaza un email sin forma de dirección", () => {
    for (const email of ["ana", "ana@", "@example.com", "ana@example", "ana @example.com", "ana@exa mple.com"]) {
      expect(fieldsOf({ ...valid, email })).toEqual(["email"]);
    }
  });

  it("solo admite los tipos de proyecto de la lista", () => {
    for (const projectType of ["web", "software", "agents", "seo", "other"]) {
      expect(fieldsOf({ ...valid, projectType })).toEqual([]);
    }
    expect(fieldsOf({ ...valid, projectType: "Web" })).toEqual(["projectType"]);
    expect(fieldsOf({ ...valid, projectType: "crypto" })).toEqual(["projectType"]);
  });

  it("solo admite los idiomas del sitio", () => {
    expect(fieldsOf({ ...valid, locale: "en" })).toEqual([]);
    expect(fieldsOf({ ...valid, locale: "fr" })).toEqual(["locale"]);
  });

  it("rechaza campos que no son texto", () => {
    expect(fieldsOf({ ...valid, name: 42, message: ["hola, ¿qué tal estás?"] })).toEqual(["name", "message"]);
    expect(fieldsOf({ ...valid, website: 1, turnstileToken: {} })).toEqual(["website", "turnstileToken"]);
  });

  it("deja el honeypot y el token como opcionales", () => {
    const { website: _website, turnstileToken: _token, ...rest } = valid;
    const result = parseContact(rest);
    expect(result.ok && [result.value.website, result.value.turnstileToken]).toEqual(["", ""]);
  });

  it("rechaza un cuerpo que no es un objeto", () => {
    for (const input of [null, "texto", 3, ["name"]]) {
      expect(parseContact(input)).toEqual({ ok: false, fields: [] });
    }
  });
});
