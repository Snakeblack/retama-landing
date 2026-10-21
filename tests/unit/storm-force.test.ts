import { describe, expect, it } from "vitest";
import { stormForce } from "../../src/lib/retama-scene";

// Steps the wind at 60 fps for the given seconds.
const run = (from: number, blowing: boolean, seconds: number) => {
  let force = from;
  for (let frame = 0; frame < seconds * 60; frame++) force = stormForce(force, blowing, 1 / 60);
  return force;
};

describe("viento del cursor sobre la escena", () => {
  it("sube en torno a un segundo al llegar el cursor, sin pasarse de 1", () => {
    expect(run(0, true, 0.25)).toBeLessThan(0.6);
    expect(run(0, true, 1)).toBeGreaterThan(0.9);
    expect(run(0, true, 10)).toBeLessThanOrEqual(1);
  });

  it("amaina más despacio de lo que sube al irse el cursor, sin bajar de 0", () => {
    expect(run(1, false, 1)).toBeGreaterThan(1 - run(0, true, 1));
    expect(run(1, false, 3)).toBeLessThan(0.05);
    expect(run(1, false, 10)).toBeGreaterThanOrEqual(0);
  });

  it("no da saltos con un frame largo tras volver a la pestaña", () => {
    expect(stormForce(0, true, 5)).toBe(1);
    expect(stormForce(1, false, 5)).toBe(0);
  });
});
