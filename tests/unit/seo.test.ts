import { describe, expect, it } from "vitest";
import { alternates, canonicalUrl } from "../../src/lib/seo";

const site = new URL("https://retama.example/");

describe("canonicalUrl", () => {
  it("es absoluta, del propio idioma y con barra final", () => {
    expect(canonicalUrl(site, "/")).toBe("https://retama.example/");
    expect(canonicalUrl(site, "/en/")).toBe("https://retama.example/en/");
    expect(canonicalUrl(site, "/en/servicios")).toBe("https://retama.example/en/servicios/");
  });

  it("descarta query y fragmento", () => {
    expect(canonicalUrl(site, "/en/?utm_source=x#hero")).toBe("https://retama.example/en/");
  });
});

describe("alternates", () => {
  it("declara todos los idiomas y x-default apuntando al idioma por defecto", () => {
    expect(alternates(site, "/")).toEqual([
      { hreflang: "es", href: "https://retama.example/" },
      { hreflang: "en", href: "https://retama.example/en/" },
      { hreflang: "x-default", href: "https://retama.example/" },
    ]);
  });

  it("son recíprocos: la misma lista desde cualquier idioma de la página", () => {
    expect(alternates(site, "/en/servicios/")).toEqual(alternates(site, "/servicios/"));
  });
});
