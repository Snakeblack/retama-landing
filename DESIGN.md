---
version: alpha
name: Retama
description: Graphite chapters of flat tiles with one safety-orange accent, set in Stack Sans. Art direction "Colour chapters" (taste-skill colour-chapters, M2.5) over the tiles of "The well-kept board" (dense-tiles, M1).
colors:
  primary: "#FF4A1F"
  on-primary: "#18191B"
  surface: "#18191B"
  surface-raised: "#222427"
  on-surface: "#EFF0F1"
  on-surface-muted: "#9C9EA3"
  field: "#EFF0F1"
  on-field: "#18191B"
typography:
  display:
    fontFamily: Stack Sans Headline
    fontSize: 200px
    fontWeight: 300
    lineHeight: "0.9"
    letterSpacing: -0.022em
  display-sm:
    fontFamily: Stack Sans Headline
    fontSize: 72px
    fontWeight: 300
    lineHeight: "0.9"
    letterSpacing: -0.022em
  headline:
    fontFamily: Stack Sans Headline
    fontSize: 64px
    fontWeight: 300
    lineHeight: "1.05"
    letterSpacing: -0.022em
  headline-sm:
    fontFamily: Stack Sans Headline
    fontSize: 36px
    fontWeight: 300
    lineHeight: "1.05"
    letterSpacing: -0.022em
  statement:
    fontFamily: Stack Sans Headline
    fontSize: 32px
    fontWeight: 300
    lineHeight: "1.2"
    letterSpacing: -0.011em
  statement-sm:
    fontFamily: Stack Sans Headline
    fontSize: 22px
    fontWeight: 300
    lineHeight: "1.25"
    letterSpacing: -0.011em
  wordmark:
    fontFamily: Stack Sans Headline
    fontSize: 28px
    fontWeight: 500
    lineHeight: "1"
    letterSpacing: -0.02em
  body:
    fontFamily: Stack Sans Text
    fontSize: 18px
    fontWeight: 400
    lineHeight: "1.5"
  body-strong:
    fontFamily: Stack Sans Text
    fontSize: 18px
    fontWeight: 500
    lineHeight: "1.5"
  label:
    fontFamily: Stack Sans Text
    fontSize: 18px
    fontWeight: 500
    lineHeight: "1.2"
  small:
    fontFamily: Stack Sans Text
    fontSize: 14px
    fontWeight: 400
    lineHeight: "1.45"
rounded:
  tile: 0px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  2xl: 96px
  margin: 12px
  gap: 8px
  tile: 24px
  tile-sm: 20px
  row: 96px
  section: 128px
  bar: 6px
  focus: 2px
  touch: 48px
  measure: 640px
components:
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
  top-bar:
    backgroundColor: "{colors.primary}"
    height: "{spacing.bar}"
  wordmark:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.wordmark}"
  display:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.display}"
  display-phone:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.display-sm}"
  heading:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline}"
  heading-phone:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.headline-sm}"
  tile:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.tile}"
    padding: "{spacing.tile}"
  tile-phone:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.tile}"
    padding: "{spacing.tile-sm}"
  tile-statement:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.statement}"
  tile-statement-phone:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.statement-sm}"
  tile-run-in:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-strong}"
  tile-caption:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.small}"
  tile-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-field}"
    typography: "{typography.statement}"
    rounded: "{rounded.tile}"
    padding: "{spacing.tile}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.tile}"
    height: "{spacing.touch}"
    padding: "{spacing.lg}"
  button-primary-hover:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-field}"
  link:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
  link-quiet:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.small}"
  focus-ring:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    size: "{spacing.focus}"
---

# Retama

## Overview

Retama is a remote-only software engineering firm from Spain. The page has to read as serious, elegant and technically ahead, with little text and a picture behind every claim (`docs/product/brief.md`).

The art direction is **Colour chapters**, dealt by taste-skill (`colour-chapters`, seed 716104575, sector agency, tone technical, palette and type kept) for the M2.5 redesign the owner chose on 2026-10-21. It follows **The well-kept board** (`dense-tiles`, seed 571009059, M1), whose tiles, tokens and fragments it keeps: the board packed six to ten tiles into every screen, so the page read dense rather than direct.

The home is a sequence of chapters, one idea per screen, and the scroll tells it: the word of what Retama makes with the retama growing under it, the manifesto, the services, the sectors, the method and the contact. Inside a chapter the content still sits on flat tiles fitted edge to edge with narrow gaps; between chapters the ground may change, but never inside one. The page stays graphite, and the method chapter turns to the light paper of the field. The redesign lands chapter by chapter (docs/roadmap.md, M2.5); a group not rebuilt yet keeps its board tiles.

**The idea.** A retama lives on poor, dry ground because of what nobody sees: a root system many times deeper than the shrub is tall. Retama works the same way: the visible software stands on documented decisions underneath. On this page, **the retama's deep roots and the firm's written decisions become the page's chapters**: the scene of the first chapter grows the plant's stems and roots under the word of what Retama makes, and the method tiles read like decision records (a number, a decision, its reason). The live thing comes from the same idea: in the method group the visitor picks one of four kinds of project and reads the first three decisions Retama would record for it. It is a native exclusive accordion (`<details name>`), so it works without JavaScript and keeps nothing in the URL.

## Colors

Graphite and safety orange. Graphite takes most of the board; one light field appears on a few chosen tiles; orange is the only accent.

- **Surface (#18191B):** graphite, the ground of every page and the gaps between tiles.
- **Surface raised (#222427):** one tone step lighter, the fill of ordinary tiles. Tiles are told apart from the ground by this step alone.
- **On surface (#EFF0F1):** a soft light ink for headlines, running text and links. Running text is always in this full ink.
- **On surface muted (#9C9EA3):** captions, small print and quiet links only; never running text.
- **Field (#EFF0F1) and On field (#18191B):** the inverted tile, used for one or two statements per screen at most.
- **Primary (#FF4A1F) and On primary (#18191B):** safety orange marks the main action, the thick bar across the top of the page and the highlighted item in a list. Under 5% of any screen.

Contrast on the ground: on-surface 15.4:1, on-surface-muted 6.6:1 and primary 5.2:1; on a raised tile, on-surface 13.6:1 and on-surface-muted 5.8:1. Every text pair passes WCAG AA, and `pnpm design:lint` checks each component pair. Photographs are shown in greyscale so nothing competes with the accent.

## Typography

**Stack Sans** (SIL Open Font License), self-hosted from the pinned `@fontsource-variable/stack-sans-headline` and `@fontsource-variable/stack-sans-text` packages through Astro's font API, which also generates metric-matched fallbacks so the swap does not shift the layout. Only the latin subset ships; it covers Spanish and English.

- **Stack Sans Headline** sets everything at large size, in a light 300 weight with tight tracking: the word of the first chapter at display size, section headings and single statements inside tiles. The wordmark uses the same face at 500.
- **Stack Sans Text** sets running text at 400, run-in phrases and action labels at 500, and small print.

The page uses five sizes on desktop: 14 (small), 18 (body, labels), 32 (statement), 64 (headline) and 200 (display). On phones, below the `md` breakpoint (768px), the large three step down to 22, 36 and 72 (the `-sm` tokens); the display word keeps its phone size up to `lg` (1024px), because at 200px it needs the width of the 12-column grid. Each level is one utility generated with the theme, `type-<level>` (for example `type-headline-sm md:type-headline`), which sets family, size, line height, tracking and weight together. Sentence case everywhere; no uppercase labels, no monospace (the one exception is the texture inside the code lens, see Motion and 3D), no styled accent word inside a headline. A heading may be two-tone, muted then full ink.

## Layout

A 12-column grid that fills the viewport with **12px outer margins** and **8px gaps** at every width. Tiles take only four sizes on the mosaic (6×5, 6×3, 3×3 and 3×2 columns × 96px rows), so the board stays a system and never becomes a card grid: neighbouring tiles never hold the same kind of thing. Text inside a tile is top-left aligned on 24px padding (20px on phones) and is never centred. Running text stops at 640px (`measure`).

Chapters (services, sectors, method, questions, contact) are separated by 128px (`section`), clearly more than any gap inside one, and each opens with a heading that names it. The first chapter carries the page's one `h1`.

The header is a plain bar: the wordmark, the links to the services, sectors and method chapters (their anchors are translated per language) and the language switch; on phones the links take a row of their own under the other two. The one action, **Hablemos**, is a button-primary fixed to the lower right corner on the page margin. It fades out while the first chapter (which has its own action) or the contact chapter is on screen, through scroll-driven animations; where those do not exist, or with the keyboard on it, it simply stays.

The phone is its own board: two columns with the same gaps, re-ordered so the word and the lead come first, the scene spans both columns and pairs of small tiles sit side by side. On touch screens the board's text is not selectable, so a scroll or a tap never starts a selection; the contact group stays selectable so the address can be copied. The two-column board holds up to the `lg` breakpoint (1024px); the 12-column mosaic starts there, because below it a 3-column tile is too narrow for a statement. Rows are 96px and grow when a tile's content needs more (the `board-rows` utility), and a picture never sizes its row: it fills its tile absolutely.

The first chapter says what Retama makes in one word: "Software" at display size with "a medida" (made to measure) at headline size under it, together the page's `h1`, on the ground and not on a tile; beside it, from `lg`, the lead sentence and the action, an orange button that leads to the contact chapter; and across the whole width the scene tile, 16:9, where the retama grows under the word. "Retama" is only the wordmark in the header. On phones the word, the lead, the action and the scene follow each other.

## Elevation & Depth

None. There are no shadows, glows, gradients, blurs or outlines on things at rest. Depth comes only from the tone step between surface and surface raised, and from the inverted field. A shadow is allowed on what truly floats (a menu, a dialog), and nothing floats yet.

## Shapes

Square corners on everything: tiles, photographs, the action and form fields (`rounded.tile` is 0). A thick bar of 6px in primary runs across the top of the page; it is the only line on the board.

## Components

- **page:** ground, ink and body type of every page.
- **top-bar:** the 6px primary bar across the top of the page.
- **wordmark:** "Retama" drawn from Stack Sans Headline 500, as an inline SVG that takes the ink colour; the name is also in the page text for assistive technology.
- **display / display-phone:** the word of the first chapter.
- **heading / heading-phone:** the heading tile that opens each group.
- **tile / tile-phone:** an ordinary filled tile.
- **tile-statement / tile-statement-phone:** a tile that holds one sentence at statement size.
- **tile-run-in:** the bold run-in phrase that opens a small paragraph.
- **tile-caption:** small muted text inside a tile.
- **tile-field:** the inverted tile.
- **button-primary / button-primary-hover:** the one action, a filled orange rectangle at least 48px tall; on hover and press it inverts to the light field.
- **link / link-quiet:** text links in full ink with an underline; quiet links in muted small type.
- **focus-ring:** a 2px primary outline with a 2px offset on every focusable element.

## Imagery

The retama is the brand's signature, not its subject: a visitor has to read a software firm within five seconds, and a board full of plants reads as a nursery. So the plant appears only twice: the scene of the first chapter, and the Clusius plate in the method group, where the field tile beside it spells the idea out (roots deeper than the plant, decisions under the software). Every other picture slot holds an interface fragment drawn in HTML and marked `data-ui`: real work of this site where there is some (the decision record behind the 3D scene, shown in the method chapter, and the quality gates every change passes), and otherwise an example that carries a visible "Example" label, never presented as a client's work (one per sector in the sectors group: a route dispatch panel, an approvals queue, a game economy editor and one client portal under three made-up brands). Fragments use the board's tokens: tiles in surface-raised, rows in surface, small type, the primary square as status mark, no borders or shadows. A found picture comes from an open collection with a licence that allows commercial use, is downloaded into the repository and credited in the footer. It is greyscale and baked that way into the file; an engraved plate is inverted onto the graphite, its paper turned into the raised tile tone and its lines into the light ink, so it reads as part of the board. Every picture is square-cornered and covers its tile with `object-fit: cover`, and a found picture shows the world around Retama, never Retama's product, office or team.

## Motion and 3D

Motion makes the board feel alive and never carries content: every word is in the HTML before any script runs (ADR 0001), and animations only touch `transform`, `opacity` and `clip-path`.

| Token | Value | Use |
| --- | --- | --- |
| ease-out | cubic-bezier(0.22, 1, 0.36, 1) | entrances, moving hovers, interface under 600ms |
| ease-expo | cubic-bezier(0.16, 1, 0.3, 1) | reveals of 800ms or longer, the shutter |
| ease-in-out | cubic-bezier(0.76, 0, 0.24, 1) | wipes and panels that travel while visible |
| ease-soft | cubic-bezier(0.33, 1, 0.68, 1) | slow scale and drift on pictures |
| ease-exit | cubic-bezier(0.55, 0.055, 0.675, 0.19) | something leaving for good, short |
| t-press | 140ms | press feedback |
| t-hover | 180ms | colour hovers |
| t-ui | 240ms | hovers that move something, accordions |
| t-reveal | 800ms | section entrances |
| t-open | 1100ms | the shutter |
| stagger-line | 90ms | lines of one statement |
| stagger-item | 70ms | tiles of one group |

This table is the only place these values are written: `pnpm design:theme` generates them into `src/styles/theme.css` as custom properties (`--ease-out`, `--t-ui`, `--stagger-item`…), CSS uses them as `var()` and the motion script reads them back from the page (`src/lib/motion.ts`).

The budget, per page:

- **One signature move, the shutter:** the scene tile of the first chapter opens from its lower edge with a clip-path over `t-open` while the picture inside settles from 1.12 scale to rest. It happens once, in CSS on the first paint, so it needs no script.
- **A second signature move, the code:** the word of the first chapter is made of the site's own code (`src/lib/retama-shape.ts`, the generator of the scene) in tiny system monospace, the one place monospace appears, as texture and never as content to read. The layer is a copy of the word clipped to its own letters, so it lines up exactly. **The decode:** on the first paint the word is all code; it holds for `t-reveal` and settles into solid ink from the left over `t-open`, as a soft edge sweeps the code off to the right. It is CSS, on every screen, and the ink word underneath is painted from the first frame, so it never delays the largest paint. **The lens:** afterwards, on a pointer screen, a circle that follows the pointer shows the code again through a circular mask moved by custom properties. With reduced motion there is no decode, and the lens does not travel: the code fades in over the whole word while the pointer is on it. The first chapter has no other entrance.
- **Entrances:** inside each group, the heading, then the text, then the picture, staggered by `stagger-item`, rising 16–32px with opacity, once, as the group enters. A list arrives row by row and a figure counts up once; never the same fade on every block. The hidden starting state is set by the script itself, so without it everything is simply there.
- **Feedback on every control:** press, hover and focus on the action, links, tiles that link and the live thing.
- **One moving picture:** the 3D scene, which grows, sways in the wind and carries sap (below).
- **No pinned scroll scene.** Scrolling is never held to show content: a visitor should not pay with scroll for little information. The sectors are a **switcher** instead, the same on phones and desktop and shorter than one screen: a native exclusive accordion laid out as four tabs (two by two on phones), each sector with the client's problem, three things Retama builds and its example fragment. Each time the group comes on screen a tour runs once through the four sectors, six seconds each, with a bar filling under the open tab; the new sector wipes in from the left over `t-reveal` with ease-in-out and its fragment comes alive like a working app, its rows moving to their next status one by one (the next status is written in the HTML) or the white-label portal changing brand. The pointer or the focus on the switcher pauses the tour, choosing a tab ends it, and a pressed tab stays open. Closed sectors keep their size hidden, so nothing below moves. With reduced motion there is no tour and nothing comes alive; without the script it is the plain accordion.
- Between eight and sixteen elements move while the page loads and scrolls; no bounce or elastic easing; no scroll hijacking and no custom cursor.

**The 3D scene** (ADR 0004) draws the retama's stems above and roots below as thin ribbons, one pixel wide (two for the taproot), in on-surface, on-surface-muted and primary on the graphite ground, seen from the front with a narrow lens so it frames exactly like the poster. It does not turn: it lives. Three movements, all on the GPU:

- **Growth**, once, over about four seconds when the scene takes over: the taproot goes down first, the roots branch off it as it passes, and the stems sprout last. The poster fades out over `t-reveal` as the growth starts, so the plant is drawn again rather than swapped.
- **Wind** on the stems: an organic gust (noise, never a regular sway) that bends them more the higher they reach, while the roots stay still underground. On a pointer screen the cursor brings more wind: around it the gusts grow wider and a quicker flutter joins them, rising as it comes near and dying down over a couple of seconds once it leaves; it never pushes the stems aside.
- **Sap**: once grown, orange pulses climb from the deepest roots up the taproot and out to the tips of the stems, in a loop; on the taproot, already orange, the pulse is light ink. It is the idea of the page in motion: what is underneath feeds what is seen.

Three tiers that look like one picture: WebGPU, then WebGL2, then the static poster, which is shown first. The poster is an inline SVG drawn at build time from the same seeded generator the scene uses (`src/lib/retama-shape.ts`, lifted into space by `src/lib/retama-scene.ts`), so the three tiers draw the same plant; the taproot is the one stroke in primary. The scene downloads after the page has loaded, its tile is visible and the shutter has finished, and only after a probe of the GPU: it stays on the poster with reduced motion, data saving, a software adapter or a WebGL2 context with a major performance caveat, and gives up for the poster if its first second runs under 30 fps. It pauses off screen and with the tab hidden, and a tap or click on it pauses and resumes it (WCAG 2.2.2): the whole tile is that control, with no visible label, only the focus ring, drawn inside the tile.

**Reduced motion** keeps opacity and colour changes and drops travel, scale, parallax, the shutter and the 3D scene, which never loads. The performance budget of `scenario:perf-mobile` (LCP ≤ 1.8s, INP ≤ 200ms, CLS ≤ 0.1, Lighthouse 100) wins over any move.

## Do's and Don'ts

- Do read this document before any UI work, human or agent (ADR 0005).
- Do regenerate the theme with `pnpm design:theme`; never edit `src/styles/theme.css` by hand.
- Do take every colour and size from these tokens: `pnpm design:lint` rejects Tailwind's default scale and palette, literal arbitrary values and raw CSS colours and sizes in `src/`.
- Do fill tiles; separate them with the gap and the tone step, never with a line.
- Don't add a second accent colour, a gradient, a shadow at rest, glass or a glow.
- Don't use eyebrows, small uppercase letter-spaced labels, monospace outside the code lens, index numbers (01, 02) or thin rules.
- Don't put an icon and a two-line blurb in every tile, or build rows of identical tiles.
- Don't let a headline run past two lines at any width.
