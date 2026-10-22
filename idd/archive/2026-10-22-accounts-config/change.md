# accounts-config

## Intent and acceptance

Turnstile site key from the PUBLIC_TURNSTILE_SITE_KEY build variable (test key by default) and the Cal.com booking page made final

Acceptance: A build with PUBLIC_TURNSTILE_SITE_KEY set puts that key in data-site-key of the contact form; without it the build keeps the test key 1x00000000000000000000AA; bookingUrl stays https://cal.com/retama/llamada without the PROVISIONAL mark; the baseline says the Cal.com brand colour needs the Teams plan

## Plan

1. `astro.config.mjs`: `PUBLIC_TURNSTILE_SITE_KEY` como `envField.string` público de cliente, con la clave de pruebas
   por defecto, como `PUBLIC_BOOKING`.
2. `Contact.astro` lee la clave de `astro:env/client`; `src/lib/board.ts` deja de tenerla y `bookingUrl` pierde la marca
   PROVISIONAL (la cuenta `retama` y el evento «Llamada» existen).
3. El E2E del formulario fija que un build sin la variable usa la clave de pruebas.
4. `technical-baseline.md`: de dónde sale la clave, el hostname del widget y que el color y la marca de Cal.com
   requieren el plan Teams.
5. `DESIGN.md`: la reserva ya no espera la cuenta; sale con `PUBLIC_BOOKING` y el marco de Cal.com conserva, en el
   plan gratis, sus colores y su marca.

## Decisions

- La clave va como variable de build y no fija en el código (elección del usuario, 2026-10-22): así desarrollo, CI y
  E2E siguen con la clave de pruebas, que siempre pasa, y solo los builds de Cloudflare llevan la real. Cuesta un
  ajuste en Workers Builds.
- La clave se lee en `Contact.astro` y no en `board.ts`, porque `tests/unit/booking.test.ts` importa `board.ts` con
  vitest, donde `astro:env` no se resuelve.
- El widget admite `retamozogpt.workers.dev`: las Previews (`<rama>-retama-landing.retamozogpt.workers.dev`) son
  hermanas de producción, no subdominios suyos, y un hostname de Turnstile cubre solo sus subdominios.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-22T16:16:53.065Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-22T16:16:53.065Z)
- ev-3: check-run for checks-pass (2026-10-22T16:18:00.732Z)
- ev-4: contract-spec-and-test for contract-spec-and-test (2026-10-22T16:18:00.732Z)
- ev-5: adr-impact-declaration for adr-impact-declaration (2026-10-22T16:18:00.732Z)
- ev-6: living-doc-current for living-doc (2026-10-22T16:18:05.937Z)
<!-- ospec:evidence:end -->
