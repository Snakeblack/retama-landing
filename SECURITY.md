# Política de seguridad

[English below](#security-policy-english)

## Qué cubre

El sitio publicado en <https://retama.dev>, construido desde la rama `main`:

- La landing estática, en español (`/`) y en inglés (`/en/`), con sus cabeceras y su CSP.
- Las dos rutas de servidor del Worker: `/api/contact/` (formulario de contacto) y `/api/report/` (informes
  de errores de cliente y de violaciones de la CSP).

Solo se mantiene la versión desplegada; no hay versiones antiguas con soporte.

## Cómo avisar

Avisa en privado, nunca en una issue pública:

1. Preferido: el aviso privado de GitHub, en
   [Report a vulnerability](https://github.com/Snakeblack/retama-landing/security/advisories/new).
2. Si no usas GitHub: un correo a <hola@retama.dev> con «Seguridad» en el asunto.

Incluye la URL o la ruta afectada, los pasos para reproducirlo y qué impacto ves. Recibirás un acuse en 7 días como
máximo. El arreglo no tiene plazo fijo: depende de la gravedad, y te contaré cómo avanza. No hay programa de
recompensas.

## Fuera de alcance

- Fallos de terceros que el sitio usa (Cal.com, Resend, Cloudflare Turnstile, Cloudflare): avísalos a ellos.
- Denegación de servicio, pruebas de carga o cualquier prueba que agote los límites de `/api/contact/` o
  `/api/report/`.
- Lo que solo se reproduce con `astro dev`: el servidor de desarrollo no aplica la CSP, que solo se prueba sobre el
  build (`pnpm build` y `pnpm preview`).

## Buena fe

No emprenderé acciones contra quien investigue de buena fe, avise en privado y no acceda a datos de otras personas,
no los altere ni degrade el servicio.

---

# Security policy (English)

## Scope

The site published at <https://retama.dev>, built from the `main` branch:

- The static landing, in Spanish (`/`) and English (`/en/`), with its headers and CSP.
- The Worker's two server routes: `/api/contact/` (contact form) and `/api/report/` (client error and CSP
  violation reports).

Only the deployed version is maintained; no older versions are supported.

## How to report

Report privately, never in a public issue:

1. Preferred: GitHub private reporting, at
   [Report a vulnerability](https://github.com/Snakeblack/retama-landing/security/advisories/new).
2. If you do not use GitHub: an email to <hola@retama.dev> with "Security" in the subject.

Include the affected URL or route, the steps to reproduce it and the impact you see. You will get an acknowledgement
within 7 days. Fixes have no fixed deadline: it depends on severity, and I will keep you posted. There is no bug
bounty.

## Out of scope

- Flaws in third parties the site uses (Cal.com, Resend, Cloudflare Turnstile, Cloudflare): report them to them.
- Denial of service, load testing or any test that exhausts the limits of `/api/contact/` or `/api/report/`.
- Anything only reproducible with `astro dev`: the development server does not apply the CSP, which is only tested on
  the build (`pnpm build` and `pnpm preview`).

## Good faith

I will take no action against anyone who researches in good faith, reports privately, and does not access or alter
other people's data or degrade the service.
