import { describe, expect, it } from "vitest";
import { checkClasses, checkCss, checkSource, parseTokens } from "../../scripts/lib/design-values.mjs";

const tokens = parseTokens(`@theme {
  --color-ink: #eff0f1;
  --color-ground: #18191b;
  --font-display: "Stack Sans Headline";
  --text-body: 17px;
  --leading-body: 1.5;
  --tracking-display: -0.022em;
  --font-weight-body: 400;
  --radius-tile: 0px;
  --spacing-gap: 8px;
  --spacing-content: 768px;
}`);

const values = (findings: { value: string }[]) => findings.map((finding) => finding.value);

describe("parseTokens", () => {
  it("agrupa los tokens del tema por espacio de nombres", () => {
    expect(tokens.color).toEqual(new Set(["ink", "ground"]));
    expect(tokens.text).toEqual(new Set(["body"]));
    expect(tokens.spacing).toEqual(new Set(["gap", "content"]));
    // --font-weight-* is its own namespace, not a font family called "weight-body".
    expect(tokens.font).toEqual(new Set(["display"]));
    expect(tokens["font-weight"]).toEqual(new Set(["body"]));
  });
});

describe("checkClasses", () => {
  it("acepta utilidades que usan tokens, palabras clave y variables", () => {
    const classes =
      "text-ink bg-ground text-body leading-body tracking-display font-display rounded-tile p-gap max-w-(--spacing-content) " +
      "font-(weight:--font-weight-body) text-center text-balance w-full h-auto m-0 basis-1/2 sm:px-gap hover:text-ink grid-cols-12 lang-switch";
    expect(checkClasses(classes, tokens)).toEqual([]);
  });

  it("rechaza la escala por defecto de Tailwind", () => {
    expect(values(checkClasses("text-5xl leading-tight p-4 font-bold rounded-lg tracking-wide", tokens))).toEqual([
      "text-5xl",
      "leading-tight",
      "p-4",
      "font-bold",
      "rounded-lg",
      "tracking-wide",
    ]);
  });

  it("rechaza la paleta por defecto de Tailwind", () => {
    expect(values(checkClasses("bg-slate-900 text-white border-red-500", tokens))).toEqual([
      "bg-slate-900",
      "text-white",
      "border-red-500",
    ]);
  });

  it("rechaza valores arbitrarios literales, también tras variantes", () => {
    expect(values(checkClasses("leading-[1.1] sm:text-[#fff] w-[37px] !mt-[2rem]", tokens))).toEqual([
      "leading-[1.1]",
      "sm:text-[#fff]",
      "w-[37px]",
      "!mt-[2rem]",
    ]);
  });

  it("acepta valores arbitrarios que solo referencian variables", () => {
    expect(checkClasses("w-[var(--spacing-content)] text-[length:var(--text-body)]", tokens)).toEqual([]);
  });
});

describe("checkCss", () => {
  it("acepta declaraciones que usan variables y palabras clave", () => {
    const css = `body { background-color: var(--color-ground); color: var(--color-ink); line-height: var(--leading-body); margin: 0; }
      a { color: inherit; border-color: transparent; width: 100%; }`;
    expect(checkCss(css)).toEqual([]);
  });

  it("rechaza colores sueltos en cualquier formato", () => {
    const css = `a { color: #fff; background: rgb(0 0 0); border-color: oklch(70% 0.1 30); outline-color: white; }`;
    expect(values(checkCss(css))).toEqual(["#fff", "rgb(0 0 0)", "oklch(70% 0.1 30)", "white"]);
  });

  it("rechaza longitudes y valores tipográficos sueltos", () => {
    const css = `p { padding: 12px 0; font-size: 1.25rem; line-height: 1.5; font-weight: 700; letter-spacing: 0.1em; }`;
    expect(values(checkCss(css))).toEqual(["12px", "1.25rem", "1.5", "700", "0.1em"]);
  });

  it("rechaza propiedades personalizadas con valores sueltos fuera del tema", () => {
    expect(values(checkCss(":root { --gap: 13px; }"))).toEqual(["13px"]);
  });

  it("ignora los preludios de las at-rules y los comentarios", () => {
    const css = `/* color: #000 */ @media (min-width: 48rem) { a { color: var(--color-ink); } }`;
    expect(checkCss(css)).toEqual([]);
  });

  it("indica la línea de cada hallazgo", () => {
    expect(checkCss("a {\n  color: var(--color-ink);\n  padding: 3px;\n}")[0]?.line).toBe(3);
  });
});

describe("checkSource", () => {
  it("revisa las clases y los bloques <style> de un componente Astro", () => {
    const astro = `---\nconst a = 1;\n---\n<h1 class="text-5xl text-ink">Hola</h1>\n<style>\n  h1 { color: #f00; }\n</style>\n`;
    expect(checkSource("x.astro", astro, tokens)).toEqual([
      { line: 4, value: "text-5xl", message: expect.any(String) },
      { line: 6, value: "#f00", message: expect.any(String) },
    ]);
  });
});
