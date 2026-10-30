import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ico, icons, TOUCH_ICON_SIZE } from "../../scripts/lib/icons.mjs";

const svg = readFileSync("public/favicon.svg", "utf8");

describe("ico", () => {
  it("guarda cada PNG tras una cabecera y una entrada que dicen su tamaño y dónde empieza", () => {
    const small = Buffer.from("png-of-32");
    const large = Buffer.from("png-of-256!");
    const file = ico([
      { size: 32, data: small },
      { size: 256, data: large },
    ]);
    expect([file.readUInt16LE(0), file.readUInt16LE(2), file.readUInt16LE(4)]).toEqual([0, 1, 2]);
    // First entry: 32×32, 32 bits, its length and its offset after the header and the two entries.
    expect([
      file.readUInt8(6),
      file.readUInt8(7),
      file.readUInt16LE(12),
      file.readUInt32LE(14),
      file.readUInt32LE(18),
    ]).toEqual([32, 32, 32, small.length, 6 + 32]);
    // A side of 256 is written as 0, and the second image starts where the first ends.
    expect([file.readUInt8(22), file.readUInt32LE(34)]).toEqual([0, 6 + 32 + small.length]);
    expect(file.subarray(6 + 32).toString()).toBe("png-of-32png-of-256!");
  });
});

describe("icons", () => {
  it("dibuja el icono de la página en un ICO de 32 px y en un PNG de 180 px, opaco y del color del fondo", async () => {
    const files = await icons(svg);
    const favicon = files["favicon.ico"];
    const embedded = favicon.subarray(favicon.readUInt32LE(18));
    expect(await sharp(embedded).metadata()).toMatchObject({ format: "png", width: 32, height: 32 });

    const touch = sharp(files["apple-touch-icon.png"]);
    expect(await touch.metadata()).toMatchObject({ format: "png", width: TOUCH_ICON_SIZE, height: TOUCH_ICON_SIZE });
    // A home screen fills transparency with black, so the icon is the ground of the page from corner to corner.
    const { data } = await touch
      .clone()
      .ensureAlpha()
      .extract({ left: 0, top: 170, width: 1, height: 1 })
      .raw()
      .toBuffer({
        resolveWithObject: true,
      });
    expect([...data]).toEqual([0x18, 0x19, 0x1b, 255]);
  });
});
