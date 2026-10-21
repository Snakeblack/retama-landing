import { describe, expect, it } from "vitest";
import { motionTheme } from "../../scripts/lib/motion-tokens.mjs";
import { cubicBezier, readMotion } from "../../src/lib/motion";

const design = `# Retama

## Motion and 3D

| Token | Value | Use |
| --- | --- | --- |
| ease-out | cubic-bezier(0.22, 1, 0.36, 1) | entrances |
| t-press | 140ms | press feedback |
| stagger-item | 70ms | tiles of one group |

The budget, per page:

| ease-later | cubic-bezier(0, 0, 1, 1) | not in the motion table |

## Do's and Don'ts
`;

describe("motionTheme", () => {
  it("genera un bloque @theme static con cada fila de la tabla Motion de DESIGN.md", () => {
    expect(motionTheme(design)).toBe(
      "@theme static {\n  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);\n  --t-press: 140ms;\n  --stagger-item: 70ms;\n}\n",
    );
  });

  it("falla si DESIGN.md no tiene la tabla Motion", () => {
    expect(() => motionTheme("# Retama\n\n## Colors\n")).toThrow(/Motion/);
  });
});

describe("cubicBezier", () => {
  it("fija los extremos y sigue la curva de CSS", () => {
    const linear = cubicBezier(0, 0, 1, 1);
    expect(linear(0)).toBe(0);
    expect(linear(1)).toBe(1);
    expect(linear(0.3)).toBeCloseTo(0.3, 4);
    // ease (0.25, 0.1, 0.25, 1) at x = 0.5 is 0.8024 in the CSS reference implementation.
    expect(cubicBezier(0.25, 0.1, 0.25, 1)(0.5)).toBeCloseTo(0.8024, 3);
  });

  it("acepta curvas que salen de [0, 1] en y", () => {
    const overshoot = cubicBezier(0.5, -0.5, 0.5, 1.5);
    expect(overshoot(0.1)).toBeLessThan(0);
    expect(overshoot(0.9)).toBeGreaterThan(1);
  });
});

describe("readMotion", () => {
  const styles: Record<string, string> = {
    "--ease-out": " cubic-bezier(0.22, 1, 0.36, 1)",
    "--ease-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
    "--ease-in-out": "cubic-bezier(0.76, 0, 0.24, 1)",
    "--t-ui": " .24s",
    "--t-reveal": "800ms",
    "--t-open": "1100ms",
    "--stagger-line": "90ms",
    "--stagger-item": "70ms",
  };
  const read = (name: string) => styles[name] ?? "";

  it("lee las curvas como funciones y los tiempos en segundos, también minificados", () => {
    const motion = readMotion(read);
    expect(motion.duration.reveal).toBe(0.8);
    expect(motion.duration.ui).toBe(0.24);
    expect(motion.stagger.item).toBe(0.07);
    expect(motion.ease.out(1)).toBe(1);
    expect(motion.ease.out(0.5)).toBeCloseTo(cubicBezier(0.22, 1, 0.36, 1)(0.5), 6);
  });

  it("falla si falta un token o no se entiende", () => {
    expect(() => readMotion((name) => (name === "--t-ui" ? "" : read(name)))).toThrow(/--t-ui/);
    expect(() => readMotion((name) => (name === "--ease-out" ? "ease" : read(name)))).toThrow(/--ease-out/);
  });
});
