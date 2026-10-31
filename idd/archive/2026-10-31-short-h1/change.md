# short-h1

## Intent and acceptance

Alargar a 20-70 caracteres el H1 de las seis páginas que bajan de 20 (portada, blog y legal en es y en, webs y CMS en inglés) sin pasar de las líneas que permite DESIGN.md

Acceptance: Cada página del sitemap tiene un H1 visible de entre 20 y 70 caracteres; el segundo renglón del título de la portada cabe en una línea de 320 a 1920 px y los demás H1 en dos; DESIGN.md, el i18n y los tests recogen los textos nuevos y un test falla si una página del sitemap baja de 20 o pasa de 70

## Plan

<!-- ospec:plan:start -->
- Files: `DESIGN.md`, `src/components/board/Hero.astro`, `src/i18n/en.ts`, `src/i18n/es.ts`, `src/lib/seo.ts`, `tests/e2e/blog.spec.ts`, `tests/e2e/legal.spec.ts`, `tests/e2e/motion.spec.ts`, `tests/e2e/service-pages.spec.ts`, `tests/e2e/site.spec.ts`
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- Un E2E recorre el sitemap y exige un H1 de 20 a 70 caracteres en cada página, para que un artículo o una página nueva no vuelva a dar el aviso
- El segundo renglón del título de la portada debe caber en una línea: la escena de glifos lo dibuja con un solo fillText (src/scripts/scene.ts sampleWord)
<!-- ospec:decisions:end -->

## Evidence

<!-- ospec:evidence:start -->
- ev-1: adr-impact-declaration for adr-impact-declaration (2026-10-31T15:07:04.878Z)
- ev-2: check-run for checks-pass (2026-10-31T15:12:33.053Z)
- ev-3: contract-spec-and-test for contract-spec-and-test (2026-10-31T15:12:33.053Z)
- ev-4: adr-impact-declaration for adr-impact-declaration (2026-10-31T15:12:33.053Z)
- ev-5: living-doc-current for living-doc (2026-10-31T15:12:33.106Z)
<!-- ospec:evidence:end -->
