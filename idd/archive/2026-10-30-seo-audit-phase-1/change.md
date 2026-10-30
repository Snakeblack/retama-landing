# seo-audit-phase-1

## Intent and acceptance

Fase 1 de la auditoría SEO de retama.dev (2026-10-30): enlaces entre artículos y servicios, el grano fuera del LCP de las páginas interiores, la home sin desbordes a ancho de tableta, la escena que se rinde antes con una GPU lenta, favicon.ico y apple-touch-icon, lastmod y x-default en el sitemap, logo de la Organization en PNG de al menos 112 px, la marca en hero.lead y el área táctil del enlace del logotipo

Acceptance: Cada artículo enlaza en su cuerpo a su servicio y cada servicio con artículo lo enlaza, en es y en; en las páginas interiores el último LCP no es una imagen data: y coincide con el primer pintado; en / y /en/ a 768 y 1024 px no hay scroll horizontal ni texto que se salga de su tesela; la escena decide si se rinde en torno a 1 s y no a los 60 frames; /favicon.ico y /apple-touch-icon.png responden 200; el sitemap da lastmod a toda URL y x-default en su hreflang, y su índice lleva la fecha más reciente; el JSON-LD de la Organization usa un logo PNG de al menos 112×112; hero.lead nombra a Retama en los dos idiomas; el enlace del logotipo mide al menos 48 px de alto; pasan las cinco comprobaciones

## Plan

<!-- ospec:plan:start -->
- Files: `DESIGN.md`, `astro.config.mjs`, `scripts/lib/icons.mjs`, `scripts/postbuild.mjs`, `src/components/Home.astro`, `src/components/ServicePage.astro`, `src/components/board/ExampleTable.astro`, `src/components/board/Hero.astro`, `src/components/board/Sectors.astro`, `src/content/blog/en/web-security-updating-without-breaking.md`, `src/content/blog/en/what-custom-software-costs.md`, `src/content/blog/en/why-we-write-every-decision-down.md`, `src/content/blog/es/cuanto-cuesta-un-software-a-medida.md`, `src/content/blog/es/por-que-escribimos-cada-decision.md`, `src/content/blog/es/seguridad-web-actualizar-sin-romper.md`, `src/i18n/en.ts`, `src/i18n/es.ts`, `src/layouts/Base.astro`, `src/lib/scene-tier.ts`, `src/lib/seo.ts`, `src/lib/services.ts`, `src/lib/sitemap.ts`, `src/scripts/header.ts`, `src/scripts/scene-worker.ts`, `src/styles/global.css`, `tests/e2e/blog.spec.ts`, `tests/e2e/grain.spec.ts`, `tests/e2e/header.spec.ts`, `tests/e2e/sectors.spec.ts`, `tests/e2e/service-pages.spec.ts`, `tests/e2e/site.spec.ts`, `tests/unit/icons.test.ts`, `tests/unit/scene-tier.test.ts`, `tests/unit/seo.test.ts`, `tests/unit/services.test.ts`, `tests/unit/sitemap.test.ts`
- Work units: 6
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- Grano: las páginas sin escena traen data-grain desde el HTML (Base.astro), así que su grano entra en el primer pintado y no crea un LCP nuevo en load; la home, con escena, lo sigue poniendo header.ts en load (usuario, 2026-10-30)
- Escena: tooSlow decide con 1 s de frames ya calientes (mínimo 10) o con los 60 frames, lo que llegue antes, con el mismo umbral de 30 fps (usuario, 2026-10-30)
- Home en tableta: los nombres de las pestañas de sectores quedan en statement-sm hasta lg; las teselas de frase de los sectores parten con guion (hyphens auto) y, de respaldo, overflow-wrap break-word; la tabla de ejemplo va en letra pequeña hasta lg, como pide DESIGN.md Imagery (usuario, 2026-10-30)
- Sitemap: cada página sin artículo lleva su fecha updated (AAAA-MM-DD) a mano en los datos y un test la exige; el lastmod nunca es la fecha del build; el hreflang del sitemap añade x-default a la versión es, como el HTML (usuario, 2026-10-30)
- hero.lead nombra a Retama: «Retama hace aplicaciones web, herramientas internas y agentes para empresas, en remoto desde España.» / «Retama builds web apps, internal tools and agents for companies, remotely from Spain.» (usuario, 2026-10-30)
- Blog y servicios: coste y decisiones enlazan software a medida y seguridad enlaza webs y CMS desde su texto; la página de servicio con artículos añade la fila «Del blog» antes de «Otros servicios», con la tesela de cada artículo como en el índice del blog (usuario, 2026-10-30)
- favicon.ico (PNG de 32 px dentro de un ICO) y apple-touch-icon.png (180 px) se generan en el postbuild desde public/favicon.svg con sharp; el logo de la Organization pasa a ser ese PNG de 180 px, por encima de los 112 que pide Google
- hero.lead nombra a Retama aunque DESIGN.md decía que en el primer capítulo «Retama» era solo el logotipo: DESIGN.md pasa a decir que el título nunca la nombra y la entradilla sí, como quien hace lo que dice, y el E2E de la portada lo comprueba (usuario, 2026-10-30)
- El grano y las palabras partidas: hyphens auto partía casi todo en la tesela de tres columnas, así que la utilidad hyphenate-long de global.css limita la partición a palabras de 10 letras o más (hyphenate-limit-chars 10 4 4), con overflow-wrap break-word de respaldo
- La relación entre servicios y artículos vive en src/lib/services.ts (articles, por clave del artículo); un test unitario exige que cada artículo asignado enlace la página de su servicio en su texto, en cada idioma
<!-- ospec:decisions:end -->

Nota: la decisión que empieza por «El grano y las palabras partidas» trata solo de la partición de palabras en las
teselas de los sectores; el grano no tiene nada que ver con ella, y su decisión es la primera de la lista.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-30T15:49:52.770Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-30T15:49:52.770Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-30T15:49:52.770Z)
- ev-4: living-doc-current for living-doc (2026-10-30T15:50:10.635Z)
<!-- ospec:evidence:end -->
