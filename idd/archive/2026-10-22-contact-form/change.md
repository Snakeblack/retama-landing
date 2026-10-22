# contact-form

## Intent and acceptance

Formulario de contacto en el capítulo Hablemos (es/en) que envía a /api/contact con Turnstile cargado al interactuar, validación en cliente y estados de envío, éxito y error

Acceptance: En / y /en/ el capítulo Hablemos muestra el formulario (nombre, correo, tipo de proyecto, mensaje) en el HTML; al enviarlo con datos válidos llama a /api/contact/ con el token de Turnstile y muestra el éxito; ante un 4xx/5xx muestra un error que conserva lo escrito y ofrece correo y WhatsApp; la CSP del build admite challenges.cloudflare.com y nada más nuevo; tests unitarios y E2E con la API simulada

## Plan

1. `src/lib/contact-form.ts`: `failureOf` (qué hacer con cada respuesta de `/api/contact/`) y `mailtoHref` (el correo precargado con lo escrito), con su test `tests/unit/contact-form.test.ts`.
2. `src/components/board/Contact.astro`: maqueta A con el formulario en el HTML; `src/scripts/contact.ts`, la isla (Turnstile, validación, envío, estados). Sale `ReplyFragment.astro`.
3. Textos en `src/i18n/es.ts` y `en.ts`; canales provisionales en `src/lib/board.ts`.
4. CSP: `script-src` y `frame-src` con `https://challenges.cloudflare.com` en `astro.config.mjs`.
5. DESIGN.md (el contacto, input, choice) y la base técnica (Turnstile como único tercero de la CSP).
6. E2E `tests/e2e/contact-form.spec.ts` con Turnstile y la API simulados; `site.spec.ts` y `security.spec.ts` al día.

## Decisions

- Respuestas de las preguntas abiertas (gate open-facts, 2026-10-22): todas las recomendadas. Maqueta A; sin JS, botón desactivado y aviso; errores al enviar que se van al corregir; éxito que sustituye el formulario; fallo que conserva lo escrito con mensajes propios para 429, 403 y el resto; Turnstile `interaction-only` al primer foco; WhatsApp provisional; nada en la URL ni en el navegador.
- La validación en cliente reutiliza `parseContact`, la misma de la función, para que nunca discrepen.
- Un 400 cuyos campos no puede corregir el visitante (`locale`, token o cuerpo) se trata como fallo del servicio, no como campos marcados.
- Los canales provisionales (WhatsApp y la clave de sitio de pruebas de Turnstile) viven en `src/lib/board.ts` junto al correo, marcados PROVISIONAL; la clave de pruebas siempre pasa, y la real llega al crear el widget a mano.
- Turnstile con `response-field: false`: el token viaja solo como `turnstileToken` en el JSON. Cada envío gasta el token y el widget se reinicia tras un fallo.
- La caja de Turnstile no ocupa sitio (`-mt-lg`) salvo cuando Cloudflare pide un clic (`before-interactive-callback`).
- El enlace de correo precargado recorta el cuerpo a 1500 caracteres: los `mailto` largos se cortan en algunos clientes.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-22T11:22:24.518Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-22T11:22:24.518Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-22T11:22:24.518Z)
- ev-4: living-doc-current for living-doc (2026-10-22T11:22:43.721Z)
<!-- ospec:evidence:end -->
