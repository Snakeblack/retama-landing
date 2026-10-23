import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en";
import { es } from "../../src/i18n/es";
import { feedOptions } from "../../src/lib/feed";

const site = new URL("https://retama.example/");
const items = [
  {
    locale: "en" as const,
    title: "What it costs",
    description: "What drives it.",
    published: new Date("2026-10-23"),
    path: "/en/blog/what-it-costs/",
  },
];

describe("feedOptions", () => {
  it("describe el blog de su idioma, con el índice como enlace del canal", () => {
    const feed = feedOptions(site, "en", items);
    expect(feed).toMatchObject({
      title: en["blog.metaTitle"],
      description: en["blog.metaDescription"],
      site: "https://retama.example/en/blog/",
    });
    expect(feedOptions(site, "es", []).title).toBe(es["blog.metaTitle"]);
  });

  it("declara su idioma y su propia dirección, como piden los validadores de RSS", () => {
    const feed = feedOptions(site, "en", items);
    expect(feed.xmlns).toEqual({ atom: "http://www.w3.org/2005/Atom" });
    expect(feed.customData).toBe(
      '<language>en</language><atom:link href="https://retama.example/en/blog/rss.xml" rel="self" type="application/rss+xml"/>',
    );
  });

  it("da de cada artículo el título, la entradilla, la fecha y su URL absoluta, sin el texto completo", () => {
    expect(feedOptions(site, "en", items).items).toEqual([
      {
        title: "What it costs",
        description: "What drives it.",
        pubDate: new Date("2026-10-23"),
        link: "https://retama.example/en/blog/what-it-costs/",
      },
    ]);
  });
});
