import { describe, expect, it } from "vitest";
import { sceneTier, tooSlow } from "../../src/lib/scene-tier";

const capable = { reducedMotion: false, saveData: false, webgpu: "ok", webgl2: true, offscreen: true } as const;

describe("nivel de la escena (ADR 0004)", () => {
  it("prefiere WebGPU y baja a WebGL2 sin adaptador o con uno de respaldo", () => {
    expect(sceneTier(capable)).toBe("webgpu");
    expect(sceneTier({ ...capable, webgpu: "none" })).toBe("webgl2");
    expect(sceneTier({ ...capable, webgpu: "fallback" })).toBe("webgl2");
  });

  it("se queda en el póster sin un canvas que pasar al worker", () => {
    expect(sceneTier({ ...capable, offscreen: false })).toBe("poster");
  });

  it("se queda en el póster con movimiento reducido, ahorro de datos o sin GPU que rinda", () => {
    expect(sceneTier({ ...capable, reducedMotion: true })).toBe("poster");
    expect(sceneTier({ ...capable, saveData: true })).toBe("poster");
    expect(sceneTier({ ...capable, webgpu: "none", webgl2: false })).toBe("poster");
    expect(sceneTier({ ...capable, webgpu: "fallback", webgl2: false })).toBe("poster");
  });
});

describe("GPU lenta medida en los primeros frames", () => {
  const frames = (ms: number, count = 60) => Array.from({ length: count }, () => ms);

  it("no decide hasta tener 60 frames o un segundo de frames calientes, y nunca con menos de 10 de ellos", () => {
    expect(tooSlow(frames(16.7, 59))).toBeUndefined();
    expect(tooSlow(frames(100, 19))).toBeUndefined();
    expect(tooSlow(frames(83, 22))).toBeUndefined();
  });

  it("con una GPU lenta se rinde al segundo de frames calientes, sin esperar a los 60 (a 12 fps, unos 2 s y no 5)", () => {
    expect(tooSlow(frames(100, 20))).toBe(true);
    expect(tooSlow(frames(83, 23))).toBe(true);
  });

  it("los frames de compilar shaders no cuentan para el segundo", () => {
    expect(tooSlow([...frames(500, 10), ...frames(16.7, 30)])).toBeUndefined();
  });

  it("descarta por la mediana por debajo de 30 fps, sin dejarse llevar por un tirón suelto", () => {
    expect(tooSlow(frames(16.7))).toBe(false);
    expect(tooSlow(frames(40))).toBe(true);
    expect(tooSlow([...frames(16.7, 50), ...frames(200, 10)])).toBe(false);
  });

  it("ignora los primeros frames, en los que compila los shaders", () => {
    expect(tooSlow([...frames(500, 10), ...frames(16.7, 50)])).toBe(false);
  });
});
