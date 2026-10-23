# web-analytics

## Intent and acceptance

Medir las visitas de retama.dev con Cloudflare Web Analytics, sin cookies ni almacenamiento en el navegador (M6, 3.ª pieza)

Acceptance: Con el token del sitio en la build, cada página carga el beacon de Cloudflare Web Analytics sin violar la CSP, sin cookies ni nada guardado en el navegador y sin pasar el presupuesto de JS del ADR 0001; sin token, la build no carga beacon ni amplía la CSP; la política de privacidad cuenta la medición

## Plan

- `astro.config.mjs`: variable de build opcional `PUBLIC_CF_ANALYTICS_TOKEN`.
- `src/lib/analytics.ts`: token, ajustes del beacon, sus fuentes de CSP y `loadBeacon`, que lo añade tras `load`.
- `src/components/Analytics.astro` + `src/scripts/analytics.ts`: el cargador; `Base.astro` lo pinta y amplía la CSP
  (`script-src https://static.cloudflareinsights.com`, `connect-src https://cloudflareinsights.com`) solo con token.
- Tests: `tests/unit/analytics.test.ts`; `tests/e2e/security.spec.ts` (ADR 0006/0007 con el beacon como doble y
  almacenamiento vacío; beacon después de `load`, ADR 0001). CI construye el E2E con un token de prueba.
- Textos: privacidad es/en (entrada, qué datos, para qué, base legal, quién más los trata) y «Actualizado el» al 24-10.
- Docs: filas de Web Analytics y Turnstile en `technical-baseline.md`; `docs/roadmap.md` (M6).

## Decisions

- Respuestas del usuario a los open facts (2026-10-24): snippet manual tras `load`; todas las páginas, también las
  Previews con el mismo token; el test del ADR 0007 admite solo los dos orígenes del beacon, servido como doble;
  privacidad y fecha actualizadas.
- Manual y no automática: así el repositorio decide cuándo carga y el E2E lo prueba; la automática inyecta el script
  en el borde, fuera del control de la CSP del build.
- Tras `load`: el beacon pesa 10,0 KB gzip y la portada ya cargaba 49,7 de 60 KB (ADR 0001). Las métricas de
  navegación y las Web Vitals siguen disponibles; se pierden las visitas que se van antes de que termine la carga.
- Componente aparte (`Analytics.astro`): un `<script>` de Astro dentro de una condición no se procesa; un componente
  que no se pinta no incluye su script.
- El formato del token no se valida en la build: un token mal copiado solo deja de medir, sin afectar a la página.
- La señal `persistent-data` es un falso positivo del detector: el test solo lee `localStorage.length` y
  `sessionStorage.length` para afirmar que están vacíos. El CLI no deja retirarla y se cumplió con el test del ADR 0007.
- Revisión de confianza sin hallazgos, registrada como `relayed`: el hook guardó el recibo de la primera respuesta, con
  una cita fuera de rango, y no lo renovó con las siguientes. Con la aprobación del usuario se borró ese recibo.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: adr-impact-declaration for adr-impact-declaration (2026-10-23T23:52:36.451Z)
- ev-2: migration-test for migration-compat-and-test (2026-10-23T23:53:04.886Z)
- ev-3: check-run for checks-pass (2026-10-23T23:54:16.720Z)
- ev-4: contract-spec-and-test for contract-spec-and-test (2026-10-23T23:54:16.720Z)
- ev-5: adr-impact-declaration for adr-impact-declaration (2026-10-23T23:54:16.720Z)
- ev-6: frozen-review for trust-review (2026-10-23T23:59:38.393Z, relayed)
- ev-7: living-doc-current for living-doc (2026-10-23T23:59:44.786Z)
<!-- ospec:evidence:end -->
