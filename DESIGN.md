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
  calendar: 672px
  calendar-sm: 864px
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
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body}"
    rounded: "{rounded.tile}"
    height: "{spacing.touch}"
    padding: "{spacing.md}"
  input-label:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.small}"
  input-error:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.on-surface}"
    typography: "{typography.small}"
  choice:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.small}"
    rounded: "{rounded.tile}"
    height: "{spacing.touch}"
    padding: "{spacing.md}"
  choice-checked:
    backgroundColor: "{colors.field}"
    textColor: "{colors.on-field}"
---

# Retama

## Overview

Retama is a remote-only software engineering firm from Spain. The page has to read as serious, elegant and technically ahead, with little text and a picture behind every claim (`docs/product/brief.md`).

The art direction is **Colour chapters**, dealt by taste-skill (`colour-chapters`, seed 716104575, sector agency, tone technical, palette and type kept) for the M2.5 redesign the owner chose on 2026-10-21. It follows **The well-kept board** (`dense-tiles`, seed 571009059, M1), whose tiles, tokens and fragments it keeps: the board packed six to ten tiles into every screen, so the page read dense rather than direct.

The home is a sequence of chapters, one idea per screen, and the scroll tells it: the title of what Retama makes with the retama growing beside it and the manifesto among its roots, the services, the sectors, the method, the team, the questions and the contact. Inside a chapter the content still sits on flat tiles fitted edge to edge with narrow gaps; between chapters the ground may change, but never inside one. The page stays graphite: the owner kept the dark board for every chapter (2026-10-22). The redesign landed chapter by chapter (docs/roadmap.md, M2.5).

**The idea.** A retama lives on poor, dry ground because of what nobody sees: a root system many times deeper than the shrub is tall. Retama works the same way: the visible software stands on documented decisions underneath. On this page, **the retama's deep roots and the firm's written decisions become the page's chapters**: in the first chapter the site's own code assembles the title, then rains from it and grows the retama, written along its stems and roots, and the manifesto rises among the roots as the camera goes down them; and the method is told the way those decisions are written (a decision, then its reason). The live thing comes from the same idea and is the method's proof: the visitor picks one of four kinds of project and reads the first three decisions Retama would record for it, on a sheet labelled as an example. It is a native exclusive accordion (`<details name>`) laid out as tabs, so it works without JavaScript and keeps nothing in the URL. The page speaks to clients, not engineers: no tooling names (decision records, lint, tests, E2E, Lighthouse, CMS) appear on it.

## Colors

Graphite and safety orange. Graphite takes most of the board; one light field appears on a few chosen tiles; orange is the only accent.

- **Surface (#18191B):** graphite, the ground of every page and the gaps between tiles.
- **Surface raised (#222427):** one tone step lighter, the fill of ordinary tiles. Tiles are told apart from the ground by this step alone.
- **On surface (#EFF0F1):** a soft light ink for headlines, running text and links. Running text is always in this full ink.
- **On surface muted (#9C9EA3):** captions, small print and quiet links only; never running text.
- **Field (#EFF0F1) and On field (#18191B):** the inverted tile, used for one or two statements per screen at most.
- **Primary (#FF4A1F) and On primary (#18191B):** safety orange marks the main action, the thick bar across the top of the page, the highlighted item in a list, "a medida" in the title and the sap of the scene. Under 5% of any screen but the first, where the title's second line and the action carry it.

Contrast on the ground: on-surface 15.4:1, on-surface-muted 6.6:1 and primary 5.2:1; on a raised tile, on-surface 13.6:1 and on-surface-muted 5.8:1. Every text pair passes WCAG AA, and `pnpm design:lint` checks each component pair. Photographs are shown in greyscale so nothing competes with the accent.

## Typography

**Stack Sans** (SIL Open Font License), self-hosted from the pinned `@fontsource-variable/stack-sans-headline` and `@fontsource-variable/stack-sans-text` packages through Astro's font API, which also generates metric-matched fallbacks so the swap does not shift the layout. Only the latin subset ships; it covers Spanish and English.

- **Stack Sans Headline** sets everything at large size, in a light 300 weight with tight tracking: the word of the first chapter at display size, section headings and single statements inside tiles. The wordmark uses the same face at 500.
- **Stack Sans Text** sets running text at 400, run-in phrases and action labels at 500, and small print.

The page uses five sizes on desktop: 14 (small), 18 (body, labels), 32 (statement), 64 (headline) and 200 (display). On phones, below the `md` breakpoint (768px), the large three step down to 22, 36 and 72 (the `-sm` tokens); the display word keeps its phone size up to `lg` (1024px), because at 200px it needs the width of the 12-column grid. Each level is one utility generated with the theme, `type-<level>` (for example `type-headline-sm md:type-headline`), which sets family, size, line height, tracking and weight together. Sentence case everywhere; no uppercase labels, no monospace (the one exception is the code the scene and the title are made of, see Motion and 3D), no styled accent word inside a headline. A heading may be two-tone, muted then full ink. The one exception is the page's title, whose two lines are two colours by the owner's choice (2026-10-21): "Software" in the ink and "a medida" in the primary, the colour of the action beside it. The title is not selectable, so a drag never cuts through the hand-over between its glyphs and its letters.

## Layout

A 12-column grid that fills the viewport with **12px outer margins** and **8px gaps** at every width. Tiles take only four sizes on the mosaic (6×5, 6×3, 3×3 and 3×2 columns × 96px rows), so the board stays a system and never becomes a card grid: neighbouring tiles never hold the same kind of thing. Text inside a tile is top-left aligned on 24px padding (20px on phones) and is never centred. Running text stops at 640px (`measure`).

Chapters (services, sectors, method, team, questions, contact) are separated by 128px (`section`), clearly more than any gap inside one, and each opens with a heading that names it. The first chapter carries the page's one `h1`.

**The services** are the one row of like tiles on the page, and the plant keeps it from reading as a card grid: under the heading, on the ground, four cards (web and CMS, custom software for the web or the desktop, agents and automation, SEO and analytics), each with the service's name at statement size, one sentence under it and its starting price, excluding VAT, in body-strong under that (owner, 2026-10-26), top-left, and the retama as a dot screen filling the rest of the card. From `lg` the four stand in one row and each frames its own part of the plant, so the row reads it from the top down: the crown, its base with the taproot, the roots and their tips. Below `lg` they stack, and one plant runs down through them, a slice in a 5:2 window at the foot of each card. The third card is the light field, so the row is never four of the same tile.

**The sectors** open with a row of three tiles as tall as their statements: the heading, "your sector is not listed" and the field tile with where Retama works; the switcher follows (Motion).

**The method** is one screen on desktop and two on phones, with no tile left half empty. Its first row is two tiles of six columns: the heading with one statement under it and the three figures (one person to talk to, no tracking cookies, 100 out of 100 in Google's web quality checks) at its foot, and the four principles, a run-in phrase and one sentence each, two by two in one tile. Under them the projects: a tile with their question and lead, the four tabs two by two under it, short names at statement size (the open one is the field with the primary square), and the open project's sheet of three decisions in the right half beside them; on phones the sheet follows the tabs. Rows of the method and the contact take the height of their content, never a fixed span, so no tile is left with a hole.

**The team** (owner, 2026-10-26) comes between the method and the questions and puts a face on who the client deals with: the heading on the ground with one sentence under it, then each of the two partners in half a row (from `lg`), two tiles side by side and as tall as each other: the portrait and the text, with the name at statement size, the role in small type (muted on a raised tile) and one sentence, and at the foot a quiet link to a public profile where one exists. The text of the partner the client talks to is the field tile, so the row alternates portrait, text, portrait, field. From `md` to `lg` each partner fills the row; on phones the square portrait comes before the text, 4:5 from `md`. Until a partner's photograph is in `src/assets/team/<key>.jpg`, the portrait holds the initials at `display-sm` in muted ink, with the primary square at the top, and is hidden from assistive technology like any picture with nothing to read; the name is in the text.

**The questions** (owner, 2026-10-23) answer what a client asks before writing: how long a project takes, how it is priced, what working remotely is like, who owns the code, the warranty and what comes after delivery. They are a row of two parts: on the left (five columns from `lg`) a raised tile as tall as the questions, with the heading at the top and one sentence at its foot pointing to the contact; on the right (seven) one raised tile per question, a native accordion (`<details>`, not exclusive, so several stay open) with the question at statement size after the muted square, which turns primary when it opens, and the answer under it in running text, lined up with the question and held to `measure`. The first is open on load, so the chapter shows an answer without a click and works without JavaScript. Each answer says only what Retama can keep, and the JSON-LD repeats them word for word as the page's `FAQPage` (llms.txt too), from the same keys.

**The contact** puts the heading with its lead and, under it, the field tile with the direct ways to write (the address at statement size, WhatsApp in a build that gives its number (`PUBLIC_WHATSAPP_NUMBER`), and, while the booking is on, **Reservar una llamada**), on the left half; the form on a raised tile on the right half, as tall as both; and across the width a tile with what happens after writing: the reply within a working day, a short call if it helps and a written proposal with its options and their cost, which for custom software and agents comes out of a fixed-price diagnosis (owner, 2026-10-26). The form asks for the name and the email side by side, what the visitor needs as five choices (the four services and "other"), and the project in a few lines, with one sentence on what the data is used for beside the action, **Enviar**. A field that is wrong says why under it, with the primary square, when the visitor sends, and leaves as soon as it is right. Sending turns the action into "Enviando…"; once sent, the form gives way to the confirmation with the address the reply goes to; a failure keeps what was written and offers the mail, prefilled with it, and WhatsApp when the build has its number. Without the script the form is there with its action disabled and a note pointing to the address (ADR 0001). The anti-bot check stays invisible unless Cloudflare asks for a click. On phones the direct ways come right after the heading, then the form (owner, 2026-10-22). The booking (owner, 2026-10-22) is a plain link to Cal.com; with the script, a click opens a raised tile across the width, between the form and the steps, with its heading, a quiet link to open it in Cal.com, **Cerrar**, and the Cal.com calendar framed on the field's graphite, seven rows tall (`calendar`; nine on phones, `calendar-sm`, where Cal.com stacks its parts). Cal.com's own interface keeps its rounded corners and, on its free plan, its own colours and mark: it is the one thing on the board that is not ours. The calendar loads only on that click, once per visit; closing gives the focus back to the action. The booking shows only in a build that turns it on (`PUBLIC_BOOKING`); the page is the owner's Cal.com call, `cal.com/retama/llamada`.

**The footer** is the board's last row on every page, the 404 included: the wordmark with a row of quiet links under it in small type (the blog, then the three legal ones: legal notice, privacy, cookies) and the year, and beside it "back to top". The form's sentence on the data is the first layer of the privacy policy (who is responsible, what for and the rights), with a quiet link to the policy; it names the owner only in a build that gives one.

**The legal page** (`/legal/`, `/en/legal/`; owner, 2026-10-23) holds the legal notice, the privacy policy and the cookie policy as three sections with translated anchors, on the same grounds as the home's chapters and 128px apart. It opens with a row of two tiles: the heading, a statement saying what is in it and the date of the text; and the three sections as links at statement size. Each section is a row of the heading tile on the left (four columns from `lg`) and its running text on a raised tile on the right (eight), held to `measure`. Facts read as rows on the field's graphite, like the decision sheet: the owner, the NIF and the address in the notice, label in small muted type and value beside it; and the two things the site's services keep in the browser. The policy's paragraphs open with a run-in phrase. The owner's data comes from the build (`PUBLIC_LEGAL_*`): a line without its value is left out, never filled in.

**The blog** (`/blog/`, `/en/blog/`; owner, 2026-10-23) is written for clients, like the rest of the page, and signed by the brand. Its index is laid out like the questions: on the left (five columns from `lg`) a raised tile with the heading, "Software, explicado", a statement saying what it is about and, for RSS readers, a line in small muted type over the address of its feed as a row on the field's graphite, which one tap selects whole (each language has its own feed, announced in the head of the blog's pages; it is not a link, because a browser shows a feed as raw XML); on the right (seven) one raised tile per article, newest first, with its title at statement size, its lead in running text and its date and reading time in small muted type, turning to the field under the pointer. No tags or pagination until there are articles enough to need them. An article opens with a row of the title (the page's `h1`, at headline size and never past two lines, so a title holds 40 characters at most) and its lead at statement size, on the left (eight columns), and beside it (four) its dates as rows on the field's graphite, like the legal facts, the reading time and a quiet link back to the index. Under them, the body on a raised tile, held to `measure`: its sections open at statement size, run-in phrases and lists as in the legal page, lists carry the muted square and a quote is the field tile. Beside the body, a raised tile with one sentence and **Hablemos**, to the home's contact, stays in view while the body scrolls. An article holds no code: monospace stays in the first chapter. A picture, when an article has one, follows Imagery. Every article exists in every language, each with its own slug, or the build fails (ADR 0008); the language switch leads to the same article.

The header is a plain bar that floats over the page, so the scene of the first chapter fills the screen under it: the 6px primary bar, then the wordmark alone on the left and, gathered on the right, the links to the services, sectors, method, team and questions chapters (their anchors are translated per language), then the blog, and the language switch, `ES / EN` in small type with the current language in full ink and the other a quiet link to the same page. Over the first chapter it has no ground of its own; it takes the page's ground as the chapter leaves (scroll-driven, by the time the next chapter reaches it). It slides up out of the way while the page scrolls down and comes back as soon as it scrolls up, but never while the keyboard is in it; a chapter reached by a link stops below it. On phones the links leave the bar for **the chapter index** on the home; on the other pages, which have no chapters, the blog's link stays in the bar. The index: an icon button, two lines on a touch-sized raised tile and named "Índice" for assistive technology, opens a modal dialog over the whole screen, on the page's ground, with the same bar at its top (a close icon, named "Cerrar", where it was), one raised tile per chapter (home, services, sectors, method, team, questions: the name at headline size and the chapter's heading in small muted type under it; the chapter on screen in primary with the primary square and "Estás aquí") and, after them, one for the blog, and at the bottom, within reach of the thumb, the contact lead and **Hablemos** across the width. It is a native dialog opened by invoker commands, so it traps the focus, closes with Escape and opens without script; choosing a chapter closes it. The one action, **Hablemos**, is a button-primary fixed to the lower right corner on the page margin. It fades out while the first chapter (which has its own action) or the contact chapter is on screen, through scroll-driven animations; where those do not exist, or with the keyboard on it, it simply stays.

The phone is its own board: two columns with the same gaps, re-ordered so the word and the lead come first, the scene spans both columns and pairs of small tiles sit side by side. On touch screens the board's text is not selectable, so a scroll or a tap never starts a selection; the contact group stays selectable so the address can be copied, and so do an article of the blog, which is read and quoted, and the legal page, whose data is copied. The two-column board holds up to the `lg` breakpoint (1024px); the 12-column mosaic starts there, because below it a 3-column tile is too narrow for a statement. Rows are 96px and grow when a tile's content needs more (the `board-rows` utility), and a picture never sizes its row: it fills its tile absolutely.

The first chapter is a stage the height of the screen, pinned while the chapter scrolls under it, with the scene across all of it, edge to edge. Over it sits the page's `h1`, "Software" at display size with "a medida" (made to measure) at headline size under it, the S of the first starting its ink on the column of the "a" (the display word pulls back by `xs`, the difference of the face's 0.03em side bearing at the two sizes), with the lead sentence and the action, an orange button that leads to the contact chapter, under them: in the middle of the left half from `lg`, while the retama stands at 70% of the width; at the top on phones, `lg` below the header, with the retama centred below. "Retama" is only the wordmark in the header. A second screen follows inside the chapter: the manifesto, two sentences at headline size (the phone size below `lg`, where they take two and three lines) that rise over the roots as the camera goes down them. A quiet pause button, an icon in muted ink with a touch-sized target, sits in the lower right corner of the stage while the scene runs and leaves with the stage.

## Elevation & Depth

None. There are no shadows, glows, gradients, blurs or outlines on things at rest. Depth comes only from the tone step between surface and surface raised, and from the inverted field. A shadow is allowed on what truly floats (a menu, a dialog). The header floats flat, and the chapter index covers the whole screen on the page's ground, so neither needs one. The one exception is inside the 3D scene of the first chapter (owner, 2026-10-21): its glyphs fade with depth, and what is brighter than the ink (the glyphs in flight and the sap) blooms. The rest of the page stays flat.

**The grain** (owner, 2026-10-22) is the one texture: a fine monochrome grain, still and coarse enough to read on a phone, multiplied into the colour of the grounds so it only ever darkens: the ground of the chapters after the first, the footer, the raised tiles in them and the chapter index. A light layer of the same grain, a third of the strength, lies over them (letters, actions, pictures and the field tiles), so the ink stays clean. A tile that turns to the field under the pointer drops the ground's grain, and so does the open tab of the projects. The first chapter is where the grain matters most, and the scene draws it there itself: the same grain and the same split (the ground's on the graphite, the light layer over the glyphs), from a small noise tile on the GPU, fading in over 0.8s once the retama has grown. With reduced motion there is no scene, so the stage takes the page's grain. The page's grain comes on once it has loaded, when it is all below the first screen, so painting its noise never holds back the first paint; without the script there is none. The grain is a texture, not depth: it never separates tiles, which the tone step still does.

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
- **input / input-label / input-error:** a form field, a filled graphite box one step below its raised tile, touch-tall, with no border; its label above in small muted type, and its error under it in small ink after the primary square.
- **choice / choice-checked:** one option of a set, a touch-tall tile in the field's graphite with the muted square; the chosen one turns to the light field with the primary square, like the open tab of the projects. The radio itself is hidden, so the tile carries the focus ring.

## Imagery

The retama is the brand's signature, not its subject: a visitor has to read a software firm within five seconds, and a board full of plants reads as a nursery. So on the page the plant appears only twice: the scene of the first chapter, and the services, where the same plant is a dot screen drawn at build time from the poster's generator (dots along every stroke: ink on the stems, muted on the roots, primary on the taproot), cut into parts the cards read from the top down. The dot screen is a drawing, not a texture: it never fills a ground. Every other picture slot holds an interface fragment drawn in HTML and marked `data-ui`, an example that carries a visible "Example" label, never presented as a client's work: one per sector in the sectors group (a route dispatch panel, an approvals queue, the day's orders of a fresh-produce distributor (owner, 2026-10-26: the business model's entry sector, in the third tab, where it does not stand out) and one client portal under three made-up brands), and the decision sheet of each kind of project in the method. Fragments use the board's tokens: tiles in surface-raised, rows in surface, small type, the primary square as status mark, no borders or shadows. The page holds no found picture since the method dropped the Clusius plate (2026-10-22). One that comes later comes from an open collection with a licence that allows commercial use, is downloaded into the repository and credited in the footer. It is greyscale and baked that way into the file; an engraved plate is inverted onto the graphite, its paper turned into the raised tile tone and its lines into the light ink, so it reads as part of the board. Every picture is square-cornered and covers its tile with `object-fit: cover`, and a found picture shows the world around Retama, never Retama's product, office or team. The one photograph of people is the partners' own portraits in the team chapter (owner, 2026-10-26): head and shoulders, greyscale and baked that way into the file with its metadata stripped, cropped to the tile and served by the build in AVIF and WebP.

**The Open Graph image** (owner, 2026-10-23), the one place the plant appears off the page, is the first chapter in small: one per language (`/og/es.png`, `/og/en.png`, 1200×630), drawn at build time from these tokens: the primary bar across the top, the wordmark at the top left, "Software" at display size with the second line at headline size in primary under it and the lead at statement size, on the graphite ground, with the poster's retama standing at the right edge, its stems in ink, its roots muted and its taproot in primary. The home, the legal page and the blog's index share their language's image. Each article has its own (owner, 2026-10-23), `/og/<locale>/<slug>.png`, in the same frame: the bar, the wordmark and the retama, with "Blog" at statement size in muted ink over the article's title at headline size, which holds two lines clear of the plant.

## Motion and 3D

Motion makes the board feel alive and never carries content: every word is in the HTML before any script runs (ADR 0001), and animations only touch `transform`, `opacity` and `clip-path`.

| Token | Value | Use |
| --- | --- | --- |
| ease-out | cubic-bezier(0.22, 1, 0.36, 1) | entrances, moving hovers, interface under 600ms |
| ease-expo | cubic-bezier(0.16, 1, 0.3, 1) | reveals of 800ms or longer |
| ease-in-out | cubic-bezier(0.76, 0, 0.24, 1) | wipes and panels that travel while visible |
| ease-soft | cubic-bezier(0.33, 1, 0.68, 1) | slow scale and drift on pictures |
| ease-exit | cubic-bezier(0.55, 0.055, 0.675, 0.19) | something leaving for good, short |
| t-press | 140ms | press feedback |
| t-hover | 180ms | colour hovers |
| t-ui | 240ms | hovers that move something, accordions |
| t-reveal | 800ms | section entrances |
| t-open | 1100ms | the hand-over of the title between glyphs and letters |
| stagger-line | 90ms | lines of one statement |
| stagger-item | 70ms | tiles of one group |

This table is the only place these values are written: `pnpm design:theme` generates them into `src/styles/theme.css` as custom properties (`--ease-out`, `--t-ui`, `--stagger-item`…), CSS uses them as `var()` and the motion script reads them back from the page (`src/lib/motion.ts`).

The budget, per page:

- **The signature move, from the code to the plant:** the 3D scene of the first chapter (below). The title paints in plain letters; once the scene runs, thousands of glyphs of the site's own code (`src/lib/retama-shape.ts`, the generator of the plant) fly in shuffling their characters and assemble "Software" and "a medida" over the letters, which give way; then the glyphs rain from "Software" and grow the retama. Once it has grown, the title's glyphs hand it back to its letters in a sweep from the left over `t-open` (the page sweeps the letters in at the same pace through a mask); while the pointer is on the title the glyphs come back the same way. Tiny system monospace is the one place monospace appears, as texture and never as content to read. Without the scene (while it loads, on the poster, with reduced motion), the title stays in its letters, the pointer on it included (owner, 2026-10-22). The first chapter has no other entrance.
- **The descent:** the stage holds while the chapter scrolls a screen more, and the camera goes down the taproot with it, so the manifesto rises among the roots; its words go from muted to full ink one after the other, tied to the scroll (opacity only, so it holds with reduced motion).
- **Entrances:** inside each group, the heading, then the text, then the picture, staggered by `stagger-item`, rising 16–32px with opacity, once, as the group enters. A list arrives row by row and a figure counts up once; never the same fade on every block. The hidden starting state is set by the script itself, so without it everything is simply there.
- **Feedback on every control:** press, hover and focus on the action, links, tiles that link and the live thing.
- **The header and the index:** the header slides up out of the way over `t-ui` with ease-out (with reduced motion it only fades); the chapter index wipes in from the top over `t-ui` with ease-in-out and its tiles rise after it by `stagger-item` (with reduced motion they only fade in).
- **The services:** the cards rise one by one as the group enters, like any list, and the dots of each card's retama come in from the top down while the card crosses the screen (a `clip-path` tied to the scroll), so the plant reads from its crown to its roots. With reduced motion, or without scroll-driven animations, it is simply drawn.
- **One moving picture:** the 3D scene, which grows, sways in the wind and carries sap (below).
- **No other pinned scroll scene.** Scrolling is never held to show content: a visitor should not pay with scroll for little information. The descent of the first chapter is the one exception, a screen long and carrying the manifesto. The sectors are a **switcher** instead, the same on phones and desktop and shorter than one screen: a native exclusive accordion laid out as four tabs (two by two on phones), each sector with the client's problem, three things Retama builds and its example fragment. Each time the group comes on screen a tour runs once through the four sectors, six seconds each, with a bar filling under the open tab; the new sector wipes in from the left over `t-reveal` with ease-in-out and its fragment comes alive like a working app, its rows moving to their next status one by one (the next status is written in the HTML) or the white-label portal changing brand. The pointer or the focus on the switcher pauses the tour, choosing a tab ends it, and a pressed tab stays open. Closed sectors keep their size hidden, so nothing below moves. With reduced motion there is no tour and nothing comes alive; without the script it is the plain accordion.
- Between eight and sixteen elements move while the page loads and scrolls; no bounce or elastic easing; no scroll hijacking and no custom cursor.

**The 3D scene** (ADR 0004) draws everything with glyphs of the site's own code, one instanced mesh of quads that face the camera, read from an atlas of the source's characters drawn in the worker. The word's glyphs land on the letters of the HTML title, which the page samples from its own font, so the hand-over between them lines up. The plant is the poster's retama (110 stems, 16 lateral roots, roots far deeper than the stems are tall), lifted into space, with the source written in order along every stroke, so the code reads up the stems and down the roots: ink on the stems, muted on the roots, primary on the taproot, on the graphite ground, seen from the front with a narrow lens. Its layout is `plantPlacement` (`src/lib/glyph-scene.ts`), the same as the poster's. Four movements, all on the GPU:

- **Assembly and rain**, once: the title's glyphs fly in from scattered points, glowing orange while they fly, then the rain leaves "Software" and grows the plant, roots first and stem tips last, in about five seconds.
- **Wind** on the stems: an organic gust (noise, never a regular sway) that bends them more the higher they reach, while the roots stay still underground. On a pointer screen the cursor brings more wind, and the glyphs near it stir a few pixels, rise a little and wake, shuffling their characters and brightening; they never move aside.
- **Sap**: once grown, orange pulses climb from the deepest roots up the taproot and out to the tips of the stems, in a loop, and bloom; on the taproot, already orange, the pulse is light ink. It is the idea of the page in motion: what is underneath feeds what is seen.
- **Life**: now and then a glyph flickers to another character, and the camera drifts slowly with the pointer.

Every stem and root leaves the crown, so the glyphs thin out near it rather than burn white.

Three tiers that look like one picture: WebGPU, then WebGL2, then the static poster, which is shown first. The poster is an inline SVG drawn at build time from the same seeded generator the scene uses (`src/lib/retama-shape.ts`, lifted into space by `src/lib/retama-scene.ts`), placed where the scene grows the plant; the taproot is the one stroke in primary. The scene downloads after the page has loaded and its stage is visible, and only after a probe of the GPU: it stays on the poster with reduced motion, data saving, a software adapter or a WebGL2 context with a major performance caveat, and gives up for the poster if it runs under 30 fps once warm (and then the title is letters). It pauses off screen and with the tab hidden, and the pause button in the corner of the stage pauses and resumes it (WCAG 2.2.2).

**Reduced motion** keeps opacity and colour changes and drops travel, scale, parallax and the 3D scene, which never loads. **Performance:** the scene is heavy by the owner's choice (2026-10-21): the impact comes first and its cost is cut afterwards. It never touches the largest paint, which stays the HTML title (ADR 0004), and it runs in a worker after the load; the budget of `scenario:perf-mobile` (LCP ≤ 1.8s, INP ≤ 200ms, CLS ≤ 0.1) still holds, and any further optimisation of the scene is its own change.

## Do's and Don'ts

- Do read this document before any UI work, human or agent (ADR 0005).
- Do regenerate the theme with `pnpm design:theme`; never edit `src/styles/theme.css` by hand.
- Do take every colour and size from these tokens: `pnpm design:lint` rejects Tailwind's default scale and palette, literal arbitrary values and raw CSS colours and sizes in `src/`.
- Do fill tiles; separate them with the gap and the tone step, never with a line.
- Don't add a second accent colour, a gradient, a shadow at rest, glass or a glow (the bloom of the 3D scene is the one exception, see Elevation & Depth), or a texture other than the grain.
- Don't use eyebrows, small uppercase letter-spaced labels, monospace outside the code of the first chapter, index numbers (01, 02) or thin rules.
- Don't put an icon and a two-line blurb in every tile, or build rows of identical tiles.
- Don't let a heading run past two lines at any width. The manifesto, which has a screen of its own, may take three on phones.
