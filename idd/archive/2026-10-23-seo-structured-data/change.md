# seo-structured-data

## Intent and acceptance

JSON-LD (Organization, ProfessionalService, WebSite, BreadcrumbList) on the pages of both locales, a robots.txt that admits AI crawlers and points to the sitemap, and an llms.txt

Acceptance: Every indexable page in es and en carries valid JSON-LD for Retama and the site, with no data that does not exist (no address, no NIF); the legal pages carry a BreadcrumbList; /robots.txt allows every crawler, AI crawlers included, and names the sitemap of the build's site; /llms.txt follows llmstxt.org and links the pages; the CSP stays without unsafe-inline and Lighthouse stays at 100

## Plan

1. Unit tests in `tests/unit/seo.test.ts` for `structuredData()`, `jsonLd()`, `robotsTxt()` and `llmsTxt()`: red (no
   exports), then `src/lib/seo.ts`: green.
2. `src/layouts/Base.astro` renders one JSON-LD data block on every indexable page (none on the 404s); a page may give
   its breadcrumb (`trail`), and `src/components/Legal.astro` does.
3. `src/pages/robots.txt.ts` and `src/pages/llms.txt.ts`: prerendered endpoints built with the site's origin.
4. E2E in `tests/e2e/site.spec.ts`: one JSON-LD per sitemap page, breadcrumb only on the legal pages, none on the 404s;
   robots.txt and llms.txt served as text and linking the sitemap's pages.
5. Roadmap (M4 items done; M6: Cloudflare's managed robots.txt and AI bot blocking off on the domain) and baseline.

## Decisions

- One graph per page (owner, 2026-10-23): the brand Retama alone, typed `Organization` and `ProfessionalService` in a
  single node, with URL, logo (`/favicon.svg` until the OG images change), `hola@retama.dev`, the page's description and
  its four services. No `areaServed` (remote work, both languages), no founder (the owner's name stays in the legal
  notice only), no `sameAs` until there are profiles, no address or tax ID until the company exists.
- `WebSite` is one bilingual site (`inLanguage` es and en) published by Retama; no `SearchAction`, there is no search.
- `BreadcrumbList` only where a page gives a trail, today the legal pages: home of the language, then the page. The
  home page is the root, and a one-step trail adds nothing.
- The JSON-LD is a data block, never run: the CSP's `script-src` does not apply, Astro adds no hash and the header is
  unchanged (checked on the build). `jsonLd()` writes `<` as `\u003c`, so no text can close the script.
- robots.txt admits every crawler, AI training and search crawlers alike (M4 item), keeps them out of `/api/` (the
  contact endpoint, no page) and names the sitemap of the build's site, so it follows `SITE_URL`.
- llms.txt (owner, 2026-10-23): one file at the root in English, from the English copy, linking the pages of both
  languages; Spanish is the default and prevails in the legal text.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-23T07:12:26.652Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-23T07:12:26.652Z)
- ev-3: living-doc-current for living-doc (2026-10-23T07:14:14.485Z)
<!-- ospec:evidence:end -->
