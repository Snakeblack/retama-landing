# copy-humanizer

## Intent and acceptance

Humanize the home's copy with the blog's rules (retama:humanizer and its Spanish rules), from the review of 2026-10-30: the 'from X to Y' formula only in Paul's line, no empty contrast nor absolute promise in the decisions sheet, no jargon in Michael's line, plain words in the method, a whole SEO card line, the service area of 2026-10-26 in the sectors, a label of its own for what each sector gets, and 'Preguntas frecuentes' as the questions' heading

Acceptance: In es and en, services.figureCaption, team.lead, team.michaelLine, sectors.item4Build3, live.desktop.r3, live.desktop.r2, live.custom.r3, services.seoLine, sectors.field and sectors.builds read the texts the owner approved on 2026-10-30, and in es also method.d2Reason and faq.title ('Preguntas frecuentes'); the manifesto and Paul's line stay; the JSON-LD and llms.txt repeat the new card line and service area; lint, typecheck, test, e2e and design pass

## Plan

<!-- ospec:plan:start -->
- Files: `src/i18n/en.ts`, `src/i18n/es.ts`, `tests/e2e/questions.spec.ts`, `tests/e2e/team.spec.ts`
<!-- ospec:plan:end -->

1. Tests first: the Spanish questions chapter is "Preguntas frecuentes" (`questions.spec.ts`, and `team.spec.ts`,
   which finds the team before it); both failed on the old heading.
2. Copy in `es.ts` and `en.ts`, values only: the texts the owner approved on 2026-10-30. The JSON-LD and `llms.txt`
   read `services.seoLine` and `sectors.field` from them, so they follow without code changes.
3. Out of this change: the service pages (next change, chained) and the blog, whose articles keep their own pass with
   `blog-writing`.

## Decisions

<!-- ospec:decisions:start -->
- Prior decision (memory): seo-business-model answers (service area) -> src/lib/board.ts areaServed: current. sectors.field now names the same area: Spain, Portugal and the Spanish-speaking countries of America.
- Spanish-speaking America, not Latin America, in English: Latin America takes in Brazil, which areaServed leaves out.
- services.title keeps 'Lo que construimos' / 'What we build': it heads the services chapter, names the chapter in the index and the OfferCatalog in the JSON-LD. sectors.builds, the small label over what each sector gets, takes 'Qué podemos hacer' / 'What we can do' so the two no longer repeat.
- The English faq.title ('Common questions') and method.d2Reason ('in plain words') stay: they already say what the Spanish now says.
- The manifesto stays (owner, 2026-10-30), a brand choice of DESIGN.md, although retama:humanizer's pattern 3 flags aphorisms; Paul's line keeps the one 'from the first call to delivery'.
<!-- ospec:decisions:end -->

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-30T00:38:36.895Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-30T00:38:36.895Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-30T00:38:36.895Z)
- ev-4: living-doc-current for living-doc (2026-10-30T00:38:48.919Z)
<!-- ospec:evidence:end -->
