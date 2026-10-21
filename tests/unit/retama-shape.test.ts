import { describe, expect, it } from "vitest";
import { retamaShape } from "../../src/lib/retama-shape";

const frame = { width: 1600, height: 900, ground: 360 };

describe("forma de la retama (póster del hero, ADR 0004)", () => {
  it("es determinista: la misma semilla da el mismo dibujo", () => {
    expect(retamaShape(7, frame)).toEqual(retamaShape(7, frame));
    expect(retamaShape(7, frame)).not.toEqual(retamaShape(8, frame));
  });

  it("los tallos quedan sobre el suelo y las raíces bajo él", () => {
    const shape = retamaShape(7, frame);
    const stems = shape.strokes.filter((stroke) => stroke.kind === "stem");
    const roots = shape.strokes.filter((stroke) => stroke.kind !== "stem");
    expect(stems.length).toBeGreaterThan(20);
    expect(roots.length).toBeGreaterThan(20);
    for (const stroke of stems) for (const [, y] of stroke.points) expect(y).toBeLessThanOrEqual(frame.ground);
    for (const stroke of roots) for (const [, y] of stroke.points) expect(y).toBeGreaterThanOrEqual(frame.ground);
  });

  it("la raíz es más profunda que alta la mata, como la planta real", () => {
    const shape = retamaShape(7, frame);
    const ys = (kind: (k: string) => boolean) =>
      shape.strokes.filter((stroke) => kind(stroke.kind)).flatMap((stroke) => stroke.points.map(([, y]) => y));
    const stemHeight = frame.ground - Math.min(...ys((k) => k === "stem"));
    const rootDepth = Math.max(...ys((k) => k !== "stem")) - frame.ground;
    expect(rootDepth).toBeGreaterThan(stemHeight);
  });

  it("hay una única raíz principal y todo el trazo cabe en el marco", () => {
    const shape = retamaShape(7, frame);
    expect(shape.strokes.filter((stroke) => stroke.kind === "taproot")).toHaveLength(1);
    for (const stroke of shape.strokes) {
      for (const [x, y] of stroke.points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(frame.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(frame.height);
      }
    }
  });
});
