// The site's icon in the formats the SVG does not cover, drawn at build time by scripts/postbuild.mjs from
// public/favicon.svg: favicon.ico, which browsers and feed readers ask for at the root without reading the page, and
// apple-touch-icon.png, the icon of a home screen and of Safari, which takes no SVG. The touch icon is also the logo of
// the Organization in the JSON-LD (src/lib/seo.ts), where Google asks for a raster image of at least 112px.
import sharp from "sharp";

export const FAVICON_SIZE = 32;
export const TOUCH_ICON_SIZE = 180;

/** The SVG as a square PNG of the given side. */
export function png(svg, size) {
  return sharp(Buffer.from(svg), { density: 72 * (size / 32) })
    .resize(size, size)
    .png()
    .toBuffer();
}

/** An ICO file holding the given square PNGs, which every browser that reads ICO takes since Windows Vista. */
export function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length + 16 * images.length;
  const entries = images.map(({ size, data }) => {
    const entry = Buffer.alloc(16);
    // A side of 256 is written as 0.
    entry.writeUInt8(size % 256, 0);
    entry.writeUInt8(size % 256, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ data }) => data)]);
}

/** favicon.ico and apple-touch-icon.png, by file name, from the SVG icon. */
export async function icons(svg) {
  return {
    "favicon.ico": ico([{ size: FAVICON_SIZE, data: await png(svg, FAVICON_SIZE) }]),
    "apple-touch-icon.png": await png(svg, TOUCH_ICON_SIZE),
  };
}
