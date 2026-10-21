import { describe, expect, it } from "vitest";
import { GROW_ROOTS_END, GROW_STEMS_START, retamaPlant } from "../../src/lib/retama-scene";
import { retamaShape } from "../../src/lib/retama-shape";

const frame = { width: 1600, height: 900, ground: 360 };
const shape = retamaShape(7, frame);
const plant = retamaPlant(shape, 7);
const strokes = (kind: (k: string) => boolean) => plant.strokes.filter((stroke) => kind(stroke.kind));
const stems = strokes((k) => k === "stem");
const roots = strokes((k) => k !== "stem");

describe("planta de la escena 3D (ADR 0004)", () => {
  it("vista de frente es el póster: cada punto conserva su x y su altura sobre el suelo", () => {
    expect(plant.strokes).toHaveLength(shape.strokes.length);
    plant.strokes.forEach((stroke, index) => {
      const source = shape.strokes[index];
      expect(stroke.kind).toBe(source?.kind);
      stroke.points.forEach((point, at) => {
        const [x, y] = source?.points[at] ?? [];
        expect(point.position[0]).toBe(x);
        expect(point.position[1]).toBe(frame.ground - (y ?? 0));
      });
    });
  });

  it("es determinista y tiene volumen: la misma semilla da la misma profundidad", () => {
    expect(retamaPlant(shape, 7)).toEqual(plant);
    const depths = plant.strokes.flatMap((stroke) => stroke.points.map((point) => Math.abs(point.position[2])));
    expect(Math.max(...depths)).toBeGreaterThan(40);
    expect(Math.max(...depths)).toBeLessThanOrEqual(frame.width / 2);
  });

  it("cada rama nace donde está su madre: misma profundidad y misma savia en la unión", () => {
    const seen = new Map<string, { flow: number; z: number }>();
    let joined = 0;
    for (const stroke of plant.strokes) {
      const [first] = stroke.points;
      if (!first) continue;
      const side = stroke.kind === "stem" ? "up" : "down";
      const joint = seen.get(`${side}${first.position[0]},${first.position[1]}`);
      if (joint) {
        joined++;
        expect(first.flow).toBe(joint.flow);
        expect(first.position[2]).toBe(joint.z);
      }
      for (const point of stroke.points) {
        seen.set(`${side}${point.position[0]},${point.position[1]}`, { flow: point.flow, z: point.position[2] });
      }
    }
    expect(joined).toBeGreaterThan(20);
  });

  it("la savia sube: negativa en las raíces, positiva en los tallos, y crece hacia la copa en cada trazo", () => {
    for (const stroke of roots) {
      for (const point of stroke.points) expect(point.flow).toBeLessThanOrEqual(0);
      for (let at = 1; at < stroke.points.length; at++) {
        expect(stroke.points[at]?.flow).toBeLessThanOrEqual(stroke.points[at - 1]?.flow ?? 0);
      }
    }
    for (const stroke of stems) {
      for (const point of stroke.points) expect(point.flow).toBeGreaterThanOrEqual(0);
      for (let at = 1; at < stroke.points.length; at++) {
        expect(stroke.points[at]?.flow).toBeGreaterThanOrEqual(stroke.points[at - 1]?.flow ?? 0);
      }
    }
    expect(plant.reach.root).toBeGreaterThan(0);
    expect(plant.reach.stem).toBeGreaterThan(0);
  });

  it("crece en orden: primero la raíz principal, luego las raíces y al final los tallos", () => {
    const taproot = strokes((k) => k === "taproot")[0];
    expect(taproot?.points[0]?.grow).toBe(0);
    const rootGrow = roots.flatMap((stroke) => stroke.points.map((point) => point.grow));
    const stemGrow = stems.flatMap((stroke) => stroke.points.map((point) => point.grow));
    expect(Math.max(...rootGrow)).toBeCloseTo(GROW_ROOTS_END);
    expect(Math.min(...stemGrow)).toBeCloseTo(GROW_STEMS_START);
    expect(Math.max(...stemGrow)).toBeCloseTo(1);
    expect(GROW_STEMS_START).toBeLessThan(GROW_ROOTS_END);
    for (const stroke of plant.strokes) {
      for (let at = 1; at < stroke.points.length; at++) {
        expect(stroke.points[at]?.grow).toBeGreaterThanOrEqual(stroke.points[at - 1]?.grow ?? 0);
      }
    }
  });

  it("el viento mueve los tallos más cuanto más altos y deja quietas las raíces", () => {
    for (const stroke of roots) for (const point of stroke.points) expect(point.sway).toBe(0);
    const sway = stems.flatMap((stroke) => stroke.points.map((point) => point.sway));
    expect(Math.min(...sway)).toBe(0);
    expect(Math.max(...sway)).toBeCloseTo(1);
    for (const stroke of stems) {
      for (const point of stroke.points) {
        expect(point.sway).toBeCloseTo((point.position[1] / plant.reach.height) ** 2);
      }
    }
  });
});
