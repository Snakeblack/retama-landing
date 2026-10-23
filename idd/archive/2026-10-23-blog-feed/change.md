# blog-feed

## Intent and acceptance

RSS del blog por idioma (/blog/rss.xml y /en/blog/rss.xml) e imagen Open Graph propia de cada artículo, dibujada en el build

Acceptance: El build publica un RSS válido por idioma con sus artículos, anunciado desde las páginas, y cada artículo declara en og:image y BlogPosting una imagen 1200×630 propia con su título, servida como PNG

## Plan

1. TDD: `feedPath` and `ogImagePath` (src/lib/blog.ts), `feedOptions` (src/lib/feed.ts), the article's own image in
   Open Graph and the BlogPosting (src/lib/seo.ts), and the article card and `blogPostings` (scripts/lib/og-image.mjs).
2. `@astrojs/rss` 4.0.19 and the endpoints `/blog/rss.xml` and `/en/blog/rss.xml`; llms.txt and the feeds share
   `articleSummaries` (src/lib/articles.ts).
3. The head of the blog's index and articles announces the feed; the index links it.
4. postbuild draws each article's image where its BlogPosting says it is.
5. E2E for the feeds, their announcement and the images; DESIGN.md, roadmap and baseline.

## Decisions

- Owner, 2026-10-23 (all recommendations): `@astrojs/rss` 4.0.19 rather than a hand-written feed; each item gives its
  title, lead, date and link, not the text; the feed is announced with `<link rel="alternate">` in the head of the
  blog's index and articles and linked in the index's tile; each article's Open Graph image keeps the language card's
  frame (bar, wordmark, retama) with "Blog" in muted ink over its title at headline size, and its alt text is
  "<title>, artículo del blog de Retama".
- Article images live at `/og/<locale>/<slug>.png`: two languages may share a slug.
- postbuild finds each article's image and headline in the BlogPosting of its built page, so Node needs no Markdown or
  front-matter parsing and the image is drawn exactly where the page declares it.
- The feed is served as `application/xml` without a charset; `_headers` is not touched, because an XML document's own
  `encoding="UTF-8"` declaration decides when the type has no charset (RFC 7303).
- The feed's channel links to the blog's index of its language and declares `<language>` and its `atom:link` self.
- The `persistent-data` signal comes from postbuild's `writeFile`, which writes build output, not stored data
  (ADR 0003); as in og-images, the Open Graph and RSS E2E is its compatibility run, with rollback by revert.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-23T16:32:10.702Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-23T16:32:10.702Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-23T16:32:10.702Z)
- ev-4: migration-test for migration-compat-and-test (2026-10-23T16:32:30.293Z)
- ev-5: living-doc-current for living-doc (2026-10-23T16:32:36.630Z)
<!-- ospec:evidence:end -->
