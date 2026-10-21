// The motion tokens of DESIGN.md, read back from the generated theme so the script never repeats a value.

/** A CSS cubic-bezier timing function, solved for x like the browser does. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const curveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const curveY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const solve = (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const error = curveX(t) - x;
      if (Math.abs(error) < 1e-7) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-6) break;
      t -= error / slope;
    }
    // Newton stalled on a flat stretch: bisect instead.
    let low = 0;
    let high = 1;
    t = x;
    while (high - low > 1e-7) {
      if (curveX(t) < x) low = t;
      else high = t;
      t = (low + high) / 2;
    }
    return t;
  };

  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : curveY(solve(x)));
}

const EASES = { out: "--ease-out", expo: "--ease-expo", inOut: "--ease-in-out" } as const;
const DURATIONS = { ui: "--t-ui", reveal: "--t-reveal", open: "--t-open" } as const;
const STAGGERS = { line: "--stagger-line", item: "--stagger-item" } as const;

export interface Motion {
  ease: Record<keyof typeof EASES, (x: number) => number>;
  duration: Record<keyof typeof DURATIONS, number>;
  stagger: Record<keyof typeof STAGGERS, number>;
}

function ease(name: string, value: string) {
  const points = value
    .match(/^cubic-bezier\(([^)]+)\)$/)?.[1]
    ?.split(",")
    .map(Number);
  if (points?.length !== 4 || points.some(Number.isNaN)) throw new Error(`${name} is not a cubic-bezier: "${value}"`);
  const [x1 = 0, y1 = 0, x2 = 1, y2 = 1] = points;
  return cubicBezier(x1, y1, x2, y2);
}

// The CSS minifier may rewrite a time, so 240ms reaches the page as .24s.
function seconds(name: string, value: string) {
  const [, amount, unit] = value.match(/^(\d*\.?\d+)(ms|s)$/) ?? [];
  if (amount === undefined) throw new Error(`${name} is not a CSS time: "${value}"`);
  return unit === "ms" ? Number(amount) / 1000 : Number(amount);
}

function readAll<K extends string, T>(
  names: Record<K, string>,
  read: (name: string) => string,
  parse: (name: string, value: string) => T,
) {
  return Object.fromEntries(
    Object.entries<string>(names).map(([key, name]) => [key, parse(name, read(name).trim())]),
  ) as Record<K, T>;
}

/** Reads the motion tokens through `read` (a custom property lookup, such as `getComputedStyle().getPropertyValue`). */
export function readMotion(read: (name: string) => string): Motion {
  return {
    ease: readAll(EASES, read, ease),
    duration: readAll(DURATIONS, read, seconds),
    stagger: readAll(STAGGERS, read, seconds),
  };
}
