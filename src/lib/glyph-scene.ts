// The glyphs of the first chapter's scene (DESIGN.md Motion and 3D): the word and the retama drawn with the characters
// of the site's own code. This module only lays them out; scene-three.ts animates them on the GPU. Coordinates are CSS
// pixels of the chapter, x to the right and y up from its top edge (so everything below the top is negative), z
// towards the viewer, so the word's glyphs land exactly on the letters of the HTML word.
import type { Plant, PlantPoint } from "./retama-scene";
import { HERO } from "./retama-shape";

export type Vec3 = [x: number, y: number, z: number];
/** A word's glyphs are `word` in the ink or `accent` in the primary colour. */
export const GLYPH_KIND = { word: 0, stem: 1, root: 2, taproot: 3, accent: 4 } as const;
export type GlyphKind = (typeof GLYPH_KIND)[keyof typeof GLYPH_KIND];

export interface Glyph {
  kind: GlyphKind;
  /** Where it flies from and where it rests. */
  origin: Vec3;
  target: Vec3;
  /** The cell of the glyph atlas it shows once it rests. */
  cell: number;
  /** Its turn on the page, in radians: the plant's glyphs follow their stroke, so the code reads along it. */
  angle: number;
  /** When it leaves its origin, in seconds from the start of the scene. */
  delay: number;
  /** Distance along the plant from the crown (negative down the roots), for the sap; 0 on the word. */
  flow: number;
  /** How much the wind moves it, from 0 to 1. */
  sway: number;
  /** A stable random number from 0 to 1, for flicker and jitter. */
  seed: number;
}

/** The word starts to assemble at this time, the rain from the word starts at the next and lasts the third. */
export const WORD_START = 0.2;
export const RAIN_START = 1.6;
export const RAIN_SPAN = 3.6;
/** How long one glyph flies, in seconds. */
export const FLIGHT = { word: 1.4, plant: 1.3 } as const;
/** A plant glyph leaves up to this long after its turn, so the stroke does not arrive in a line. */
const RAIN_JITTER = 0.3;
/** When the last glyph of the rain lands: the retama has grown. */
export const RAIN_END = RAIN_START + RAIN_SPAN + RAIN_JITTER + FLIGHT.plant;

/**
 * Where the retama stands in a chapter of this size, the same as the poster (global.css): its crown at 70% of the
 * width from `lg`, clear of the title, and centred below it; the drawing of its stems and upper roots fills 72% of the height (half on
 * phones), resting on 8% (6%) of the height above the bottom.
 */
export function plantPlacement({ width, height }: { width: number; height: number }) {
  const wide = width >= 1024;
  const { frame, crop } = HERO;
  const drawn = height * (wide ? 0.72 : 0.5);
  const bottom = height * (1 - (wide ? 0.08 : 0.06));
  const scale = drawn / crop;
  return { x: width * (wide ? 0.7 : 0.5), ground: bottom - (crop - frame.ground) * scale, scale };
}

// mulberry32, as in retama-shape.ts.
function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One glyph per sample of the word (pixels from the chapter's top left, y down). Each flies in from a scattered point
 * around the word, the left letters first, and shows the next character of the source.
 */
export function wordGlyphs(
  samples: [x: number, y: number][],
  sequence: (index: number) => number,
  seed: number,
  kind: typeof GLYPH_KIND.word | typeof GLYPH_KIND.accent = GLYPH_KIND.word,
): Glyph[] {
  const next = random(seed);
  const xs = samples.map(([x]) => x);
  const left = Math.min(...xs);
  const span = Math.max(1, Math.max(...xs) - left);
  return samples.map(([x, y], index) => {
    const turn = next() * Math.PI * 2;
    const reach = 260 + next() * 900;
    return {
      kind,
      origin: [x + Math.cos(turn) * reach, -y + Math.sin(turn) * reach, (next() * 2 - 1) * 900],
      target: [x, -y, 0],
      cell: sequence(index),
      angle: 0,
      delay: WORD_START + ((x - left) / span) * 0.5 + next() * 0.25,
      flow: 0,
      sway: 0,
      seed: next(),
    };
  });
}

const KIND = { stem: GLYPH_KIND.stem, root: GLYPH_KIND.root, taproot: GLYPH_KIND.taproot } as const;

/**
 * The plant's glyphs, `spacing` pixels apart along every stroke, each one flying from a sample of the word to its place
 * when the plant reaches it: the rain from the word grows the retama, roots first. The characters follow the source in
 * order along each stroke, so the code reads up the stems and down the roots.
 */
export function plantGlyphs(
  plant: Plant,
  placement: ReturnType<typeof plantPlacement>,
  spacing: number,
  samples: [x: number, y: number][],
  sequence: (index: number) => number,
  seed: number,
): Glyph[] {
  const next = random(seed ^ 0x51ed270b);
  const { x, ground, scale } = placement;
  const centre = HERO.frame.width / 2;
  const world = (point: PlantPoint): Vec3 => [
    x + (point.position[0] - centre) * scale,
    -ground + point.position[1] * scale,
    point.position[2] * scale,
  ];
  const glyphs: Glyph[] = [];
  let index = 0;
  for (const { kind, points } of plant.strokes) {
    for (let at = 1; at < points.length; at++) {
      const a = points[at - 1];
      const b = points[at];
      if (!a || !b) continue;
      const from = world(a);
      const to = world(b);
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const length = Math.hypot(dx, dy, to[2] - from[2]);
      const steps = Math.max(1, Math.round(length / spacing));
      for (let step = 0; step < steps; step++) {
        const t = step / steps;
        const lerp = (p: number, q: number) => p + (q - p) * t;
        const [sx, sy] = samples[Math.floor(next() * samples.length)] ?? [x, ground];
        glyphs.push({
          kind: KIND[kind],
          origin: [sx, -sy, 0],
          target: [lerp(from[0], to[0]), lerp(from[1], to[1]), lerp(from[2], to[2])],
          cell: sequence(index++),
          angle: Math.atan2(dy, dx),
          delay: RAIN_START + lerp(a.grow, b.grow) * RAIN_SPAN + next() * RAIN_JITTER,
          flow: lerp(a.flow, b.flow),
          sway: lerp(a.sway, b.sway),
          seed: next(),
        });
      }
    }
  }
  return glyphs;
}
