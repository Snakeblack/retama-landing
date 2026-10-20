# Roadmap

Cada hito es una o más changes de IDD que llegan por PR a `main` con todas las puertas en verde.

## S1 — Walking skeleton (primer slice)

**Objetivo:** recorrer la cadena completa de principio a fin, con contenido mínimo.

**Entra:**
- Scaffold de Astro 7, `@astrojs/cloudflare` y `wrangler.jsonc`.
- pnpm y Corepack, Node 24, TypeScript estricto.
- Biome y eslint-plugin-astro, Vitest y Playwright.
- Rutas i18n `/` y `/en/` con paridad de claves.
- Canónica, hreflang y sitemap.
- `security.csp` + `_headers` con todas las cabeceras.
- `@view-transition` nativo.
- DESIGN.md mínimo (tokens provisionales) → `@theme` de Tailwind.
- Skills vendorizadas con su manifiesto y el escaneo.
- `CLAUDE.md`/`AGENTS.md` del repo: leer DESIGN.md y la precedencia de skills.
- CI en GitHub Actions: lint, typecheck, test, E2E y Lighthouse CI.
- Workers Builds con preview por rama, producción en `main` y protección de rama.
- release-please.

**Hecho cuando:**
- La URL de producción sirve es y en.
- Lighthouse da 100 ×4.
- Las cabeceras están verificadas.
- El PR de prueba genera su preview.
- Los checks de los ADRs se convierten en líneas `- Check:`.

## M1 — Sistema de diseño

- Dirección de arte con taste-skill: se eligen 3 direcciones y el usuario escoge una.
- DESIGN.md completo:
  - paleta oscura, tipografía autoalojada, espaciado y componentes;
  - sección Motion/3D con presupuesto de movimiento.
- Logotipo o wordmark de Retama.

## M2 — Portada con impacto

- Hero 3D progresivo (ADR 0004): póster LCP, WebGPU/WebGL2, reduced-motion.
- Secciones Servicios, Sectores y Método con apoyo visual y poco texto.
- Parallax y microanimaciones con GSAP/Lenis dentro del presupuesto.

## M3 — Contacto

- Formulario y función `/api/contact` con TDD: Turnstile, honeypot, rate limit, Resend y bandeja de respaldo.
- Reserva de llamada al hacer clic.
- mailto y WhatsApp.
- Estados visuales de éxito y error.

## M4 — SEO completo y legal

- JSON-LD (`Organization`, `ProfessionalService`, `WebSite`, `BreadcrumbList`).
- Imágenes OG por idioma generadas en build.
- robots.txt (crawlers de IA permitidos) y llms.txt.
- FAQ.
- Aviso legal, privacidad y cookies (LSSI/RGPD).

## M5 — Blog

- Content collections por idioma.
- Índice, artículos y RSS.
- SEO por artículo.

## M6 — Operación y lanzamiento

- Logs y alertas del Worker.
- Uptime externo y errores de cliente: se elige proveedor gratis.
- Cloudflare Web Analytics.
- Dominio y DNS.
- Checklist de lanzamiento.

## v2 (aplazado)

- Heatmaps, grabaciones y funnels con **PostHog EU** tras consentimiento, con CMP ligero (ADR 0007).
- Portfolio o casos de éxito.
- Chat o agente IA que cualifica leads (requiere un ADR que amplíe el 0002).

## Decisiones aplazadas

| Decisión | Dueño | Último momento responsable |
| --- | --- | --- |
| Dominio definitivo y DNS en Cloudflare | Usuario | Antes de M6 (S1 puede usar `*.workers.dev`) |
| Versión exacta de TypeScript compatible con `astro check` | Usuario + agente | S1 |
| Dirección de arte, tipografías y logotipo | Usuario (con taste-skill) | Inicio de M1 |
| Copy final es/en | Usuario | M2 |
| Datos legales (razón social, NIF, domicilio) para el aviso legal | Usuario | M4 |
| Cuentas de Resend, Cal.com y WhatsApp Business; direcciones principal y de respaldo | Usuario | M3 |
| Proveedores gratuitos de uptime y errores de cliente | Usuario | M6 |
| Herramienta y CMP de heatmaps | Usuario | v2 |
| Confirmar que el plan gratuito de Cloudflare permite uso comercial (términos vigentes) | Usuario | Antes de S1 en producción |
