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
const QUERIES = {
  move: "(prefers-reduced-motion: no-preference)",
  still: "(prefers-reduced-motion: reduce)",
  hover: "(hover: hover) and (pointer: fine)",
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
      } else if (tile.matches("ul, ol, [data-rows]")) {
        timeline.from(tile.children, { opacity: 0, y: RISE, stagger: motion.stagger.line }, at);
      } else {
        timeline.from(tile, { opacity: 0, y: RISE }, at);
      }
    });
    ScrollTrigger.create({ trigger: group, start: "top 85%", once: true, onEnter: () => void timeline.play() });
  }
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

/** The code lens over the name band: a circle that follows the pointer shows the letters made of code. */
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
    // Touch screens get one pass across the name after loading; reduced motion, one fade in and out.
    const box = lens.getBoundingClientRect();
    const radius = Number.parseFloat(getComputedStyle(lens).getPropertyValue("--lens-r")) || 0;
    Object.assign(position, { x: -radius, y: box.height / 2 });
    paint();
    const pass = gsap.timeline({ delay: motion.duration.open });
    pass.to(lens, { "--lens": 1, duration: motion.duration.ui, ease: motion.ease.out });
    if (move) {
      pass.to(
        position,
        { x: box.width + radius, duration: motion.duration.open * 2, ease: motion.ease.inOut, onUpdate: paint },
        0,
      );
    } else {
      pass.to({}, { duration: motion.duration.reveal });
    }
    pass.to(lens, { "--lens": 0, duration: motion.duration.ui, ease: motion.ease.out });
    return () => pass.kill();
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
  const { move = false, still = false, hover = false } = context.conditions ?? {};
  if (!move && !still) return;
  entrances(move);
  const cleanups = [move ? countUp() : undefined, codeLens({ hover, move })];
  return () => {
    for (const cleanup of cleanups) cleanup?.();
  };
});
