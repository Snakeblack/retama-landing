# legal-pages

## Intent and acceptance

Legal notice, privacy policy and cookie policy pages in es and en (LSSI/RGPD), with the owner's identifying data taken from the build environment so it stays out of the public repository, linked from the footer and from the contact form

Acceptance: Both locales serve the three legal pages with reciprocal hreflang and no JS needed; the legal notice shows the owner data set in the build environment and nothing invented when it is unset; the privacy policy names the controller, purposes, legal basis, recipients (Cloudflare, Resend, Google, Cal.com), retention and rights; the cookie policy lists the cookies observed in a real visit; every page footer and the contact form link to them

## Plan

1. Unit tests for `owner()` (trim, optional NIF and address, null without name or town) and `missingOwner()` (only
   Workers Builds requires the name and the town): red, then `src/lib/board.ts` and `scripts/lib/legal-owner.mjs`: green.
2. `astro.config.mjs`: optional public `PUBLIC_LEGAL_NAME`, `PUBLIC_LEGAL_TOWN`, `PUBLIC_LEGAL_NIF`,
   `PUBLIC_LEGAL_ADDRESS`, and the guard that throws in Workers Builds without the name or the town.
3. `src/components/Legal.astro` with `/legal/` and `/en/legal/`: notice, privacy and cookies as sections with translated
   anchors; the copy in `es.ts` and `en.ts`.
4. Links: the footer (now also on the 404 pages) and the form's sentence, which becomes the AEPD first layer.
5. E2E: `legal.spec.ts` (sections without JS, owner from the build, footer and form links), the CSP and no-cookies test
   over the legal pages, the site test scoped to the header's links; CI sets a test owner; Lighthouse adds `/legal/`.
6. DESIGN.md (footer and legal page), the baseline (owner variables) and the roadmap (M4 item, NIF and address in M6).
7. The owner sets `PUBLIC_LEGAL_NAME` and `PUBLIC_LEGAL_TOWN` in Workers Builds, production and Previews, before the
   merge: without them the deploy of `main` fails.

## Decisions

- One `/legal/` page per language with three sections (owner, 2026-10-23): "legal" reads right in both languages, so
  ADR 0008's one-path-per-page alternates, the language switch and the sitemap need no change. Indexable.
- The owner is a natural person whose trade name is Retama (no company yet). The data comes from the build environment,
  never the public repository; a line whose value is unset is left out, never invented. The NIF and the address
  (LSSI art. 10) are a launch requirement (M6).
- The guard lives in `astro.config.mjs` over `process.env` (`WORKERS_CI=1`), not in a page: prerendering may not see
  `process.env`, and the config fails the build before anything is published.
- The cookie section lists what a real visit to production stored (Playwright, 2026-10-23), not what providers claim:
  no cookies on load; Turnstile keeps `cf.turnstile.u` in the local storage of challenges.cloudflare.com; the Cal.com
  booking sets `__cf_bm` (30 minutes) on cal.com and keeps `reserverUid` in its local storage.
- Legal basis: art. 6.1.b GDPR for replies, 6.1.f for the spam check and the rate limit; retention for the enquiry and
  at most 12 months without a project; recipients Cloudflare, Resend (EU region), Google (Gmail, both inboxes) and
  Cal.com; Spanish prevails. The texts are a draft for a professional to review before launch.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-22T22:54:33.919Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-22T22:54:33.919Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-22T22:54:33.919Z)
- ev-4: frozen-review for trust-review (2026-10-22T22:55:36.893Z, subagent-stop)
- ev-5: living-doc-current for living-doc (2026-10-22T22:55:39.811Z)
<!-- ospec:evidence:end -->
