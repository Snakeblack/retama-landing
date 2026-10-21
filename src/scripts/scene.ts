// Whether and when the 3D scene of ADR 0004 replaces the poster. The poster and the word are HTML and paint with the
// page; this waits for the page to load, the stage to be on screen and an idle moment, then probes the GPU and only
// then starts the scene in a worker on an OffscreenCanvas (scene-worker.ts): its download stays out of the start
// budget of ADR 0001 and its work off the main thread. It samples the HTML words, so the scene's glyphs land on their
// letters, and sends the scroll of the chapter under its pinned stage. Reduced motion, data saving, a software GPU, no
// OffscreenCanvas or a slow first second keep or bring back the poster. The scene pauses off screen, with the tab
// hidden and with a tap or click on it (WCAG 2.2.2).
import { readMotion } from "../lib/motion";
import { type Probe, sceneTier } from "../lib/scene-tier";
import type { Word } from "./scene-three";
import type { FromScene, ToScene } from "./scene-worker";

type State = "loading" | "running" | "poster";

const loaded = () =>
  new Promise<void>((resolve) => {
    if (document.readyState === "complete") resolve();
    else addEventListener("load", () => resolve(), { once: true });
  });

const idle = () =>
  new Promise<void>((resolve) => {
    if ("requestIdleCallback" in window) requestIdleCallback(() => resolve(), { timeout: 2000 });
    else setTimeout(resolve, 200);
  });

const onScreen = (tile: HTMLElement) =>
  new Promise<void>((resolve) => {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(tile);
  });

function webgl2() {
  const context = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
  context?.getExtension("WEBGL_lose_context")?.loseContext();
  return context !== null;
}

async function webgpu(): Promise<Probe["webgpu"]> {
  try {
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) return "none";
    return adapter.info.isFallbackAdapter ? "fallback" : "ok";
  } catch {
    return "none";
  }
}

/**
 * The ink of the HTML word as points, `step` pixels apart, in pixels from the chapter's top left. The word is drawn
 * again on a canvas with its own font, size and tracking, on the baseline the line box gives it.
 */
function sampleWord(chapter: HTMLElement, word: HTMLElement): Word {
  const box = word.getBoundingClientRect();
  const origin = chapter.getBoundingClientRect();
  const style = getComputedStyle(word);
  const fontSize = Number.parseFloat(style.fontSize);
  const step = Math.max(2.5, fontSize / 34);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(box.width) + 2;
  canvas.height = Math.ceil(box.height) + 2;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { samples: [], step };
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  if ("letterSpacing" in context) context.letterSpacing = style.letterSpacing;
  const text = (word.textContent ?? "").trim();
  const metrics = context.measureText(text);
  const ascent = metrics.fontBoundingBoxAscent;
  const leading = (box.height - ascent - metrics.fontBoundingBoxDescent) / 2;
  context.fillText(text, 0, leading + ascent);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const samples: Word["samples"] = [];
  for (let y = step / 2; y < canvas.height; y += step) {
    for (let x = step / 2; x < canvas.width; x += step) {
      if ((data[(Math.floor(y) * canvas.width + Math.floor(x)) * 4 + 3] ?? 0) > 128) {
        samples.push([box.left - origin.left + x, box.top - origin.top + y]);
      }
    }
  }
  return { samples, step };
}

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

async function start(tile: HTMLElement, chapter: HTMLElement, words: HTMLElement[]) {
  if (reducedMotion() || saveData()) return;
  await loaded();
  await onScreen(tile);
  await idle();
  await document.fonts.ready;

  const gpu = await webgpu();
  const tier = sceneTier({
    reducedMotion: reducedMotion(),
    saveData: saveData(),
    webgpu: gpu,
    webgl2: gpu === "ok" || webgl2(),
    offscreen: "transferControlToOffscreen" in HTMLCanvasElement.prototype,
  });
  tile.dataset.sceneTier = tier;
  if (tier === "poster") return;

  const root = getComputedStyle(document.documentElement);
  const motion = readMotion((name) => root.getPropertyValue(name));
  const css = (name: string) => root.getPropertyValue(name).trim();
  const button = tile.querySelector<HTMLButtonElement>("[data-scene-pause]");
  const canvas = document.createElement("canvas");
  canvas.className = "absolute inset-0 size-full";
  canvas.dataset.sceneCanvas = "";
  canvas.setAttribute("aria-hidden", "true");
  // Right over the poster, under the layer that pauses it.
  tile.querySelector("[data-retama-poster]")?.after(canvas);

  const worker = new Worker(new URL("./scene-worker.ts", import.meta.url), { type: "module" });
  const send = (message: ToScene, transfer: Transferable[] = []) => worker.postMessage(message, transfer);
  let visible = true;
  let paused = false;
  const cleanups: (() => void)[] = [];

  const setState = (state: State) => {
    tile.dataset.sceneState = state;
    if (button) button.hidden = state !== "running";
  };
  const giveUp = () => {
    if (tile.dataset.sceneState === "poster") return;
    setState("poster");
    for (const cleanup of cleanups) cleanup();
    // The canvas fades out over the poster before it goes.
    setTimeout(() => {
      worker.terminate();
      canvas.remove();
    }, motion.duration.reveal * 1000);
  };
  const sync = () => send({ type: "run", run: visible && !paused && !document.hidden });

  worker.addEventListener("message", (event: MessageEvent<FromScene>) => {
    if (event.data.type === "running") setState("running");
    else giveUp();
  });
  worker.addEventListener("error", giveUp);
  setState("loading");
  const offscreen = canvas.transferControlToOffscreen();
  send(
    {
      type: "start",
      canvas: offscreen,
      tier,
      colors: {
        ground: css("--color-surface"),
        ink: css("--color-on-surface"),
        muted: css("--color-on-surface-muted"),
        primary: css("--color-primary"),
      },
      pixelRatio: devicePixelRatio,
      stage: { width: tile.clientWidth, height: tile.clientHeight },
      words: words.map((word) => sampleWord(chapter, word)),
    },
    [offscreen],
  );

  // The camera follows the chapter as it scrolls under the pinned stage, one frame at a time.
  let scrolling = 0;
  const scroll = () => {
    if (scrolling) return;
    scrolling = requestAnimationFrame(() => {
      scrolling = 0;
      const top = -chapter.getBoundingClientRect().top;
      send({ type: "scroll", top: Math.min(Math.max(0, top), chapter.offsetHeight - tile.offsetHeight) });
    });
  };
  scroll();
  addEventListener("scroll", scroll, { passive: true });
  let laying = 0;
  const resize = new ResizeObserver(() => {
    clearTimeout(laying);
    laying = window.setTimeout(() => {
      send({
        type: "layout",
        stage: { width: tile.clientWidth, height: tile.clientHeight },
        words: words.map((word) => sampleWord(chapter, word)),
      });
      scroll();
    }, 150);
  });
  resize.observe(tile);
  cleanups.push(() => removeEventListener("scroll", scroll));
  const sight = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    sync();
  });
  sight.observe(tile);
  document.addEventListener("visibilitychange", sync);
  cleanups.push(() => {
    resize.disconnect();
    sight.disconnect();
    document.removeEventListener("visibilitychange", sync);
  });

  if (button) {
    const toggle = () => {
      paused = !paused;
      const label = paused ? button.dataset.play : button.dataset.pause;
      if (label) button.setAttribute("aria-label", label);
      sync();
    };
    button.addEventListener("click", toggle);
    cleanups.push(() => button.removeEventListener("click", toggle));
  }

  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    // Over the whole chapter, the word included: the text over the stage would hide the pointer from it.
    const follow = (event: PointerEvent) => {
      const box = tile.getBoundingClientRect();
      send({ type: "point", at: [event.clientX - box.left, event.clientY - box.top] });
    };
    const leave = () => send({ type: "point" });
    chapter.addEventListener("pointermove", follow);
    chapter.addEventListener("pointerleave", leave);
    cleanups.push(() => {
      chapter.removeEventListener("pointermove", follow);
      chapter.removeEventListener("pointerleave", leave);
    });
  }
  sync();
}

const tile = document.querySelector<HTMLElement>("[data-scene]");
const chapter = tile?.closest<HTMLElement>("[data-chapter]");
// The words the scene draws in glyphs, the first one the word the rain falls from.
const words = [...(chapter?.querySelectorAll<HTMLElement>("[data-glyph-word]") ?? [])];
if (tile && chapter && words.length > 0) void start(tile, chapter, words);
