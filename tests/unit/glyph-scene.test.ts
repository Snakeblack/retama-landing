import { describe, expect, it } from "vitest";
import {
  FLIGHT,
  GLYPH_KIND,
  plantGlyphs,
  plantPlacement,
  RAIN_END,
  RAIN_START,
  WORD_START,
  wordGlyphs,
} from "../../src/lib/glyph-scene";
import { retamaPlant } from "../../src/lib/retama-scene";
import { HERO, retamaShape } from "../../src/lib/retama-shape";

const plant = retamaPlant(retamaShape(HERO.seed, HERO.frame, HERO.stems, HERO.roots), HERO.seed);
const desktop = { width: 1440, height: 900 };
const phone = { width: 390, height: 844 };
// Three samples of a word, in pixels from the top left of the chapter.
const samples: [number, number][] = [
  [40, 120],
  [400, 160],
  [800, 200],
];
const sequence = (index: number) => index % 7;

describe("colocación de la retama de glifos (DESIGN.md Motion and 3D)", () => {
  it("en escritorio crece a la derecha de la palabra y en el móvil en el centro", () => {
    expect(plantPlacement(desktop).x).toBeCloseTo(desktop.width * 0.7);
    expect(plantPlacement(phone).x).toBeCloseTo(phone.width / 2);
  });

  it("el suelo queda en el primer pantallazo y la mata cabe sobre él", () => {
    for (const stage of [desktop, phone]) {
      const { ground, scale } = plantPlacement(stage);
      expect(ground).toBeGreaterThan(stage.height / 2);
      expect(ground).toBeLessThan(stage.height);
      const stems = plant.strokes.filter((stroke) => stroke.kind === "stem");
      const height = Math.max(...stems.flatMap((stroke) => stroke.points.map((point) => point.position[1])));
      expect(ground - height * scale).toBeGreaterThan(0);
    }
  });
});

describe("glifos de la palabra", () => {
  const glyphs = wordGlyphs(samples, sequence, 7);

  it("hay uno por muestra y cada uno acaba en su muestra, con y hacia arriba", () => {
    expect(glyphs.map((glyph) => glyph.target)).toEqual(samples.map(([x, y]) => [x, -y, 0]));
    for (const glyph of glyphs) expect(glyph.kind).toBe(GLYPH_KIND.word);
  });

  it("salen dispersos y se ensamblan de izquierda a derecha", () => {
    for (const glyph of glyphs) {
      const [x, y] = glyph.target;
      expect(Math.hypot(glyph.origin[0] - x, glyph.origin[1] - y)).toBeGreaterThan(100);
      expect(glyph.delay).toBeGreaterThanOrEqual(WORD_START);
    }
    const [first, , last] = glyphs;
    expect((last?.delay ?? 0) - (first?.delay ?? 0)).toBeGreaterThan(0);
  });

  it("es determinista", () => {
    expect(wordGlyphs(samples, sequence, 7)).toEqual(glyphs);
  });

  it("una palabra puede ir en el color de acento", () => {
    for (const glyph of wordGlyphs(samples, sequence, 7, GLYPH_KIND.accent)) expect(glyph.kind).toBe(GLYPH_KIND.accent);
  });
});

describe("glifos de la planta", () => {
  const placement = plantPlacement(desktop);
  const glyphs = plantGlyphs(plant, placement, 9, samples, sequence, 7);
  const of = (kind: number) => glyphs.filter((glyph) => glyph.kind === kind);

  it("los tallos quedan sobre el suelo y las raíces bajo él", () => {
    expect(of(GLYPH_KIND.stem).length).toBeGreaterThan(1000);
    expect(of(GLYPH_KIND.root).length).toBeGreaterThan(200);
    expect(of(GLYPH_KIND.taproot).length).toBeGreaterThan(20);
    for (const glyph of of(GLYPH_KIND.stem)) expect(glyph.target[1]).toBeGreaterThanOrEqual(-placement.ground - 1);
    for (const glyph of of(GLYPH_KIND.root)) expect(glyph.target[1]).toBeLessThanOrEqual(-placement.ground + 1);
  });

  it("llueven desde la palabra: cada glifo sale de una muestra de la palabra", () => {
    const origins = new Set(samples.map(([x, y]) => `${x},${-y}`));
    for (const glyph of glyphs.slice(0, 200)) expect(origins.has(`${glyph.origin[0]},${glyph.origin[1]}`)).toBe(true);
  });

  it("crece en orden: las raíces llegan antes que las puntas de los tallos", () => {
    const meanDelay = (kind: number) => {
      const list = of(kind);
      return list.reduce((sum, glyph) => sum + glyph.delay, 0) / list.length;
    };
    for (const glyph of glyphs) {
      expect(glyph.delay).toBeGreaterThanOrEqual(RAIN_START);
      // The title turns back into letters at RAIN_END: by then every glyph of the plant has landed.
      expect(glyph.delay + FLIGHT.plant).toBeLessThanOrEqual(RAIN_END);
    }
    expect(meanDelay(GLYPH_KIND.root)).toBeLessThan(meanDelay(GLYPH_KIND.stem));
  });

  it("el código se lee a lo largo de cada trazo: los glifos siguen el orden del fuente", () => {
    const stem = of(GLYPH_KIND.stem);
    const [a, b] = stem;
    expect(b?.cell).toBe(((a?.cell ?? 0) + 1) % 7);
  });
});
