// The motion layer of DESIGN.md "Motion and 3D". Every word is in the HTML before this runs (ADR 0001): the script
// sets the hidden starting states it then animates, so without it the board is simply there. It only touches
// transform, opacity, clip-path, colours through attributes and custom properties (CSSOM, allowed by the CSP of
// ADR 0006). The shutter is CSS (global.css) and needs nothing from here.
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { readMotion } from "../lib/motion";

gsap.registerPlugin(ScrollTrigger);

const root = getComputedStyle(document.documentElement);
const motion = readMotion((name) => root.getPropertyValue(name));
// DESIGN.md: entrances rise 16–32px; the spacing token lg sits in that range.
const RISE = Number.parseFloat(root.getPropertyValue("--spacing-lg"));
// The pinned sectors scene holds the group for two and a half screens, one quarter per sector.
const SCENE_SCREENS = 2.5;
const QUERIES = {
  move: "(prefers-reduced-motion: no-preference)",
  still: "(prefers-reduced-motion: reduce)",
  hover: "(hover: hover) and (pointer: fine)",
  wide: "(min-width: 64rem)",
};

/** Inside each group the tiles enter in order, once, as the group arrives; lists arrive row by row. */
function entrances(move: boolean) {
  for (const group of document.querySelectorAll<HTMLElement>("main section[id]")) {
    const timeline = gsap.timeline({
      paused: true,
      defaults: { duration: motion.duration.reveal, ease: motion.ease.out },
    });
    [...group.children].forEach((tile, index) => {
      const at = index * motion.stagger.item;
      if (!move) {
        timeline.from(tile, { opacity: 0 }, at);
      } else if (tile.querySelector(":scope > picture, :scope > [data-ui]")) {
        timeline.from(tile, { clipPath: "inset(0 0 100% 0)", ease: motion.ease.expo }, at);
      } else if (tile.matches("ul, ol, [data-rows], [data-sectors]")) {
        // The sectors scene enters by its visible pieces, which stay boxes when it is pinned.
        const rows = tile.matches("[data-sectors]")
          ? tile.querySelectorAll("[data-sectors-title], [data-sectors-name], [data-sectors-frame]")
          : tile.children;
        timeline.from(rows, { opacity: 0, y: RISE, stagger: motion.stagger.line }, at);
      } else {
        timeline.from(tile, { opacity: 0, y: RISE }, at);
      }
    });
    ScrollTrigger.create({ trigger: group, start: "top 85%", once: true, onEnter: () => void timeline.play() });
  }
}

/** Tiles stacked in one place: showing one wipes it in from the left over the rest, never left half cut. */
function stack(tiles: HTMLElement[]) {
  let top = 1;
  let wipe: gsap.core.Tween | undefined;
  return {
    show(index: number, travel = true) {
      const tile = tiles[index];
      if (!tile) return;
      wipe?.progress(1);
      gsap.set(tile, { zIndex: ++top });
      wipe = travel
        ? gsap.fromTo(
            tile,
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: motion.duration.reveal, ease: motion.ease.inOut },
          )
        : undefined;
    },
    revert() {
      wipe?.kill();
      gsap.set(tiles, { clearProps: "zIndex,clipPath" });
    },
  };
}

/**
 * The pinned sectors scene, from lg with motion: the group holds and each quarter of the hold belongs to one sector.
 * Crossing into a quarter marks its name and wipes its fragment in; the wipe is timed, not scrubbed. Without this the
 * four sectors simply stack, each with its fragment.
 */
function sectorsScene() {
  const scene = document.querySelector<HTMLElement>("[data-sectors]");
  if (!scene) return;
  const names = [...scene.querySelectorAll<HTMLElement>("[data-sectors-name]")];
  const frames = stack([...scene.querySelectorAll<HTMLElement>("[data-sectors-frame]")]);
  let active = 0;
  const show = (index: number) => {
    if (index === active) return;
    for (const [i, name] of names.entries()) name.toggleAttribute("data-active", i === index);
    frames.show(index);
    active = index;
  };
  scene.toggleAttribute("data-pinned", true);
  // A scene taller than the window cannot be held whole: it stays stacked.
  if (scene.offsetHeight > window.innerHeight) {
    scene.toggleAttribute("data-pinned", false);
    return;
  }
  names[0]?.toggleAttribute("data-active", true);
  frames.show(0, false);
  const pin = ScrollTrigger.create({
    trigger: scene,
    start: "center center",
    end: () => `+=${window.innerHeight * SCENE_SCREENS}`,
    pin: true,
    refreshPriority: 1,
    onUpdate: ({ progress }) => show(Math.min(names.length - 1, Math.floor(progress * names.length))),
  });
  return () => {
    pin.kill();
    frames.revert();
    scene.toggleAttribute("data-pinned", false);
    for (const name of names) name.toggleAttribute("data-active", false);
  };
}

/** The white-label example cycles its brands while it is on screen: the header wipes to the next and the list marks it. */
function portalCycle() {
  const portal = document.querySelector<HTMLElement>("[data-portal]");
  if (!portal) return;
  const headers = stack([...portal.querySelectorAll<HTMLElement>("[data-brand]")]);
  const marks = [...portal.querySelectorAll<HTMLElement>("[data-brand-mark]")];
  const mark = (index: number) => {
    for (const [i, brand] of marks.entries()) brand.toggleAttribute("data-active", i === index);
  };
  let current = 0;
  const cycle = gsap.timeline({ repeat: -1, paused: true }).call(
    () => {
      current = (current + 1) % marks.length;
      headers.show(current);
      mark(current);
    },
    [],
    motion.duration.open * 2,
  );
  const watch = ScrollTrigger.create({
    trigger: portal,
    onToggle: ({ isActive }) => void (isActive ? cycle.play() : cycle.pause()),
  });
  return () => {
    watch.kill();
    cycle.kill();
    headers.revert();
    mark(0);
  };
}

/** A figure counts up once from zero to the value written in the HTML, which it puts back when reverted. */
function countUp() {
  const figures = [...document.querySelectorAll<HTMLElement>("[data-count]")].map((figure) => ({
    figure,
    text: figure.textContent ?? "",
  }));
  for (const { figure, text } of figures) {
    const target = Number(text.trim());
    if (!Number.isInteger(target) || target <= 0) continue;
    const value = { n: 0 };
    const tween = gsap.to(value, {
      n: target,
      paused: true,
      duration: motion.duration.open,
      ease: motion.ease.out,
      onUpdate: () => {
        figure.textContent = String(Math.round(value.n));
      },
    });
    figure.textContent = "0";
    ScrollTrigger.create({ trigger: figure, start: "top 90%", once: true, onEnter: () => void tween.play() });
  }
  return () => {
    for (const { figure, text } of figures) figure.textContent = text;
  };
}

/**
 * The code lens over the name band. With a fine pointer, a circle that follows it shows the letters made of
 * code; on touch screens the code sweeps once across the whole name from the left, holds and leaves to the right.
 */
function codeLens({ hover, move }: { hover: boolean; move: boolean }) {
  const lens = document.querySelector<HTMLElement>("[data-lens]");
  const band = lens?.parentElement;
  if (!lens || !band) return;
  const position = { x: 0, y: 0 };
  const paint = () => {
    lens.style.setProperty("--lens-x", `${position.x}px`);
    lens.style.setProperty("--lens-y", `${position.y}px`);
  };
  const show = (to: number, duration = motion.duration.ui) =>
    gsap.to(lens, { "--lens": to, duration, ease: motion.ease.out, overwrite: "auto" });
  lens.toggleAttribute("data-lens-still", !move);

  if (!hover) {
    // After the shutter: one sweep across the name; with reduced motion, one fade in and out.
    lens.toggleAttribute("data-lens-wipe", move);
    const pass = gsap.timeline({ delay: motion.duration.open });
    if (move) {
      const sweep = { duration: motion.duration.open, ease: motion.ease.inOut };
      pass
        .set(lens, { "--lens": 1, "--wipe-lead": 0, "--wipe-tail": 0 })
        .to(lens, { "--wipe-lead": 1, ...sweep })
        .to(lens, { "--wipe-tail": 1, ...sweep }, `+=${motion.duration.reveal}`)
        .set(lens, { "--lens": 0 });
    } else {
      pass
        .to(lens, { "--lens": 1, duration: motion.duration.ui, ease: motion.ease.out })
        .to(lens, { "--lens": 0, duration: motion.duration.ui, ease: motion.ease.out }, `+=${motion.duration.reveal}`);
    }
    return () => {
      pass.kill();
      lens.toggleAttribute("data-lens-wipe", false);
      gsap.set(lens, { "--lens": 0 });
    };
  }

  const options = { duration: motion.duration.ui, ease: motion.ease.out, onUpdate: paint };
  const toX = gsap.quickTo(position, "x", options);
  const toY = gsap.quickTo(position, "y", options);
  const follow = (event: PointerEvent, jump = false) => {
    const box = lens.getBoundingClientRect();
    const x = event.clientX - box.left;
    const y = event.clientY - box.top;
    if (jump) {
      Object.assign(position, { x, y });
      paint();
    }
    toX(x);
    toY(y);
  };
  const enter = (event: PointerEvent) => {
    follow(event, true);
    show(1);
  };
  const leave = () => show(0);
  band.addEventListener("pointerenter", enter);
  band.addEventListener("pointermove", follow);
  band.addEventListener("pointerleave", leave);
  return () => {
    band.removeEventListener("pointerenter", enter);
    band.removeEventListener("pointermove", follow);
    band.removeEventListener("pointerleave", leave);
  };
}

const media = gsap.matchMedia();
media.add(QUERIES, (context) => {
  const { move = false, still = false, hover = false, wide = false } = context.conditions ?? {};
  if (!move && !still) return;
  // Entrances go first: once pinned, the group's child is the pin spacer, and a transform on it would undo the pin.
  // The pin refreshes first anyway (refreshPriority), so the entrances below it measure the height of the hold.
  entrances(move);
  const scene = move && wide ? sectorsScene() : undefined;
  const cleanups = [scene, move ? portalCycle() : undefined, move ? countUp() : undefined, codeLens({ hover, move })];
  return () => {
    for (const cleanup of cleanups) cleanup?.();
  };
});
