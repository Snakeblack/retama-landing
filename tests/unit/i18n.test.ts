import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { defaultLocale, localeFromPath, locales, localizedPath, pathWithoutLocale } from "../../src/i18n/index";

describe("diccionarios", () => {
  it("tienen exactamente las mismas claves en todos los idiomas (ADR 0008)", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it("no tienen textos vacíos", () => {
    for (const dict of [es, en]) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim(), key).not.toBe("");
      }
    }
  });
});

describe("rutas por idioma", () => {
  it("el idioma por defecto es es y va sin prefijo", () => {
    expect(defaultLocale).toBe("es");
    expect(locales).toEqual(["es", "en"]);
    expect(localizedPath("es", "/")).toBe("/");
    expect(localizedPath("es", "/servicios/")).toBe("/servicios/");
  });

  it("los demás idiomas van bajo su prefijo y con barra final", () => {
    expect(localizedPath("en", "/")).toBe("/en/");
    expect(localizedPath("en", "/servicios/")).toBe("/en/servicios/");
    expect(localizedPath("en", "servicios")).toBe("/en/servicios/");
  });

  it("detecta el idioma de una ruta", () => {
    expect(localeFromPath("/")).toBe("es");
    expect(localeFromPath("/en/")).toBe("en");
    expect(localeFromPath("/en")).toBe("en");
    expect(localeFromPath("/en/servicios/")).toBe("en");
    expect(localeFromPath("/enlaces/")).toBe("es");
  });

  it("quita el prefijo de idioma y conserva la página equivalente", () => {
    expect(pathWithoutLocale("/")).toBe("/");
    expect(pathWithoutLocale("/en/")).toBe("/");
    expect(pathWithoutLocale("/en")).toBe("/");
    expect(pathWithoutLocale("/en/servicios/")).toBe("/servicios/");
    expect(pathWithoutLocale("/enlaces/")).toBe("/enlaces/");
  });
});
