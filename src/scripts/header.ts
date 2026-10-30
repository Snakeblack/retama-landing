// DESIGN.md Layout, the floating header. It leaves while the page scrolls down and comes back as soon as it scrolls
// up, and never leaves while the keyboard is in it. The chapter index of phones is a native modal dialog opened by
// invoker commands (ChapterIndex.astro); this script closes it when one of its links is chosen, marks the chapter on
// screen and opens it where invoker commands do not exist. Without the script the header simply stays.

// DESIGN.md Elevation & Depth: on the home the grain of the grounds comes on once the page has loaded, below the first
// screen, so painting its noise never holds back the first one (global.css). A page without the scene has it in its
// HTML already (Base.astro).
addEventListener("load", () => document.documentElement.setAttribute("data-grain", ""), { once: true });

// Scrolls shorter than this, in pixels, are the jitter of a finger or an inertial stop, not a direction.
const SLACK = 8;

const bar = document.querySelector<HTMLElement>("[data-header-bar]");

if (bar) {
  let last = scrollY;
  const keyboardIn = () => bar.matches(":has(:focus-visible)");

  addEventListener(
    "scroll",
    () => {
      const y = scrollY;
      if (Math.abs(y - last) < SLACK) return;
      bar.toggleAttribute("data-hidden", y > last && y > bar.offsetHeight && !keyboardIn());
      last = y;
    },
    { passive: true },
  );
  bar.addEventListener("focusin", () => {
    if (keyboardIn()) bar.removeAttribute("data-hidden");
  });
}

const index = document.querySelector<HTMLDialogElement>("[data-index]");

if (index) {
  const links = [...index.querySelectorAll<HTMLAnchorElement>("[data-index-link]")];
  const opener = document.querySelector<HTMLButtonElement>("[data-index-open]");

  // The chapter on screen is the last one whose top has passed the middle of the screen; above them all, the first.
  const markCurrent = () => {
    let current = links[0];
    for (const link of links) {
      const chapter = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (chapter && chapter.getBoundingClientRect().top <= innerHeight / 2) current = link;
    }
    for (const link of links) {
      if (link === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    }
  };

  opener?.addEventListener("click", markCurrent);
  index.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("[data-index-link]")) index.close();
  });

  if (!("command" in HTMLButtonElement.prototype)) {
    opener?.addEventListener("click", () => index.showModal());
    index.querySelector("[data-index-close]")?.addEventListener("click", () => index.close());
  }
}
