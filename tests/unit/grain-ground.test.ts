import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const svg = readFileSync(new URL("../../src/assets/grain-ground.svg", import.meta.url), "utf8");
const scene = readFileSync(new URL("../../src/scripts/scene-three.ts", import.meta.url), "utf8");

const channels = [...svg.matchAll(/<feFunc([RGB]) type="linear" slope="([\d.]+)" intercept="([\d.]+)"/g)].map(
  ([, channel, slope, intercept]) => ({ channel, slope: Number(slope), intercept: Number(intercept) }),
);
const sceneGround = scene.match(/ground: \{ slope: ([\d.]+), intercept: ([\d.]+) \}/);

describe("el grano del suelo (DESIGN.md Elevation & Depth)", () => {
  it("es gris: los tres canales del SVG llevan la misma curva", () => {
    expect(channels.map(({ channel }) => channel)).toEqual(["R", "G", "B"]);
    expect(new Set(channels.map(({ slope, intercept }) => `${slope}/${intercept}`)).size).toBe(1);
  });

  it("es suave y solo oscurece: poco contraste y un multiplicador que se queda cerca del blanco", () => {
    const { slope = 1, intercept = 0 } = channels[0] ?? {};
    expect(slope).toBeLessThanOrEqual(0.7);
    // The turbulence centres on 0.5, so the mean factor of the multiply stays above 0.9.
    expect(slope * 0.5 + intercept).toBeGreaterThan(0.9);
  });

  it("la escena del primer capítulo pinta el mismo grano que el SVG de la página", () => {
    expect(sceneGround).not.toBeNull();
    const [, slope, intercept] = sceneGround as RegExpMatchArray;
    expect({ slope: Number(slope), intercept: Number(intercept) }).toEqual({
      slope: channels[0]?.slope,
      intercept: channels[0]?.intercept,
    });
  });
});
