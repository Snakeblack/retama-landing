# blog

## Intent and acceptance

Blog por idioma (es en /blog/, en en /en/blog/): artículos en content collections del repositorio, índice y página de artículo con SEO

Acceptance: El build publica un índice del blog y cada artículo en es y en, legibles sin JavaScript, con canónica, hreflang recíproco, metadatos y JSON-LD propios, enlazados desde el sitio, y los textos de interfaz en es.ts y en.ts

## Plan

1. `src/lib/blog.ts` with TDD: locale and slug of an entry, pairing of translations by `key` (the build fails on a
   missing translation, a repeated key, a title over two lines or code in the body), reading time, date format, paths.
2. `src/content.config.ts`: the `blog` collection, Markdown under `src/content/blog/<locale>/<slug>.md`. Two articles
   for clients in es and en, for the owner to review.
3. `src/lib/seo.ts` with TDD: alternates and the language switch take the translated paths of a page; Open Graph
   `article`; JSON-LD `BlogPosting` and the breadcrumb; llms.txt lists the articles.
4. Pages `/blog/`, `/blog/<slug>/`, `/en/blog/`, `/en/blog/<slug>/` (`BlogIndex.astro`, `Article.astro`), the article
   body styled from the tokens.
5. «Blog» in the header of every page, in the chapter index of phones and in the footer.
6. E2E: index and articles without JavaScript, the switch to the translated article, the links, the JSON-LD; ADR 0008
   covers the new sitemap URLs.
7. DESIGN.md (the blog, header, index, footer), roadmap and baseline.

## Decisions

- Owner, 2026-10-23 (all recommendations): Markdown `.md` in the repository, no MDX and no CMS; M5 split into `blog`
  (this change) and `blog-feed` (RSS per language and an Open Graph image per article); a translated slug per language,
  paired by a common `key` in the frontmatter; written for clients, signed by the brand Retama; `/blog/` and
  `/en/blog/<slug>/`; «Blog» in the header, the chapter index and the footer; article with h1, lead, dates and reading
  time, body at `measure`, no code blocks; index newest first, no tags or pagination; the build fails when an article
  is missing in a language (ADR 0008).
- Prior decision (memory): Orden: primero el blog (M5), luego la app de seguimiento -> docs/roadmap.md: current
- Articles share their language's Open Graph image until `blog-feed` draws one per article.
- No code in articles is enforced at build time: besides the DESIGN.md rule on monospace, Shiki would write inline
  `style=""` attributes that the CSP without `unsafe-inline` blocks (ADR 0006).
- Reading time at 200 words a minute, rounded up, at least one.
- The header's links live in `Base.astro` for every page: the home leads them with its chapters (slot `nav`, list
  items) and the blog's link follows. On phones they leave the bar only on a page with a chapter index (the home);
  elsewhere the blog's link stays in the bar.
- The footer puts the blog first in the row of quiet links, outside the legal navigation, which keeps its three links.
- Articles are read once per build through `src/lib/articles.ts`, which checks the whole blog before giving the pages
  of a language; `src/lib/blog.ts` stays free of `astro:content` so Vitest tests it.
- Verified by hand: a Spanish article without its English pair fails `astro build` with «orphan: missing in en».

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-23T14:21:06.087Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-23T14:21:06.087Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-23T14:21:06.087Z)
- ev-4: living-doc-current for living-doc (2026-10-23T14:21:19.432Z)
<!-- ospec:evidence:end -->
