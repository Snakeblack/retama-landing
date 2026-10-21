// The 3D scene of ADR 0004 runs in this worker on the canvas scene.ts hands over, so parsing three.js, building the
// shaders and drawing every frame never block the page (TBT and INP of scenario:perf-mobile). The page only sends
// the stage's size with the samples of the words, the scroll, the pointer and whether to run; the worker answers when
// the first frame is drawn or when it gives up.
import { SAMPLE_FRAMES, type Tier, tooSlow } from "../lib/scene-tier";
import { type Colors, createScene, type GlyphScene, type Stage, type Word } from "./scene-three";

export type ToScene =
  | {
      type: "start";
      canvas: OffscreenCanvas;
      tier: Exclude<Tier, "poster">;
      colors: Colors;
      pixelRatio: number;
      stage: Stage;
      words: Word[];
    }
  | { type: "layout"; stage: Stage; words: Word[] }
  | { type: "scroll"; top: number }
  | { type: "point"; at?: [x: number, y: number] }
  | { type: "run"; run: boolean };
/** "running" after the first frame; "gave-up" when the scene failed, lost its device or ran too slow. */
export type FromScene = { type: "running" } | { type: "gave-up" };

const post = (message: FromScene) => self.postMessage(message);

let scene: GlyphScene | undefined;
let frame = 0;
let last: number | undefined;
let run = false;
let started = false;
let over = false;
const samples: number[] = [];

function giveUp() {
  if (over) return;
  over = true;
  cancelAnimationFrame(frame);
  post({ type: "gave-up" });
  scene?.dispose();
}

function tick(now: number) {
  const dt = last === undefined ? 0 : Math.min(0.1, (now - last) / 1000);
  last = now;
  if (dt > 0 && samples.length < SAMPLE_FRAMES) samples.push(dt * 1000);
  if (tooSlow(samples)) return giveUp();
  scene?.frame(dt);
  if (!started) {
    started = true;
    post({ type: "running" });
  }
  frame = requestAnimationFrame(tick);
}

function sync() {
  if (run && scene && !over && !frame) {
    last = undefined;
    frame = requestAnimationFrame(tick);
  } else if ((!run || over) && frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

self.addEventListener("message", async (event: MessageEvent<ToScene>) => {
  const message = event.data;
  if (message.type === "start") {
    try {
      scene = await createScene(message.canvas, message.tier, message.colors, message.pixelRatio, giveUp);
      scene.layout(message.stage, message.words);
    } catch {
      giveUp();
    }
  } else if (message.type === "layout") {
    scene?.layout(message.stage, message.words);
  } else if (message.type === "scroll") {
    scene?.scroll(message.top);
  } else if (message.type === "point") {
    scene?.point(message.at);
  } else {
    run = message.run;
  }
  sync();
});
