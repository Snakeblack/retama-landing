# contact-direct

## Intent and acceptance

Reserva de llamada en Hablemos: el calendario de Cal.com se carga solo al pedirlo (clic), con enlace directo como alternativa; mailto y WhatsApp ya están

Acceptance: En / y /en/ el capítulo Hablemos ofrece reservar una llamada; sin pulsar no hay ninguna petición a cal.com; al pulsar se carga el calendario de Cal.com en la página y queda visible un enlace directo a la página de reserva; sin JS el enlace lleva a Cal.com; la CSP del build solo añade cal.com a frame-src; tests unitarios y E2E con Cal.com simulado

## Plan

1. `src/lib/booking.ts`: `bookingEmbedSrc` (la página de Cal.com para un iframe, en oscuro y con el mes a la vista) y `bookingFrameDirective` (el `frame-src` con su origen y nada más), con su test `tests/unit/booking.test.ts`. La página provisional va en `src/lib/board.ts`.
2. El flag `PUBLIC_BOOKING` (`astro:env`, booleano público, apagado por defecto) en `astro.config.mjs`. Con él, `Home.astro` añade `frame-src https://cal.com` a la CSP y `Contact.astro` pinta la acción en la casilla clara y la casilla del calendario entre el formulario y los pasos.
3. La isla `src/scripts/booking.ts`, en el mismo bundle de `Home.astro`: un clic normal abre la casilla, crea el iframe una sola vez y le pasa el foco; Cerrar la oculta y devuelve el foco a la acción.
4. `src/scripts/motion.ts`: las casillas ocultas al cargar no entran con su grupo.
5. Textos `booking.*` en `src/i18n/es.ts` y `en.ts`; tokens `calendar` y `calendar-sm` en DESIGN.md con el tema regenerado; DESIGN.md (el contacto) y la base técnica (Cal.com en la tabla y en la allowlist).
6. E2E `tests/e2e/booking.spec.ts` según el estado del build; `security.spec.ts` y `contact-form.spec.ts` al día; el job e2e del CI construye con `PUBLIC_BOOKING=true`.

## Decisions

- Respuestas de las preguntas abiertas (gate open-facts, 2026-10-22): todas las recomendadas. iframe tras el clic; maqueta A (acción en la casilla clara, calendario en una casilla a todo el ancho); URL provisional en `src/lib/board.ts`; la URL no cambia, el foco pasa al calendario y Cerrar lo devuelve, el iframe se carga una vez, «Abrir en Cal.com» siempre a la vista y, sin JS, la acción es un enlace normal.
- Flag pedido por el usuario a mitad del change (2026-10-22): variable de build `PUBLIC_BOOKING`, apagada por defecto hasta que exista la cuenta de Cal.com, y sin cal.com en la CSP mientras esté apagada. Se cambia en Workers Builds y basta con reconstruir.
- iframe simple con `?embed=true&theme=dark&layout=month_view`, sin el `embed.js` de Cal.com: así no entra ningún script de terceros, solo un `frame-src`. A cambio, el iframe no se redimensiona solo: tiene una altura fija (7 filas; 9 en el móvil) y desplazamiento propio.
- La directiva va en `Home.astro` y no en `Contact.astro`: desde un componente anidado, `Astro.csp.insertDirective` llega cuando el `<head>` ya está pintado y no tiene efecto. Astro fusiona las fuentes con el `frame-src` de la configuración.
- Comprobado con Playwright: el calendario solo deja la cookie de seguridad `__cf_bm` de Cloudflare y hace peticiones a cal.com, app.cal.com y Sentry. Ningún tracker con cookies (ADR 0007).
- GSAP mide un elemento con `display:none` sacándolo un momento a `<html>`. Al entrar la casilla oculta con su grupo, el iframe se movía y se recargaba al cerrarlo. Las casillas ocultas al cargar ya no entran con su grupo.
- El test de Turnstile de `contact-form.spec.ts` leía las opciones del widget en cuanto salía la petición del script, antes de que se ejecutara (fallaba de vez en cuando en la ejecución completa). Ahora espera a las opciones.
- El estado apagado lo prueba el E2E local (valor por defecto); el encendido, el CI.
