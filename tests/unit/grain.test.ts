import { describe, expect, it } from "vitest";
import { grainTile } from "../../src/lib/grain";

const SIZE = 64;
const at = (tile: Uint8Array, x: number, y: number) =>
  tile[(((y % SIZE) + SIZE) % SIZE) * SIZE + (((x % SIZE) + SIZE) % SIZE)] ?? 0;

describe("grainTile", () => {
  it("es determinista para una semilla y cambia con otra", () => {
    expect(grainTile(SIZE, 0.55, 3)).toEqual(grainTile(SIZE, 0.55, 3));
    expect(grainTile(SIZE, 0.55, 3)).not.toEqual(grainTile(SIZE, 0.55, 4));
  });

  it("llena la tesela entera con valores de 0 a 255 que se reparten alrededor del medio", () => {
    const tile = grainTile(SIZE, 0.55);
    expect(tile).toHaveLength(SIZE * SIZE);
    const values = [...tile];
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    expect(mean).toBeGreaterThan(96);
    expect(mean).toBeLessThan(160);
    expect(Math.max(...values) - Math.min(...values)).toBeGreaterThan(64);
  });

  it("se repite sin costura: el salto en el borde es como el de dentro", () => {
    const tile = grainTile(SIZE, 0.55);
    const step = (x: number, y: number) => Math.abs(at(tile, x + 1, y) - at(tile, x, y));
    let inside = 0;
    let edge = 0;
    for (let y = 0; y < SIZE; y++) {
      inside += step(SIZE / 2, y);
      edge += step(SIZE - 1, y);
    }
    expect(edge).toBeLessThan(inside * 2);
  });

  it("es más fino cuanto mayor es la frecuencia", () => {
    const roughness = (tile: Uint8Array) => {
      let total = 0;
      for (let i = 1; i < tile.length; i++) total += Math.abs((tile[i] ?? 0) - (tile[i - 1] ?? 0));
      return total;
    };
    expect(roughness(grainTile(SIZE, 0.6))).toBeGreaterThan(roughness(grainTile(SIZE, 0.15)));
  });
});
