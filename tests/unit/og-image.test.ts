import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ogCard, ogImage, themeTokens } from "../../scripts/lib/og-image.mjs";
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
