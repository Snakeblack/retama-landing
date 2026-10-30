import { describe, expect, it } from "vitest";
import { pagePaths, redirectsFile } from "../../scripts/lib/redirects.mjs";

describe("pagePaths", () => {
  it("da la ruta de cada página del build, y nada más", () => {
    expect(
      pagePaths([
        "index.html",
        "blog/index.html",
        "blog/cuanto-cuesta/index.html",
        "en/index.html",
        "en/404.html",
        "404.html",
        "og/es.png",
        "blog/rss.xml",
        "_headers",
      ]),
    ).toEqual(["/", "/blog/", "/blog/cuanto-cuesta/", "/en/"]);
  });
});

describe("redirectsFile", () => {
  it("lleva con un 301 cada página sin su barra final a su ruta con ella, salvo la raíz", () => {
    expect(redirectsFile(["/", "/blog/", "/en/services/custom-software/"])).toBe(
      "/blog /blog/ 301\n/en/services/custom-software /en/services/custom-software/ 301\n",
    );
  });

  it("no escribe nada sin páginas", () => {
    expect(redirectsFile(["/"])).toBe("");
  });
});
