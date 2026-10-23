# og-images

## Intent and acceptance

Generate one Open Graph image per language at build time and declare it, with the Open Graph and Twitter card tags, on every indexable page

Acceptance: After pnpm build, dist/client/og/es.png and dist/client/og/en.png are 1200x630 PNGs drawn in the DESIGN.md tokens with the copy of their language; every indexable page carries og:title, og:description, og:url, og:locale, og:image (absolute URL to its language's image) with width, height and alt, and twitter:card summary_large_image; the 404 pages carry none

## Plan

1. Unit tests, red: `openGraph()` in `tests/unit/seo.test.ts`; the card's copy, the 1200×630 PNG and one image per
   language in `tests/unit/og-image.test.ts`.
2. `src/lib/seo.ts` `openGraph()` and the `og.imageAlt` key in `es.ts` and `en.ts`: green.
3. `scripts/lib/og-image.mjs`: the card as Satori elements from the theme tokens, the poster's retama and the
   wordmark's outlines; sharp turns it into a PNG: green.
4. `scripts/postbuild.mjs` writes `og/<locale>.png`; `Base.astro` renders the Open Graph tags and `twitter:card` on
   indexable pages only.
5. E2E over the build: every sitemap page declares its language's image, which is served as a PNG of the declared size;
   the 404 has no Open Graph tag.
6. DESIGN.md (Imagery), the technology record and the roadmap.

## Decisions

- Owner (2026-10-23): the image is the home's first chapter in small (wordmark, two-tone title, the hero's lead and the
  poster's retama); one image per language shared by the home and the legal page; `og:locale` is `es_ES` and `en_US`;
  fixed URLs `/og/<locale>.png` with no hash, build output only (`pnpm dev` serves none); a failure to draw fails the
  build.
- Satori 0.33.5 + sharp 0.35.5 in `scripts/postbuild.mjs` (Node), not an Astro endpoint: `@astrojs/cloudflare`
  prerenders in workerd, where sharp's native binary does not run. Satori 0.33.5 is the last release older than two
  weeks; about 30 followed from 2026-10-09.
- Satori reads no woff2, so the text uses the static `@fontsource/stack-sans-headline` 300 woff; the site keeps the
  variable woff2. The lead is set at statement size in Stack Sans Headline (DESIGN.md sets statements in it), so the
  build needs only that face.
- The colours, sizes, leading and tracking come from `src/styles/theme.css` (generated from DESIGN.md), the plant from
  `retamaShape` with the poster's seed and the wordmark from the outlines in `Wordmark.astro`: no second copy.
- The lead is balanced (`textWrap: "balance"`) so it never ends on a single word; the plant is 560px tall at the right
  edge, so only the tips of its stems reach the title.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-23T10:20:54.384Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-23T10:20:54.384Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-23T10:20:54.384Z)
- ev-4: migration-test for migration-compat-and-test (2026-10-23T10:21:36.212Z)
- ev-5: living-doc-current for living-doc (2026-10-23T10:21:44.428Z)
<!-- ospec:evidence:end -->
