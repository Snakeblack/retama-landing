// DESIGN.md Elevation & Depth, the grain of the scene: the same fine grain the page draws from its SVGs, computed once
// as a small tile the scene samples on the screen, so the GPU never computes noise per pixel and per frame.

/** One tile of fractal value noise, two octaves like the SVG's feTurbulence, wrapping on every side, 0..255. */
export function grainTile(size: number, frequency: number, seed = 1): Uint8Array {
  const octaves = [1, 2].map((scale, octave) =>
    lattice(Math.max(1, Math.round(size * frequency * scale)), seed + octave),
  );
  const tile = new Uint8Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [first = 0, second = 0] = octaves.map((sample) => sample(x / size, y / size));
      tile[y * size + x] = Math.round(((first + second * 0.5) / 1.5) * 255);
    }
  }
  return tile;
}

/** Smooth value noise on a wrapping lattice of cells × cells random values, sampled at u, v in 0..1. */
function lattice(cells: number, seed: number) {
  const values = Float32Array.from({ length: cells * cells }, (_, index) => hash(index, seed));
  const at = (x: number, y: number) => values[((y + cells) % cells) * cells + ((x + cells) % cells)] ?? 0;
  const smooth = (t: number) => t * t * (3 - 2 * t);
  return (u: number, v: number) => {
    const x = u * cells;
    const y = v * cells;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const tx = smooth(x - x0);
    const ty = smooth(y - y0);
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
    return top + (bottom - top) * ty;
  };
}

/** A deterministic value in 0..1 for an integer and a seed. */
function hash(n: number, seed: number): number {
  let h = Math.imul(n ^ (seed * 0x9e3779b9), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 0xffffffff;
}
