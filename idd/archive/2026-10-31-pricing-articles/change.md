# pricing-articles

## Intent and acceptance

Fase 3 de la auditoría SEO, primera parte: dos artículos de precios en es y en, cuánto cuesta un agente o automatización y cuánto cuesta el SEO de una web, con las cifras de src/lib/services.ts en una tabla que un test ata a services.ts, enlazados desde y hacia la página de su servicio

Acceptance: El blog publica en es y en un artículo sobre el precio de un agente o automatización y otro sobre el precio del SEO, cada uno con una tabla cuyas cifras compara un test con services.ts y con los textos de la web; la página de agentes y la de SEO listan su artículo en Del blog y cada artículo enlaza una vez a su página; pnpm test, el build y los E2E pasan

## Plan

<!-- ospec:plan:start -->
- Files: `src/content/blog/en/what-an-ai-agent-costs.md`, `src/content/blog/en/what-website-seo-costs.md`, `src/content/blog/es/cuanto-cuesta-el-seo-de-una-web.md`, `src/content/blog/es/cuanto-cuesta-un-agente-de-ia.md`, `src/lib/services.ts`, `tests/e2e/blog.spec.ts`, `tests/e2e/service-pages.spec.ts`, `tests/unit/services.test.ts`
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- Coste del modelo de IA: lo paga el cliente desde su propia cuenta del proveedor y la propuesta lo estima (usuario, 2026-10-31)
- El artículo de agentes cuenta el aviso de IA del artículo 50 del Reglamento europeo de IA, enlazado a EUR-Lex, y no promete dónde se guardan los datos (usuario, 2026-10-31)
- Los artículos publican solo los mínimos de la web, sin rangos habituales ni cifras de mercado; la cuota del agente lleva tres meses de permanencia y el SEO no da plazo (usuario, 2026-10-31)
- Cada tabla de precios se ata con un test a services.ts y a los textos de la web, como la del artículo de costes
<!-- ospec:decisions:end -->

- Prior decision (memory): seo-audit-phase-3, alcance elegido por el usuario (artículos de precios de agentes y de SEO
  con las cifras de services.ts y enlace a su servicio) -> src/lib/services.ts: current
- Fuentes leídas el 2026-10-31: el artículo 50.1 y el 113 del Reglamento (UE) 2024/1689 en EUR-Lex (el 50 se aplica
  desde el 2 de agosto de 2026; el artículo no da la fecha) y la guía «¿Necesitas un especialista en SEO?» de Google
  Search Central, en es y en, para la frase del primer puesto, la estimación realista y el acceso de lectura a Search
  Console.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-31T18:06:41.458Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-31T18:06:41.458Z)
- ev-3: living-doc-current for living-doc (2026-10-31T18:07:00.830Z)
<!-- ospec:evidence:end -->
