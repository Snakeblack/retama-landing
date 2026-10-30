import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ogCard, ogImage, ogPageCard, ogPageImage, ownImages, themeTokens } from "../../scripts/lib/og-image.mjs";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";

const theme = themeTokens(readFileSync("src/styles/theme.css", "utf8"));

describe("themeTokens", () => {
  it("lee las custom properties del tema generado", () => {
    expect(themeTokens("--color-surface: #18191b;\n  --color-primary: #ff4a1f;\n  --spacing-bar: 6px;\n")).toEqual({
      "color-surface": "#18191b",
      "color-primary": "#ff4a1f",
      "spacing-bar": "6px",
    });
  });
});

// The texts of a card, in the order they are drawn.
function texts(node: unknown): string[] {
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  const children = (node as { props?: { children?: unknown } } | null)?.props?.children;
  return children === undefined ? [] : texts(children);
}

describe("ogCard", () => {
  it("lleva el título a dos tonos y la frase del hero de su idioma", () => {
    expect(texts(ogCard(es, theme))).toEqual([es["hero.word"], es["hero.rest"], es["hero.lead"]]);
    expect(texts(ogCard(en, theme))).toEqual([en["hero.word"], en["hero.rest"], en["hero.lead"]]);
  });
});

describe("ogImage", () => {
  it("dibuja un PNG de 1200×630", async () => {
    const png = await ogImage(es, theme);
    const meta = await sharp(png).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["png", 1200, 630]);
  });

  it("dibuja una imagen distinta por idioma", async () => {
    const [spanish, english] = await Promise.all([ogImage(es, theme), ogImage(en, theme)]);
    expect(spanish.equals(english)).toBe(false);
  });
});

describe("ogPageCard", () => {
  it("lleva en gris qué es la página sobre su título, sin la frase del hero", () => {
    expect(texts(ogPageCard(es["nav.blog"], "Cuánto cuesta un software a medida", theme))).toEqual([
      es["nav.blog"],
      "Cuánto cuesta un software a medida",
    ]);
    expect(texts(ogPageCard(es["nav.services"], es["services.custom"], theme))).toEqual([
      es["nav.services"],
      es["services.custom"],
    ]);
  });
});

describe("ogPageImage", () => {
  it("dibuja un PNG de 1200×630", async () => {
    const meta = await sharp(await ogPageImage(en["nav.blog"], "What custom software costs", theme)).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["png", 1200, 630]);
  });
});

describe("ownImages", () => {
  const page = (graph: unknown[], lang = "es") =>
    `<html lang="${lang}"><head><script type="application/ld+json">${JSON.stringify({ "@graph": graph }).replace(/</g, "\\u003c")}</script></head></html>`;

  it("lee de una página el titular, el idioma y la imagen de su BlogPosting", () => {
    const html = page([
      { "@type": "WebSite" },
      { "@type": "BlogPosting", headline: "A <b>", inLanguage: "es", image: "https://retama.example/og/es/a.png" },
    ]);
    expect(ownImages(html)).toEqual([
      { type: "BlogPosting", title: "A <b>", locale: "es", image: "https://retama.example/og/es/a.png" },
    ]);
  });

  it("lee de una página de servicio el nombre y la imagen de su Service, con el idioma de la página", () => {
    const html = page(
      [
        { "@type": ["Organization", "ProfessionalService"], name: "Retama" },
        {
          "@type": "Service",
          name: "Custom software",
          image: "https://retama.example/og/en/services/custom-software.png",
        },
      ],
      "en",
    );
    expect(ownImages(html)).toEqual([
      {
        type: "Service",
        title: "Custom software",
        locale: "en",
        image: "https://retama.example/og/en/services/custom-software.png",
      },
    ]);
  });

  it("no encuentra nada en una página sin artículo, sin servicio o sin JSON-LD", () => {
    expect(ownImages(page([{ "@type": "WebSite" }]))).toEqual([]);
    expect(ownImages("<html></html>")).toEqual([]);
  });
});
