# seo-business-model

## Intent and acceptance

SEO of the copy review (points 23-30): home and blog titles for the searches clients make, a meta description without the fully-remote claim, a complete JSON-LD (every offer with its starting price, the partners as Person and the area served if the owner wants it), the blog signed as Manuel M. visibly and as its author, and a sitemap with lastmod and the articles' language pairs

Acceptance: In es and en: the home and blog titles name custom software and Retama; the meta description no longer says fully remote; the JSON-LD lists every service of the FAQ with its starting price and the two partners as Person (Michael with his LinkedIn); each article shows Manuel M. as its author and its BlogPosting names him; the sitemap gives each article its lastmod and its translation; all checks pass

## Plan

1. Tests first: the JSON-LD (`tests/unit/seo.test.ts`: the whole catalog with the FAQ's starting prices, the area
   served, the partners as members, the article's author), the sitemap's extras (`tests/unit/sitemap.test.ts`), the
   article's byline and its BlogPosting (`tests/e2e/blog.spec.ts`) and the sitemap as built (`tests/e2e/site.spec.ts`).
2. Copy in `es.ts` and `en.ts`: `meta.title`, `meta.description`, `blog.metaTitle`, the names of the four offers the
   cards do not show and the byline's label.
3. `board.ts`: the area served and the blog's author; `seo.ts`: the catalog, `areaServed`, the partners as `member` and
   the BlogPosting's author; `Article.astro`: the byline as the first row of the dates.
4. `src/lib/sitemap.ts` and `astro.config.mjs`: each article's lastmod and translation, and each blog index's lastmod.
5. Docs: DESIGN.md (the blog's signature) and the technical baseline (the sitemap).

## Decisions

- Prior decision (memory): copy-business-model, the owner's answers to the copy review ->
  idd/archive/2026-10-26-copy-business-model/change.md: current. The SEO points went to this change.
- Prior decision (memory): seo-structured-data, one graph per page with no `areaServed` and no founder ->
  idd/archive/2026-10-23-seo-structured-data/change.md: current on disk, and amended here by the owner (2026-10-26):
  the partners go in as Person and the graph gains an area served.
- Owner, 2026-10-26 (every recommendation but the area served): home title «Software a medida y aplicaciones web para
  empresas · Retama» / «Custom software and web apps for businesses · Retama»; blog «Software a medida, explicado · Blog
  de Retama» / «Custom software, explained · Retama blog», which the RSS takes too; a meta description that drops
  "fully remote" for the fixed price and the written decisions.
- The catalog keeps the four cards and adds what only the FAQ prices: the diagnosis (€900), the website with a CMS
  (€3,500), the desktop application (€10,000) and the monthly maintenance (€120 a month). The agents' fee (€150 a
  month) is a second price of their offer. A monthly price is a `UnitPriceSpecification` with `unitCode` `MON`.
- The area served (owner: «visible para hispanoamérica y portugal también, no solo España»): Spain, Portugal and the
  Spanish-speaking countries of the Americas, Puerto Rico included, each a `Country` named in the page's language.
- The partners are `member`s of Retama, not founders: there is no company yet (team-section, 2026-10-25). Each has their
  role as `jobTitle`; Michael has his LinkedIn as `sameAs`.
- The blog is signed «Manuel M.» (owner): the byline is the first row of the article's dates, and the BlogPosting's
  author is a Person of that name whose `url` is the team chapter, so the data says what the reader sees.
- The sitemap gives a lastmod only where a real date exists: each article (updated, else published) and each blog index
  (its newest article). The home and the legal pages get none, since a build date would change on every deploy. Each
  article lists its translation, which the integration cannot pair because every language has its own slug.
- `astro.config.mjs` reads the articles' key and dates from their front matter (`src/lib/sitemap.ts`), since the
  content collection does not exist yet when the config loads; the collection's schema still checks every field when
  the site builds, and an article without its key or published date fails the config, naming it.
- The four new offer names live in the i18n files (`offers.*`), though no card shows them, because the JSON-LD speaks
  the page's language; their prices are the FAQ's, and a unit test ties each figure to the text that gives it.
- The countries' names come from `Intl.DisplayNames` in the page's language, not from i18n keys: they are proper names
  the runtime already knows in both languages.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-26T19:31:31.054Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-26T19:31:31.054Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-26T19:31:31.054Z)
- ev-4: living-doc-current for living-doc (2026-10-26T19:31:40.821Z)
<!-- ospec:evidence:end -->
