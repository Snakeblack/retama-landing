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
// The sectors switcher holds each sector this long, in seconds, while its tour runs; the fragment moves four times.
const SECTOR_HOLD = 6;
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
 * A live example fragment: its rows move to the status written in their data-live, one by one with a flash, or the
 * white-label portal changes brand. It starts from the HTML state every time, so each showing tells the same story.
 */
function liveFragment(panel: HTMLElement, interval: number) {
  const rows = [...panel.querySelectorAll<HTMLElement>("[data-live]")].map((row) => {
    const text = row.querySelector<HTMLElement>("[data-live-text]");
    const mark = row.querySelector<HTMLElement>("[data-live-mark]");
    const from = { text: text?.textContent ?? "", alert: mark?.hasAttribute("data-alert") ?? false };
    const to = { text: row.dataset.live ?? "", alert: row.dataset.liveAlert === "true" };
    const show = (state: typeof from) => {
      if (text) text.textContent = state.text;
      mark?.toggleAttribute("data-alert", state.alert);
    };
    return { row, from, to, show };
  });
  const portal = panel.querySelector<HTMLElement>("[data-portal]");
  const headers = portal ? stack([...portal.querySelectorAll<HTMLElement>("[data-brand]")]) : undefined;
  const marks = [...(portal?.querySelectorAll<HTMLElement>("[data-brand-mark]") ?? [])];
  const brand = (index: number) => {
    for (const [i, mark] of marks.entries()) mark.toggleAttribute("data-active", i === index);
  };
  const reset = () => {
    for (const { row, from, show } of rows) {
      show(from);
      row.toggleAttribute("data-live-flash", false);
    }
    headers?.revert();
    brand(0);
  };
  return {
    reset,
    /** One showing: every step at its own interval, from the HTML state. */
    play() {
      const timeline = gsap.timeline().call(reset);
      if (portal) {
        for (const [step, index] of [1, 2, 0].entries()) {
          timeline.call(
            () => {
              headers?.show(index);
              brand(index);
            },
            [],
            (step + 1) * interval,
          );
        }
      }
      for (const [step, { row, to, show }] of rows.entries()) {
        const at = (step + 1) * interval;
        timeline
          .call(
            () => {
              show(to);
              row.toggleAttribute("data-live-flash", true);
            },
            [],
            at,
          )
          .call(() => row.toggleAttribute("data-live-flash", false), [], at + motion.duration.ui);
      }
      return timeline;
    },
  };
}

/**
 * The sectors switcher (DESIGN.md Motion): an exclusive accordion laid out as tabs. A tab stays open when pressed
 * again. With motion, each time the group comes on screen the tour runs once through the four sectors, filling the
 * bar under each tab for SECTOR_HOLD while its fragment comes alive; a new sector wipes in from the left. The pointer
 * or the focus on the switcher pauses the tour (WCAG 2.2.2) and choosing a tab ends it for good.
 */
function sectorsSwitcher(move: boolean) {
  const switcher = document.querySelector<HTMLElement>("[data-sectors]");
  if (!switcher) return;
  const parts = [...switcher.querySelectorAll<HTMLDetailsElement>(":scope > details")].flatMap((tab) => {
    const summary = tab.querySelector<HTMLElement>(":scope > summary");
    const panel = tab.querySelector<HTMLElement>("[data-sectors-panel]");
    const bar = tab.querySelector<HTMLElement>("[data-sectors-progress]");
    const interval = SECTOR_HOLD / 4;
    return summary && panel && bar ? [{ tab, summary, panel, bar, live: liveFragment(panel, interval) }] : [];
  });
  const bars = parts.map(({ bar }) => bar);
  const listeners: [EventTarget, string, EventListener][] = [];
  const on = (target: EventTarget, type: string, listener: EventListener) => {
    target.addEventListener(type, listener);
    listeners.push([target, type, listener]);
  };
  let stopped = false;
  let held = false;
  let visible = false;
  let showing: gsap.core.Timeline | undefined;
  let wipe: gsap.core.Tween | undefined;

  const tour = gsap.timeline({ paused: true });
  for (const [index, { tab, bar, live }] of parts.entries()) {
    const at = index * SECTOR_HOLD;
    tour
      .call(
        () => {
          gsap.set(bars, { "--progress": 0 });
          tab.open = true;
        },
        [],
        at,
      )
      .fromTo(
        bar,
        { "--progress": 0 },
        { "--progress": 1, duration: SECTOR_HOLD, ease: "none", immediateRender: false },
        at,
      )
      .add(() => {
        showing?.kill();
        showing = live.play();
      }, at);
  }
  const run = () => {
    if (!stopped && visible && !held) tour.resume();
  };

  for (const { tab, summary, panel, bar, live } of parts) {
    on(summary, "click", (event) => {
      if (tab.open) event.preventDefault();
      if (!move) return;
      stopped = true;
      tour.pause();
      gsap.set(bars, { "--progress": 0 });
      gsap.set(bar, { "--progress": 1 });
      showing?.kill();
      showing = live.play();
    });
    if (!move) continue;
    on(tab, "toggle", () => {
      if (!tab.open) return;
      wipe?.progress(1);
      wipe = gsap.fromTo(
        panel,
        { clipPath: "inset(0 100% 0 0)" },
        { clipPath: "inset(0 0% 0 0)", duration: motion.duration.reveal, ease: motion.ease.inOut },
      );
    });
  }
  if (!move) {
    return () => {
      for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
    };
  }

  const hold = (value: boolean) => () => {
    held = value;
    if (held) tour.pause();
    else run();
  };
  on(switcher, "pointerenter", hold(true));
  on(switcher, "pointerleave", hold(false));
  on(switcher, "focusin", hold(true));
  on(switcher, "focusout", (event) => {
    if (!switcher.contains((event as FocusEvent).relatedTarget as Node | null)) hold(false)();
  });
  gsap.set(bars, { "--progress": 0 });
  const enter = () => {
    visible = true;
    if (stopped) return;
    tour.restart();
    if (held) tour.pause();
  };
  const leave = () => {
    visible = false;
    tour.pause();
  };
  const watch = ScrollTrigger.create({
    trigger: switcher,
    start: "top 75%",
    end: "bottom 25%",
    onEnter: enter,
    onEnterBack: enter,
    onLeave: leave,
    onLeaveBack: leave,
  });
  return () => {
    watch.kill();
    tour.kill();
    showing?.kill();
    wipe?.kill();
    for (const [target, type, listener] of listeners) target.removeEventListener(type, listener);
    for (const { live } of parts) live.reset();
    gsap.set([...bars, ...parts.map(({ panel }) => panel)], { clearProps: "--progress,clipPath" });
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
  const { move = false, still = false, hover = false } = context.conditions ?? {};
  if (!move && !still) return;
  entrances(move);
  const cleanups = [sectorsSwitcher(move), move ? countUp() : undefined, codeLens({ hover, move })];
  return () => {
    for (const cleanup of cleanups) cleanup?.();
  };
});
