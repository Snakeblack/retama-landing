# client-errors

## Intent and acceptance

Errores de cliente: endpoint /api/report/ que registra en Workers Logs los errores de JavaScript de las páginas y los informes de violación de la CSP, sin datos personales (M6, 4.ª pieza; ADR nuevo que amplía el 0002)

Acceptance: Un error de JavaScript no capturado o una violación de la CSP en cualquier página del build produce una línea JSON sin datos personales en Workers Logs vía /api/report/; los informes inválidos, ajenos o por encima del límite se descartan; el fitness de rutas bajo demanda admite exactamente /api/contact y /api/report con un ADR que lo justifica

## Plan

1. Unidad «servidor»: `src/lib/report.ts` (normalización compartida), `src/server/report.ts` y `src/pages/api/report.ts`
   (`POST /api/report/`), `REPORT_LIMITER` en `wrangler.jsonc` (producción 1003, Previews 1004), `boundedText`
   exportado de `src/server/contact.ts` con su límite como parámetro, tipos en `src/env.d.ts`. Tests:
   `tests/unit/report.test.ts`, `tests/unit/wrangler-config.test.ts`, `tests/e2e/report.spec.ts`.
2. Unidad «página y CSP»: `src/scripts/report.ts` importado en `src/layouts/Base.astro` antes de la cabecera;
   `report-uri /api/report/` y `report-to csp` en la cabecera de la CSP (`scripts/postbuild.mjs`, HEADER_ONLY) y
   `Reporting-Endpoints: csp="/api/report/"` en `public/_headers`. Tests: `tests/unit/headers.test.ts`,
   `tests/e2e/security.spec.ts`.
3. Documentos: ADR 0011 (amplía el 0002), allowlist de `scripts/fitness.mjs`, `technical-baseline.md`, roadmap y la
   política de privacidad en `src/i18n/es.ts` y `src/i18n/en.ts`.

## Decisions

- Open facts (usuario, 2026-10-24: «si, vamos con las propuestas»): todas las propuestas, tal como las recoge el ADR
  0011: qué se recoge y qué campos, ruido (5 por carga, mensaje una vez, `REPORT_LIMITER` 20/min por IP), solo la
  ruta de la página, frase en la privacidad, 204/413/429/503 y severidad `warn`.
- Los rechazos (`discarded`, `rate-limited`, `too-large`) no escriben línea propia, porque el evento de invocación ya
  guarda el código de estado; solo `unavailable` sale como error y los informes válidos con `warn` (trust review
  gen 2; el usuario eligió «Código + ADR + regla WAF» el 2026-10-24).
- El servidor vuelve a pasar por `src/lib/report.ts` lo que manda la página: no se fía de que el cliente ya lo
  limpiara, y de cada informe solo copia los campos de la lista.
- Los correos se enmascaran con una expresión que exige un dominio con punto, para no confundir un marco de Firefox
  (`fn@/ruta`) con una dirección.
- `report-to` y `report-uri` van solo en la cabecera (una `<meta>` CSP los ignora). `Reporting-Endpoints` usa una URL
  relativa, que la especificación del Reporting API resuelve contra la URL de la respuesta, así que cada Preview
  informa a sí misma.
- Una petición de `application/reports+json` registra como mucho 5 informes (PAGE_REPORT_LIMIT), aunque traiga más.
- Trust review (gen 1, aprobada sin bloqueantes; el usuario pidió corregir ambos hallazgos el 2026-10-24):
  - F-84fd2550: las repeticiones de `EMAIL` y `FRAME_URL` quedan acotadas (parte local de 64, etiquetas de 63, esquema
    de 32) y el marco de Firefox se reconoce con `includes("@")` más `:\d+:\d+$`. Medido: un informe adversario de
    8 KB pasaba de ~50 ms (cuadrático, por encima de los 10 ms de CPU del plan gratuito) a ~1 ms. Se acota la
    repetición en vez de recortar el texto antes de enmascararlo, porque un recorte previo podría partir un correo y
    dejar un trozo sin enmascarar dentro de los 300 caracteres.
  - F-d3f46555: las URLs dentro del mensaje se reducen a su ruta en el sitio o a su origen fuera de él («[url]» si
    no se pueden leer), y las rutas de página y archivo y el origen bloqueado pasan por `clip`: 300 caracteres como
    máximo y correos enmascarados, también los codificados con `%40`.
- Trust review (gen 2, aprobada sin bloqueantes; el usuario eligió «Código + ADR + regla WAF» el 2026-10-24):
  - F-89d650e0: la lazy de `FRAME_URL` seguía siendo cuadrática con `at a://a://…(` (26 ms medidos). El lookahead
    acepta también `(`, así que la URL termina donde termina su clase de caracteres y ningún intento falla tras
    recorrer la línea (0,07 ms). La salida de los marcos válidos no cambia.
  - F-3cee1aa8: `REPORT_LIMITER` cuenta por informe, como decía la decisión de los open facts («20 informes por
    minuto»), y no por petición: cada informe después del primero pide su propia cuenta y se deja de escribir al
    agotarse. Junto con los rechazos sin línea, una IP escribe como mucho 20 líneas `warn` por minuto. Las
    invocaciones de una inundación de 429 las frena una regla de rate limiting del WAF (10 peticiones cada 10 s por
    IP, la única del plan gratuito, que solo filtra por ruta); el ADR 0011 fija el máximo y el riesgo aceptado.
- Trust review (gen 3, la última, aprobada sin bloqueantes): F-57c62da5, `EMAIL` solo reconoce ASCII (comprobado:
  `josé@empresa.es` y `ana@münchen.de` no se enmascaran y `muñoz@gmail.com` queda como `muñ[email]`). El usuario
  eligió el 2026-10-24 cerrar este change y corregirlo en uno aparte, con su propia revisión: deuda conocida.
- Paso manual pendiente: crear la regla de rate limiting del WAF en el dashboard de la zona (ADR 0011).
- Prior decision (memory): M6: decisiones del usuario (orden, uptime, errores, workers.dev) -> docs/roadmap.md: current

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-24T00:36:06.565Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-24T00:36:06.565Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-24T00:36:06.565Z)
- ev-4: migration-test for migration-compat-and-test (2026-10-24T00:36:29.748Z)
- ev-5: frozen-review for trust-review (2026-10-24T16:25:53.769Z, subagent-stop)
- ev-6: adr-impact-declaration for adr-impact-declaration (2026-10-24T16:31:23.441Z)
- ev-7: migration-test for migration-compat-and-test (2026-10-24T16:32:21.933Z)
- ev-8: check-run for checks-pass (2026-10-24T16:33:34.272Z)
- ev-9: contract-spec-and-test for contract-spec-and-test (2026-10-24T16:33:34.272Z)
- ev-10: adr-impact-declaration for adr-impact-declaration (2026-10-24T16:33:34.272Z)
- ev-11: frozen-review for trust-review (2026-10-24T16:35:24.417Z, subagent-stop)
- ev-12: migration-test for migration-compat-and-test (2026-10-24T17:35:41.570Z)
- ev-13: check-run for checks-pass (2026-10-24T17:36:51.267Z)
- ev-14: contract-spec-and-test for contract-spec-and-test (2026-10-24T17:36:51.267Z)
- ev-15: adr-impact-declaration for adr-impact-declaration (2026-10-24T17:36:51.267Z)
- ev-16: frozen-review for trust-review (2026-10-24T17:38:45.268Z, subagent-stop)
- ev-17: living-doc-current for living-doc (2026-10-24T17:52:09.647Z)
<!-- ospec:evidence:end -->
