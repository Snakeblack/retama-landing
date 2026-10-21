// The retama of the hero (DESIGN.md, Motion and 3D): a broom of thin stems above the ground and a root
// system that runs deeper than the shrub is tall. One seeded generator draws the static poster now and
// gives the 3D scene the same plant later, so the three tiers of ADR 0004 look like one picture.

export type Point = [x: number, y: number];
export type StrokeKind = "stem" | "root" | "taproot";
export interface Stroke {
  kind: StrokeKind;
  points: Point[];
}
export interface Frame {
  width: number;
  height: number;
  /** The ground line, measured from the top. */
  ground: number;
}
export interface Shape extends Frame {
  strokes: Stroke[];
}

// mulberry32: small, fast and the same on every platform.
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

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Walks a curved line from a point; angle 0 points up, positive bends right. */
function walk(start: Point, angle: number, bend: number, length: number, steps: number): Point[] {
  const points: Point[] = [start];
  let [x, y] = start;
  let heading = angle;
  for (let step = 0; step < steps; step++) {
    heading += bend / steps;
    x += Math.sin(heading) * (length / steps);
    y -= Math.cos(heading) * (length / steps);
    points.push([x, y]);
  }
  return points;
}

export function retamaShape(seed: number, frame: Frame): Shape {
  const next = random(seed);
  const spread = (amount: number) => (next() * 2 - 1) * amount;
  const { width, height, ground } = frame;
  const base: Point = [width / 2, ground];
  const strokes: Stroke[] = [];

  // Stems: rods fanning out from one crown, the outer ones arching over like a broom.
  const stemReach = ground * 0.92;
  for (let index = 0; index < 44; index++) {
    const angle = spread(0.95);
    const length = stemReach * (0.5 + next() * 0.5) * (1 - Math.abs(angle) * 0.3);
    const bend = angle * (0.5 + next() * 0.6) + spread(0.12);
    const stem = walk([base[0] + spread(14), ground], angle, bend, length, 7);
    strokes.push({ kind: "stem", points: stem });
    if (next() < 0.4) {
      const from = stem[3 + Math.floor(next() * 2)] ?? base;
      const side = angle + Math.sign(spread(1)) * (0.25 + next() * 0.35);
      strokes.push({ kind: "stem", points: walk(from, side, side * 0.4, length * 0.35, 4) });
    }
  }

  // Roots: one taproot to the bottom of the frame and laterals that branch as they go down.
  const bottom = height - 8;
  const taproot: Point[] = [];
  let drift = 0;
  for (let step = 0; step <= 12; step++) {
    taproot.push([base[0] + drift, ground + ((bottom - ground) * step) / 12]);
    drift += spread(5);
  }
  strokes.push({ kind: "taproot", points: taproot });

  const branch = (from: Point, angle: number, length: number, depth: number) => {
    // Angles here point down: pi is straight down.
    const points = walk(from, Math.PI + angle, spread(0.5), length, 5);
    strokes.push({ kind: "root", points });
    if (depth === 0) return;
    for (const at of [2, 5]) {
      const fork = points[at];
      if (fork && next() < 0.8) branch(fork, angle + spread(0.7), length * 0.55, depth - 1);
    }
  };
  for (let index = 1; index <= 9; index++) {
    const from = taproot[index] ?? base;
    const side = index % 2 === 0 ? 1 : -1;
    const length = (bottom - ground) * (0.55 - index * 0.035) * (0.8 + next() * 0.4);
    branch(from, side * (0.55 + next() * 0.7), length, index < 6 ? 2 : 1);
  }

  for (const stroke of strokes) {
    const [top, floor] = stroke.kind === "stem" ? [0, ground] : [ground, height];
    stroke.points = stroke.points.map(([x, y]) => [Math.round(clamp(x, 0, width)), Math.round(clamp(y, top, floor))]);
  }
  return { ...frame, strokes };
}
