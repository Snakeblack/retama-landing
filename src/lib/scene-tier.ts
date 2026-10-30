// Which of the three tiers of ADR 0004 a visitor gets, and when a running scene gives up for the poster.

export type Tier = "webgpu" | "webgl2" | "poster";
export interface Probe {
  reducedMotion: boolean;
  saveData: boolean;
  /** "fallback" is a software adapter: WebGPU that the CPU draws. */
  webgpu: "ok" | "fallback" | "none";
  /** A WebGL2 context without a major performance caveat (not a software renderer). */
  webgl2: boolean;
  /** The scene draws in a worker, so it needs a canvas it can hand over. */
  offscreen: boolean;
}

export function sceneTier(probe: Probe): Tier {
  if (probe.reducedMotion || probe.saveData || !probe.offscreen) return "poster";
  if (probe.webgpu === "ok") return "webgpu";
  return probe.webgl2 ? "webgl2" : "poster";
}

/** Frames measured before deciding, the first of them spent compiling shaders, and the slowest median kept. The sample
 * also ends once its warm frames add up to a second (at least ten of them), so a slow GPU gives up for the poster in
 * about two seconds at 12 fps instead of the five that 60 frames take, before the title has rained into the plant. */
const SAMPLE_FRAMES = 60;
const WARMUP_FRAMES = 10;
const MIN_WARM_FRAMES = 10;
const SAMPLE_MS = 1000;
const SLOWEST_FRAME_MS = 1000 / 30;

/** True when the scene runs under 30 fps once warm; undefined until the sample is complete. */
export function tooSlow(frameMs: number[]): boolean | undefined {
  const warm = frameMs.slice(WARMUP_FRAMES, SAMPLE_FRAMES);
  const elapsed = warm.reduce((sum, ms) => sum + ms, 0);
  if (frameMs.length < SAMPLE_FRAMES && (warm.length < MIN_WARM_FRAMES || elapsed < SAMPLE_MS)) return undefined;
  warm.sort((a, b) => a - b);
  const median = warm[Math.floor(warm.length / 2)] ?? 0;
  return median > SLOWEST_FRAME_MS;
}
