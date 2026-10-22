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

## M2.5 — Portada por capítulos

**Objetivo:** una portada al grano, con una idea por pantalla y unas 300 palabras visibles, manteniendo los tokens y la esencia (dirección «Colour chapters» de taste-skill, DESIGN.md).

**Entra (un change por PR, encadenados):**
1. `chapters-hero` (hecho): escena «del código a la planta». Glifos del código de la web forman «Software a medida», llueven y hacen crecer la retama; luego el título vuelve a letras y el puntero sobre él trae los glifos. Incluye la bajada fija por las raíces con el manifiesto (antes el change 2), la cabecera con enlaces, el «Hablemos» fijo y las cifras y el fragmento ADR movidos a Método.
2. `chapters-header` (hecho): la cabecera flota sobre el hero, que queda a pantalla completa, y se esconde al bajar. Lleva el selector `ES / EN`. En el móvil, el botón «Índice» abre un diálogo modal con los capítulos, el actual marcado y «Hablemos».
3. `chapters-services` (hecho): cuatro tarjetas con la retama como trama de puntos generada en el build. En escritorio leen la planta de arriba abajo; en el móvil, una sola planta baja por las cuatro. El escritorio entra en «Software a medida», y las puertas de calidad y la cifra «1 interlocutor» pasan a Método.
4. `chapters-method` (hecho): Método sobre el tablero oscuro, más corto y sin jerga. Las cifras van en la casilla del título y los principios en una sola casilla, y el elegidor de proyectos en pestañas es su prueba. Sale la lámina, junto con la ficha ADR y las puertas de calidad. Hablemos suma los tres pasos que siguen a escribir, y la fila de arriba de Sectores se ajusta a su contenido.
5. `glyph-scene-cost` (hecho): la escena de glifos cuesta menos en GPU y se ve igual. Medida en una GPU integrada (Radeon 610M), el bloom era casi todo su coste y los unos 6.600 glifos solo 0,1 ms. El bloom pasa a un cuarto de resolución, también en el móvil, y la escena se queda sin MSAA, que en quads con alfa no aporta nada. Por fotograma, el móvil baja de 3,9 a 3,0 ms y el escritorio retina de 8,9 a 5,9 ms, con un suelo de unos 2,5 ms. Se mantienen la densidad, el DPR hasta 2 y el salto directo al póster cuando va lenta.

**Hecho cuando:** los cinco changes están en `main`, el inspector de taste-skill no da ningún FAIL y Lighthouse sigue en 100.

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
