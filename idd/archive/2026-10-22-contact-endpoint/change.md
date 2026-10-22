# contact-endpoint

## Intent and acceptance

Función /api/contact: valida el formulario, descarta el honeypot, verifica Turnstile (fail-closed), limita por IP y entrega el lead por Resend a la bandeja principal y a la de respaldo, sin guardar ni registrar datos personales

Acceptance: POST /api/contact responde éxito solo tras entregar a ambas bandejas; rechaza entrada inválida, token inválido o ausente, exceso de envíos y fallo del proveedor con un código de error distinto; ningún log contiene campos personales; tests con Resend y siteverify simulados

## Plan

1. `src/lib/contact.ts`: campos, límites y `parseContact`, compartidos con el formulario de contact-form (test `tests/unit/contact-input.test.ts`).
2. `src/server/contact.ts`: `handleContact(request, deps)` con env, fetch y log inyectados (test de contrato `tests/unit/contact.test.ts`).
3. `src/pages/api/contact.ts`: la ruta bajo demanda, con el contrato en su cabecera; `src/env.d.ts` tipa `cloudflare:workers`.
4. `wrangler.jsonc`: binding `ratelimits` `CONTACT_LIMITER` (3 por 60 s). `serve:dist` sirve `dist/server/wrangler.json`.
5. `tests/e2e/contact.spec.ts`: cableado en workerd (origen, 400, honeypot, 503 sin secretos, 429 en el cuarto envío).
6. Base técnica: integración del límite y estrategia de tests.

## Decisions

- Respuestas de las preguntas abiertas: todas las propuestas (gate open-facts). Tipo de proyecto obligatorio con «otro».
- Orden: Origin → límite → cuerpo → honeypot → secretos → Turnstile → Resend. El Origin va antes del límite para que otro sitio no gaste el cupo de nadie; el honeypot, antes de Turnstile, para no gastar siteverify en bots.
- Si siteverify falla, no responde o no es JSON, la respuesta es `403 verification` (fail-closed, misma salida que un token inválido).
- La URL es `/api/contact/` con barra final: el sitio usa `trailingSlash: "always"` y Astro redirige la forma sin barra.
- Los destinatarios y el remitente son secretos (`wrangler secret put`), como las claves: un deploy no los borra y no se publican en el repo. Sin ellos la función responde 503.
- Sin `@cloudflare/vitest-pool-workers` (solo admite vitest 4): el manejador recibe sus dependencias y se prueba en Node con dobles; el E2E sobre el build prueba el cableado en workerd.
- `cloudflare:workers` se tipa a mano en `src/env.d.ts` con solo lo que el sitio enlaza, en vez de los tipos generados por `wrangler types`.
- Cuerpo máximo de 16 KB en bytes: un `Content-Length` mayor se rechaza sin leer y un flujo sin él se corta al pasarlo (revisión de confianza 1, WARNING).
- El límite cuenta una IPv6 por su /64, que un cliente suele tener entero; una IPv4, por la dirección (revisión de confianza 1, SUGGESTION).

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-22T10:04:20.057Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-22T10:04:20.057Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-22T10:04:20.057Z)
- ev-4: frozen-review for trust-review (2026-10-22T10:05:27.863Z, relayed)
- ev-5: adr-impact-declaration for adr-impact-declaration (2026-10-22T10:09:57.347Z)
- ev-6: frozen-review for trust-review (2026-10-22T10:10:58.214Z, relayed)
- ev-7: check-run for checks-pass (2026-10-22T10:11:51.068Z)
- ev-8: contract-spec-and-test for contract-spec-and-test (2026-10-22T10:11:51.068Z)
- ev-9: adr-impact-declaration for adr-impact-declaration (2026-10-22T10:11:51.068Z)
- ev-10: living-doc-current for living-doc (2026-10-22T10:11:53.878Z)
<!-- ospec:evidence:end -->
