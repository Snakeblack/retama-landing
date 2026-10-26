# worker-headers

## Intent and acceptance

Las respuestas que genera el Worker (API, redirecciones y las rutas /_image/ y /_server-islands/ que inyectan Astro y el adaptador) salen sin las cabeceras de seguridad de public/_headers, y la fitness on-demand-routes no ve esas rutas porque solo mira src/pages (M7 3/6, auditoría OWASP A02)

Acceptance: En el build servido por workerd, toda respuesta del Worker lleva HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP y una CSP (la de los assets si ya la trae, y si no una que lo bloquea todo); /_image/ y /_server-islands/ responden como una ruta que no existe; y node scripts/fitness.mjs on-demand-routes falla si el build tiene una ruta bajo demanda fuera de /api/contact y /api/report que el Worker no retire

## Plan

1. Worker (unidad 1): `src/worker.ts`, declarado como `main` en `wrangler.jsonc`, envuelve el `handle` de
   `@astrojs/cloudflare/handler`. Solo entrega a Astro las rutas de `ON_DEMAND_ROUTES` (`src/server/edge.ts`:
   `/api/contact` y `/api/report`, con o sin barra final); cualquier otra petición va a `env.ASSETS`. Toda respuesta pasa
   por `secure()`, que añade las cabeceras de `SECURITY_HEADERS` que le falten. En `astro dev` no hace nada.
   Tests: `tests/e2e/security.spec.ts` (respuestas del Worker y rutas retiradas, sobre el build), `tests/unit/edge.test.ts`
   y la paridad con el bloque `/*` de `public/_headers` en `tests/unit/headers.test.ts`.
2. Fitness (unidad 2): `node scripts/fitness.mjs on-demand-routes` lee las rutas del manifiesto que Astro serializa en
   `dist/server/entry.mjs` (`scripts/lib/build-routes.mjs`, con su test). Falla si la lista del Worker no es la de los
   ADR, si falta una de las dos rutas o si hay una ruta bajo demanda fuera de la lista que no sea de Astro (`internal`).
   En el CI pasa del job `quality` al `lighthouse`, que construye.
3. Documentación: fila del entrypoint en `docs/architecture/technical-baseline.md` y punto 3 de M7 hecho en
   `docs/roadmap.md`.

## Decisions

- Lista permitida en el Worker y no un bloqueo por prefijo de `/_image` y `/_server-islands`. Astro decodifica la ruta
  antes de enrutarla (`validateAndDecodePathname`, hasta que deja de cambiar), así que `/%5Fimage/` llegaba al endpoint
  de imágenes con un 200 (lo muestra la ejecución en rojo del e2e). Con la lista, una ruta codificada nunca llega a Astro.
  Tampoco un middleware de Astro: Astro responde la redirección de la barra final, la codificación inválida y el 404
  antes de llamarlo (`core/routing/handler.js`), así que esas respuestas seguirían sin cabeceras.
- Las peticiones que no son de la API van directas a `env.ASSETS` con su método y sus cabeceras. Una ruta que no existe
  responde la misma página 404 que antes. Un `POST` a una página responde ahora 405 desde los assets, y antes 200 con la
  página, porque el fallback de Astro la pedía con GET. Nada del sitio hace `POST` fuera de la API: el formulario de
  contacto no tiene `method` y su script envía a `/api/contact/`.
- `secure()` solo añade las cabeceras que faltan. Las respuestas de los assets, la 404 incluida, ya traen las de
  `_headers` (comprobado con `wrangler dev` sobre el build) y conservan su CSP de página. Los valores se copian en
  `src/server/edge.ts` en lugar de leer `_headers` en el Worker, y un test mantiene los dos iguales.
- La fitness lee el manifiesto del build con una expresión sobre la llamada a `deserializeManifest(...)`. Si Astro cambia
  ese formato, falla («no route manifest in the Worker build») en lugar de pasar sin mirar.
- Prior decision (memory): Auditoría OWASP Top 10:2025 de retama-landing (2026-10-26) -> docs/roadmap.md (M7, punto 3):
  current.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: repro-run-pair for repro-test (2026-10-26T12:59:27.807Z)
- ev-2: check-run for checks-pass (2026-10-26T13:04:03.005Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-26T13:04:03.005Z)
- ev-4: frozen-review for trust-review (2026-10-26T13:09:27.917Z, subagent-stop)
- ev-5: living-doc-current for living-doc (2026-10-26T13:09:32.826Z)
<!-- ospec:evidence:end -->
