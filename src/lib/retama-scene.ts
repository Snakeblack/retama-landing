// The plant of the 3D scene (ADR 0004, DESIGN.md Motion and 3D): the poster's strokes lifted into space, with what
// the scene animates written on every point. Seen from the front it is the poster, point for point: depth comes from
// a second seeded stream, so the poster's drawing does not change.
import type { Shape, StrokeKind } from "./retama-shape";

/** The roots finish growing at this share of the growth, and the stems start at this one (they overlap a little). */
export const GROW_ROOTS_END = 0.6;
export const GROW_STEMS_START = 0.5;
// The widest angle a stroke leans out of the picture plane, in radians.
const LEAN = 0.85;

/**
 * How hard the pointer's wind blows on the stems, from 0 to 1, after dt seconds: it rises in about a second while the
 * pointer is over the scene and dies down over about two once it leaves, like a gust passing.
 */
export function stormForce(force: number, blowing: boolean, dt: number): number {
  return force + ((blowing ? 1 : 0) - force) * Math.min(1, dt * (blowing ? 3 : 1.5));
}

export interface PlantPoint {
  /** x as in the poster, y up from the ground, z towards the viewer. */
  position: [x: number, y: number, z: number];
  /** Distance along the plant from the crown: negative down the roots, positive up the stems. The sap runs upwards. */
  flow: number;
  /** When the point appears, from 0 to 1 of the growth. */
  grow: number;
  /** How much the wind moves it: 0 at the ground and on every root, 1 at the top of the tallest stem. */
  sway: number;
}
export interface PlantStroke {
  kind: StrokeKind;
  points: PlantPoint[];
}
export interface Plant {
  strokes: PlantStroke[];
  /** The longest run of sap down the roots and up the stems, and the height of the tallest stem. */
  reach: { root: number; stem: number; height: number };
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

export function retamaPlant(shape: Shape, seed: number): Plant {
  const next = random(seed ^ 0x9e3779b9);
  // Each stroke starts on a point of an earlier one (its parent) or at the crown; stems and roots never share one.
  const joints = new Map<string, { flow: number; z: number }>();
  const lifted = shape.strokes.map(({ kind, points }) => {
    const side = kind === "stem" ? 1 : -1;
    const lean = Math.tan((next() * 2 - 1) * LEAN);
    const key = ([x, y]: [number, number]) => `${side}:${x},${y}`;
    const [first] = points;
    const start = first ? joints.get(key(first)) : undefined;
    let flow = start?.flow ?? 0;
    const lift = points.map((point, at) => {
      const previous = points[at - 1];
      if (previous) flow += side * Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      const z = Math.round((start?.z ?? 0) + (point[0] - (first?.[0] ?? 0)) * lean);
      return { position: [point[0], shape.ground - point[1], z] as PlantPoint["position"], flow };
    });
    for (const [at, point] of points.entries()) {
      const done = lift[at];
      if (done && !joints.has(key(point))) joints.set(key(point), { flow: done.flow, z: done.position[2] });
    }
    return { kind, lift };
  });

  const all = lifted.flatMap(({ lift }) => lift);
  const reach = {
    root: Math.max(...all.map((point) => -point.flow)),
    stem: Math.max(...all.map((point) => point.flow)),
    height: Math.max(...all.map((point) => point.position[1])),
  };
  const strokes = lifted.map(({ kind, lift }) => ({
    kind,
    points: lift.map(({ position, flow }) =>
      kind === "stem"
        ? {
            position,
            flow,
            grow: GROW_STEMS_START + (1 - GROW_STEMS_START) * (flow / reach.stem),
            sway: (position[1] / reach.height) ** 2,
          }
        : { position, flow, grow: GROW_ROOTS_END * (Math.abs(flow) / reach.root), sway: 0 },
    ),
  }));
  return { strokes, reach };
}
