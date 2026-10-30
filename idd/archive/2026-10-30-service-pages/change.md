# service-pages

## Intent and acceptance

Una página por servicio (webs y CMS, software a medida con el escritorio dentro, agentes y automatización, SEO y analítica) en es y en, enlazada desde las tarjetas de la portada, con canónica, hreflang recíproco, sitemap, JSON-LD Service y BreadcrumbList, imagen Open Graph propia y llms.txt

Acceptance: El build publica 8 páginas de servicio (4 en es, 4 en en) con HTML completo sin JS, h1 propio, title y description distintos de la portada, canónica, hreflang recíproco con x-default, entrada en el sitemap con su traducción, JSON-LD Service y BreadcrumbList, og:image propia y línea en llms.txt; cada tarjeta de Servicios de la portada enlaza a su página; lint, typecheck, test, e2e y design:lint pasan

## Plan

<!-- ospec:plan:start -->
- Files: `DESIGN.md`, `astro.config.mjs`, `docs/architecture/technical-baseline.md`, `docs/roadmap.md`, `lighthouserc.json`, `scripts/lib/og-image.mjs`, `scripts/postbuild.mjs`, `src/components/DecisionSheet.astro`, `src/components/ServicePage.astro`, `src/components/board/Footer.astro`, `src/components/board/Method.astro`, `src/components/board/RetamaDots.astro`, `src/components/board/Services.astro`, `src/i18n/en.ts`, `src/i18n/es.ts`, `src/layouts/Base.astro`, `src/lib/board.ts`, `src/lib/seo.ts`, `src/lib/services.ts`, `src/lib/sitemap.ts`, `src/pages/en/services/[slug].astro`, `src/pages/servicios/[slug].astro`, `src/styles/global.css`, `tests/e2e/legal.spec.ts`, `tests/e2e/service-pages.spec.ts`, `tests/e2e/services.spec.ts`, `tests/e2e/site.spec.ts`, `tests/unit/og-image.test.ts`, `tests/unit/seo.test.ts`, `tests/unit/services.test.ts`, `tests/unit/sitemap.test.ts`
- Work units: 3
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- Rutas con slug traducido (usuario, 2026-10-30): /servicios/webs-y-cms/, /servicios/software-a-medida/, /servicios/agentes-y-automatizaciones/, /servicios/seo-y-analitica/ y /en/services/websites-and-cms/, /en/services/custom-software/, /en/services/agents-and-automation/, /en/services/seo-and-analytics/
- /servicios/ y /en/services/ a secas dan el 404 de su idioma; la miga de pan es Inicio > Servicio (usuario, 2026-10-30)
- La portada conserva su title; la página de software a medida va a la búsqueda más larga: «Desarrollo de software a medida: web y escritorio · Retama» (usuario, 2026-10-30)
- Cada tarjeta de Servicios enlaza con su nombre, un enlace que cubre toda la tarjeta, sin «Ver más» (usuario, 2026-10-30)
- Cada página: cabecera (h1, entradilla, precio desde y plazo, Hablemos), Qué incluye (3-4 piezas), Cuándo encaja (3 situaciones), Cómo empieza (propuesta o diagnóstico, entregas, garantía), la hoja de decisiones de ejemplo y enlaces a los otros tres servicios; textos con retama:humanizer, revisados en el PR (usuario, 2026-10-30)
- SEO y analítica empieza con propuesta gratis, como una web (usuario, 2026-10-30)
- La cabecera de cada página lleva la parte de la retama en trama de puntos de su tarjeta; DESIGN.md Imagery suma las páginas de servicio; SEO estrena su hoja de decisiones (usuario, 2026-10-30)
- Imagen Open Graph propia por página, como la de un artículo: «Servicios» en gris sobre el nombre del servicio (usuario, 2026-10-30)
- El pie de todas las páginas suma una fila con los cuatro servicios (usuario, 2026-10-30)
- Hablemos de una página de servicio lleva a /#contacto sin marcar el servicio en el formulario (usuario, 2026-10-30)
- Entrega: un PR si cabe en unas 400 líneas; si no, dos encadenados (base: estructura, plantilla, DESIGN.md, SEO y la página de webs; encima: las otras tres, enlaces de tarjetas y pie), con la release en el padre (usuario, 2026-10-30)
- Tras este change, revisión SEO con una skill que instalará el usuario (usuario, 2026-10-30)
- Los cuatro servicios (slugs, precios y su parte de la retama) viven en src/lib/services.ts, que usan las tarjetas, las páginas, el JSON-LD, el sitemap y llms.txt
- La hoja de decisiones del método y la trama de puntos de la retama pasan a componentes compartidos (DecisionSheet.astro, RetamaDots.astro); las listas de claves de las hojas, a src/lib/board.ts como las preguntas
- La imagen Open Graph de una página de servicio está en og/ con la ruta de la página (/og/servicios/<slug>.png, /og/en/services/<slug>.png); postbuild la dibuja desde el nodo Service del JSON-LD, como la de un artículo desde su BlogPosting
- La miga de pan sube un paso por carpeta que es página: /servicios/ no lo es, así que una página de servicio cuelga del inicio (el test de site.spec.ts pasa de «una por carpeta» a «una por carpeta del sitemap»)
- Lighthouse CI mide también /servicios/software-a-medida/, la plantilla nueva con las dos hojas y la trama (perf-mobile)
- Prior decision (memory): seo-business-model, el title de la portada «Software a medida y aplicaciones web para empresas · Retama» -> src/i18n/es.ts: current
- Prior decision (memory): seo-business-model, zona de servicio España, Portugal e Hispanoamérica -> src/lib/board.ts (areaServed): current; el nodo Service de cada página la repite
- El h1 inglés de webs es «Web design and CMS»: «Web design and CMS for businesses» ocupaba tres líneas a 360 px (DESIGN.md: nunca más de dos); el title conserva «for businesses»
<!-- ospec:decisions:end -->

## Evidence

<!-- ospec:evidence:start -->
- ev-1: adr-impact-declaration for adr-impact-declaration (2026-10-30T11:49:50.973Z)
- ev-2: check-run for checks-pass (2026-10-30T11:52:28.096Z)
- ev-3: contract-spec-and-test for contract-spec-and-test (2026-10-30T11:52:28.096Z)
- ev-4: adr-impact-declaration for adr-impact-declaration (2026-10-30T11:52:28.096Z)
- ev-5: living-doc-current for living-doc (2026-10-30T11:52:33.019Z)
<!-- ospec:evidence:end -->
