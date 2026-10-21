// Whether and when the 3D scene of ADR 0004 replaces the poster. The poster is HTML and paints with the page; this
// waits for the page to load, the tile to be on screen, an idle moment and the shutter, then probes the GPU and only
// then starts the scene in a worker on an OffscreenCanvas (scene-worker.ts): its download stays out of the start
// budget of ADR 0001 and its work off the main thread. Reduced motion, data saving, a software GPU, no OffscreenCanvas
// or a slow first second keep or bring back the poster. The scene pauses off screen, with the tab hidden and with a
// tap or click on it (WCAG 2.2.2).
import { readMotion } from "../lib/motion";
import { type Probe, sceneTier } from "../lib/scene-tier";
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

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const saveData = () => (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

async function start(tile: HTMLElement) {
  if (reducedMotion() || saveData()) return;
  await loaded();
  await onScreen(tile);
  await idle();
  await Promise.all(tile.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})));

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
        ink: css("--color-on-surface"),
        muted: css("--color-on-surface-muted"),
        primary: css("--color-primary"),
      },
      pixelRatio: devicePixelRatio,
      width: tile.clientWidth,
      height: tile.clientHeight,
    },
    [offscreen],
  );

  const resize = new ResizeObserver(([entry]) => {
    if (entry) send({ type: "resize", width: entry.contentRect.width, height: entry.contentRect.height });
  });
  resize.observe(tile);
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
    const follow = (event: PointerEvent) => {
      const box = tile.getBoundingClientRect();
      send({ type: "point", at: [event.clientX - box.left, event.clientY - box.top] });
    };
    const leave = () => send({ type: "point" });
    tile.addEventListener("pointermove", follow);
    tile.addEventListener("pointerleave", leave);
    cleanups.push(() => {
      tile.removeEventListener("pointermove", follow);
      tile.removeEventListener("pointerleave", leave);
    });
  }
  sync();
}

const tile = document.querySelector<HTMLElement>("[data-scene]");
if (tile) void start(tile);
