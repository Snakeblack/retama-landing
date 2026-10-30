// The Open Graph image of each language (DESIGN.md, Imagery): the home's first chapter in small, drawn at build time
// by scripts/postbuild.mjs. Satori sets the text in Stack Sans as outlines and sharp turns the SVG into a PNG, in Node:
// the adapter prerenders in workerd, where sharp does not run.
import { readFileSync } from "node:fs";
import satori from "satori";
import sharp from "sharp";
import { HERO, retamaShape, strokePath } from "../../src/lib/retama-shape.ts";

export const WIDTH = 1200;
export const HEIGHT = 630;

const read = (path) => readFileSync(new URL(path, import.meta.url));
// Satori reads no woff2, so the static 300 of the same face comes from @fontsource (the site ships the variable one).
const headline = read(
  "../../node_modules/@fontsource/stack-sans-headline/files/stack-sans-headline-latin-300-normal.woff",
);
// The wordmark's outlines, from the component the header draws.
const wordmarkPath = read("../../src/components/Wordmark.astro")
  .toString()
  .match(/<path d="([^"]+)"/)?.[1];

/** The custom properties of the generated theme (src/styles/theme.css), by name without the dashes. */
export function themeTokens(css) {
  return Object.fromEntries(
    [...css.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  );
}

const svg = (content) => `data:image/svg+xml;base64,${Buffer.from(content).toString("base64")}`;

// The poster's retama, crown and upper roots, standing on the right edge low enough that only its stem tips reach the
// title. Strokes are 1.5px in image pixels, a little over the poster's so they hold in a thumbnail: muted roots, ink
// stems and the taproot in primary.
const plantView = { x: 300, width: 1000, height: HERO.crop };
const plantHeight = 560;
const plantWidth = Math.round((plantView.width / plantView.height) * plantHeight);

function plant(theme) {
  const shape = retamaShape(HERO.seed, HERO.frame, HERO.stems, HERO.roots);
  const unit = plantView.height / plantHeight;
  const stroke = (kind, colour, width) =>
    `<path d="${strokePath(shape, kind)}" fill="none" stroke="${colour}" stroke-width="${width * unit}" stroke-linecap="round"/>`;
  return svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${plantView.x} 0 ${plantView.width} ${plantView.height}">` +
      stroke("root", theme["color-on-surface-muted"], 1.5) +
      stroke("stem", theme["color-on-surface"], 1.5) +
      stroke("taproot", theme["color-primary"], 3) +
      "</svg>",
  );
}

function wordmark(theme) {
  return svg(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3391 716"><path fill="${theme["color-on-surface"]}" d="${wordmarkPath}"/></svg>`,
  );
}

const px = (value) => Number.parseFloat(value);
const el = (type, style, children) => ({ type, props: { style, children } });

// Each type level as Satori style, from the theme.
const typeStyle = (theme, level) => ({
  fontFamily: "Stack Sans Headline",
  fontWeight: 300,
  fontSize: px(theme[`text-${level}`]),
  lineHeight: Number(theme[`leading-${level}`]),
  letterSpacing: `${theme[`tracking-${level}`]}`,
});

/** The frame both cards share: the graphite ground with the retama on the right edge, the bar across the top, the
 * wordmark at the top left and the card's text at the bottom left. */
function frame(theme, text) {
  const wordmarkSize = 44;
  return el(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      position: "relative",
      width: WIDTH,
      height: HEIGHT,
      backgroundColor: theme["color-surface"],
      color: theme["color-on-surface"],
    },
    [
      {
        type: "img",
        props: {
          src: plant(theme),
          width: plantWidth,
          height: plantHeight,
          style: { position: "absolute", right: -190, bottom: 0 },
        },
      },
      el("div", { display: "flex", height: px(theme["spacing-bar"]), backgroundColor: theme["color-primary"] }, []),
      el(
        "div",
        {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexGrow: 1,
          padding: px(theme["spacing-xl"]),
        },
        [
          {
            type: "img",
            props: { src: wordmark(theme), width: wordmarkSize * 3.391, height: wordmarkSize * 0.716 },
          },
          el("div", { display: "flex", flexDirection: "column" }, text),
        ],
      ),
    ],
  );
}

/** The card of a language as Satori elements: the two-tone title and the lead over the retama. */
export function ogCard(copy, theme) {
  return frame(theme, [
    el("div", { ...typeStyle(theme, "display"), marginLeft: -px(theme["spacing-xs"]) }, copy["hero.word"]),
    el("div", { ...typeStyle(theme, "headline"), color: theme["color-primary"] }, copy["hero.rest"]),
    el(
      "div",
      {
        ...typeStyle(theme, "statement"),
        maxWidth: px(theme["spacing-measure"]),
        textWrap: "balance",
        marginTop: px(theme["spacing-lg"]),
      },
      copy["hero.lead"],
    ),
  ]);
}

/** The card of a page with an image of its own, in muted ink what it is over its title at headline size, which holds
 * two lines at most, clear of the retama: an article, "Blog" over its title (owner, 2026-10-23; src/lib/blog.ts,
 * TITLE_MAX), and a service page, "Servicios" over the service's name (owner, 2026-10-30). */
export function ogPageCard(label, title, theme) {
  return frame(theme, [
    el(
      "div",
      {
        ...typeStyle(theme, "statement"),
        color: theme["color-on-surface-muted"],
        marginBottom: px(theme["spacing-md"]),
      },
      label,
    ),
    el(
      "div",
      { ...typeStyle(theme, "headline"), maxWidth: px(theme["spacing-measure"]) * 1.15, textWrap: "balance" },
      title,
    ),
  ]);
}

async function png(card) {
  const image = await satori(card, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: "Stack Sans Headline", data: headline, weight: 300, style: "normal" }],
  });
  return sharp(Buffer.from(image)).png().toBuffer();
}

/** The PNG of a language's card. */
export function ogImage(copy, theme) {
  return png(ogCard(copy, theme));
}

/** The PNG of a page's own card. */
export function ogPageImage(label, title, theme) {
  return png(ogPageCard(label, title, theme));
}

/** The images of their own a built page declares in its JSON-LD (src/lib/seo.ts, structuredData), which postbuild
 * draws: an article's BlogPosting, with its headline, and a service page's Service, with its name, each with the
 * page's language. */
export function ownImages(html) {
  const locale = html.match(/<html lang="([^"]+)"/)?.[1];
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].flatMap(([, json]) =>
    (JSON.parse(json)["@graph"] ?? [])
      .filter((node) => node["@type"] === "BlogPosting" || node["@type"] === "Service")
      .map((node) => ({ type: node["@type"], title: node.headline ?? node.name, locale, image: node.image })),
  );
}
