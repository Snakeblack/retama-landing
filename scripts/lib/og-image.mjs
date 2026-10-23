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

/** The card as Satori elements: the bar, the wordmark, the two-tone title and the lead over the retama. */
export function ogCard(copy, theme) {
  const type = (level) => ({
    fontFamily: "Stack Sans Headline",
    fontWeight: 300,
    fontSize: px(theme[`text-${level}`]),
    lineHeight: Number(theme[`leading-${level}`]),
    letterSpacing: `${theme[`tracking-${level}`]}`,
  });
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
          el("div", { display: "flex", flexDirection: "column" }, [
            el("div", { ...type("display"), marginLeft: -px(theme["spacing-xs"]) }, copy["hero.word"]),
            el("div", { ...type("headline"), color: theme["color-primary"] }, copy["hero.rest"]),
            el(
              "div",
              {
                ...type("statement"),
                maxWidth: px(theme["spacing-measure"]),
                textWrap: "balance",
                marginTop: px(theme["spacing-lg"]),
              },
              copy["hero.lead"],
            ),
          ]),
        ],
      ),
    ],
  );
}

/** The PNG of a language's card. */
export async function ogImage(copy, theme) {
  const image = await satori(ogCard(copy, theme), {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: "Stack Sans Headline", data: headline, weight: 300, style: "normal" }],
  });
  return sharp(Buffer.from(image)).png().toBuffer();
}
