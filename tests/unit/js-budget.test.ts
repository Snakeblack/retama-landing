import { describe, expect, it } from "vitest";
import { initialScripts } from "../../scripts/lib/js-budget.mjs";

const files: Record<string, string> = {
  "_astro/home.js": 'import{a as b}from"./gsap.js";import"./shared.js";const s=()=>import("./scene.js");',
  "_astro/gsap.js": 'import"./shared.js";export const a=1;',
  "_astro/shared.js": "export {};",
  "_astro/scene.js": 'import"./three.js";',
  "_astro/three.js": "",
};
const read = (path: string) => {
  const file = files[path];
  if (file === undefined) throw new Error(`missing ${path}`);
  return file;
};

describe("initialScripts", () => {
  it("sigue los imports estáticos de cada script de la página, sin repetir ni entrar en los dinámicos", () => {
    const html = `<head><script type="module" src="/_astro/home.js"></script>
      <link rel="modulepreload" href="/_astro/shared.js"></head>`;
    expect(initialScripts(html, read).sort()).toEqual(["_astro/gsap.js", "_astro/home.js", "_astro/shared.js"]);
  });

  it("cuenta los scripts en línea por su texto y sin ninguno devuelve una lista vacía", () => {
    expect(initialScripts("<p>Retama</p>", read)).toEqual([]);
    expect(initialScripts("<script>let a = 1;</script>", read)).toEqual(["<inline>let a = 1;"]);
  });

  it("ignora los datos JSON-LD, que no son JavaScript", () => {
    expect(initialScripts('<script type="application/ld+json">{"@type":"Organization"}</script>', read)).toEqual([]);
  });
});
