import { describe, expect, it } from "vitest";
import {
  type ArticleEntry,
  articlePath,
  checkArticles,
  entryLocale,
  entrySlug,
  formatDate,
  newestFirst,
  readingMinutes,
  translations,
} from "../../src/lib/blog";

const entry = (id: string, data: Partial<ArticleEntry["data"]> = {}, body = "Texto."): ArticleEntry => ({
  id,
  body,
  data: {
    key: "costs",
    title: "Cuánto cuesta un software a medida",
    description: "Entradilla.",
    published: new Date("2026-10-23"),
    ...data,
  },
});

describe("entryLocale y entrySlug", () => {
  it("leen el idioma de la carpeta y el slug del archivo", () => {
    expect(entryLocale("es/cuanto-cuesta")).toBe("es");
    expect(entryLocale("en/what-it-costs")).toBe("en");
    expect(entrySlug("en/what-it-costs")).toBe("what-it-costs");
  });

  it("rechazan un artículo fuera de una carpeta de idioma", () => {
    expect(() => entryLocale("fr/combien")).toThrow(/fr\/combien/);
    expect(() => entryLocale("suelto")).toThrow(/suelto/);
  });
});

describe("articlePath", () => {
  it("pone el índice y cada artículo bajo /blog/ del idioma, con barra final", () => {
    expect(articlePath("es")).toBe("/blog/");
    expect(articlePath("en")).toBe("/en/blog/");
    expect(articlePath("es", "cuanto-cuesta")).toBe("/blog/cuanto-cuesta/");
    expect(articlePath("en", "what-it-costs")).toBe("/en/blog/what-it-costs/");
  });
});

describe("checkArticles (ADR 0008)", () => {
  it("empareja las traducciones de cada artículo por su clave", () => {
    const es = entry("es/cuanto-cuesta");
    const en = entry("en/what-it-costs", { title: "What custom software costs" });
    const groups = checkArticles([es, en]);
    expect([...groups.keys()]).toEqual(["costs"]);
    expect(groups.get("costs")).toEqual({ es, en });
  });

  it("hace fallar el build si a un artículo le falta un idioma", () => {
    expect(() => checkArticles([entry("es/cuanto-cuesta")])).toThrow(/costs.*en/);
  });

  it("no admite dos artículos con la misma clave en un idioma", () => {
    expect(() => checkArticles([entry("es/uno"), entry("es/dos"), entry("en/one")])).toThrow(/costs.*es/);
  });

  it("no admite código en el cuerpo: ni bloques ni código en línea (DESIGN.md, ADR 0006)", () => {
    const fenced = "Antes.\n\n```js\nlet a = 1;\n```\n";
    expect(() => checkArticles([entry("es/a", {}, fenced), entry("en/a")])).toThrow(/es\/a.*código/);
    expect(() => checkArticles([entry("es/a"), entry("en/a", {}, "Use `npm`.")])).toThrow(/en\/a/);
    expect(() => checkArticles([entry("es/a", {}, "~~~\nx\n~~~"), entry("en/a")])).toThrow(/es\/a/);
  });

  it("no admite un título de más de 40 caracteres, que pasaría de dos líneas en el móvil", () => {
    const long = "Un título demasiado largo para caber en dos líneas";
    expect(() => checkArticles([entry("es/a", { title: long }), entry("en/a")])).toThrow(/es\/a.*40/);
    expect(() => checkArticles([entry("es/a", { title: "x".repeat(40) }), entry("en/a")])).not.toThrow();
  });

  it("no admite una actualización anterior a la publicación", () => {
    const updated = new Date("2026-10-01");
    expect(() => checkArticles([entry("es/a", { updated }), entry("en/a")])).toThrow(/es\/a/);
  });

  it("lista todos los problemas a la vez", () => {
    expect(() => checkArticles([entry("es/a", { key: "a" }), entry("en/b", { key: "b" })])).toThrow(
      /a.*en[\s\S]*b.*es/,
    );
  });
});

describe("translations", () => {
  it("da la ruta del artículo en cada idioma", () => {
    expect(translations({ es: entry("es/cuanto-cuesta"), en: entry("en/what-it-costs") })).toEqual({
      es: "/blog/cuanto-cuesta/",
      en: "/en/blog/what-it-costs/",
    });
  });
});

describe("newestFirst", () => {
  it("ordena del más reciente al más antiguo y, a igual fecha, por título", () => {
    const old = entry("es/a", { published: new Date("2026-01-01"), title: "A" });
    const b = entry("es/b", { published: new Date("2026-10-23"), title: "B" });
    const c = entry("es/c", { published: new Date("2026-10-23"), title: "C" });
    expect(newestFirst([old, c, b]).map((item) => item.id)).toEqual(["es/b", "es/c", "es/a"]);
  });

  it("no cambia la lista que recibe", () => {
    const list = [entry("es/a", { published: new Date("2026-01-01") }), entry("es/b")];
    newestFirst(list);
    expect(list.map((item) => item.id)).toEqual(["es/a", "es/b"]);
  });
});

describe("readingMinutes", () => {
  it("cuenta 200 palabras por minuto, redondeando hacia arriba", () => {
    expect(readingMinutes(Array(200).fill("palabra").join(" "))).toBe(1);
    expect(readingMinutes(Array(201).fill("palabra").join(" "))).toBe(2);
    expect(readingMinutes(Array(1000).fill("palabra").join("\n"))).toBe(5);
  });

  it("es al menos un minuto y no cuenta la sintaxis de Markdown como palabras", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("## Título\n\n- uno\n- dos\n\n> cita")).toBe(1);
    expect(readingMinutes(`${Array(200).fill("palabra").join(" ")}\n\n## ---\n\n- *`)).toBe(1);
  });
});

describe("formatDate", () => {
  it("escribe la fecha larga en el idioma de la página, sin depender de la zona horaria", () => {
    expect(formatDate("es", new Date("2026-10-23"))).toBe("23 de octubre de 2026");
    expect(formatDate("en", new Date("2026-10-23"))).toBe("October 23, 2026");
    expect(formatDate("es", new Date("2026-01-01T00:00:00Z"))).toBe("1 de enero de 2026");
  });
});
