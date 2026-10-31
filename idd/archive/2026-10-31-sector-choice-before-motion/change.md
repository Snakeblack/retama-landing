# sector-choice-before-motion

## Intent and acceptance

Sectors switcher: a choice, pointer or focus that comes before the motion layer is ignored; the tour starts and overrides the visitor's sector (flaky E2E 'elegir un sector detiene la vuelta')

Acceptance: A sector chosen before the motion layer arrives stays open and the tour never runs; with the pointer or the focus already on the switcher when the layer arrives, the tour starts paused; the E2E for choosing before and after the layer pass deterministically

### Cause

Home.astro asks for the motion layer after the load and the first paint, and motion.ts sets the board up a step a task,
so a visitor can use the switcher before `sectorsSwitcher` runs. Once it runs with the switcher on screen, its
ScrollTrigger enters at once and `tour.restart()` opens the first sector, the second six seconds later. Measured on the
build with the GSAP chunk held back until after the click: sector 2 chosen, then 0 when the layer came, then 1 at 7 s;
the pointer left on the switcher did not pause it either, since `pointerenter` and `focusin` had already happened. The
E2E "elegir un sector detiene la vuelta…" failed whenever its click beat the layer (Received 0 or 1, also on main).

Left out on purpose: a visitor who picks another sector and goes back to the first before the layer looks untouched;
the tour then starts on the sector they have open and moves on after six seconds.

## Plan

<!-- ospec:plan:start -->
- Files: `src/scripts/motion.ts`, `tests/e2e/motion.spec.ts`
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- A choice before the layer is read from the switcher's state at set-up: an open tab other than the first, or none open, is a choice and the tour never runs; the tabs stay as the visitor left them, none open included (user, 2026-10-31)
- A choice before the layer counts as one made with it: the click's effect (tour stopped, full bar under the chosen tab, its fragment alive) moves to a choose() both use
- The pointer over the switcher or the focus inside it when the layer arrives holds the tour (user, 2026-10-31); the pointer counts only where it can hover, since a touch screen keeps :hover after a tap
- E2E: page.route holds the build scripts that carry ScrollTrigger to use the switcher before the layer; the inline --progress on the bars tells the layer has set the switcher up
<!-- ospec:decisions:end -->

## Evidence

<!-- ospec:evidence:start -->
- ev-1: repro-run-pair for repro-test (2026-10-31T17:16:15.245Z)
- ev-2: check-run for checks-pass (2026-10-31T17:21:38.541Z)
- ev-3: check-run for checks-pass (2026-10-31T17:23:25.184Z)
- ev-4: living-doc-current for living-doc (2026-10-31T17:23:25.202Z)
<!-- ospec:evidence:end -->
