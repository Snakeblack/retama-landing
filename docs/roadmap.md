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

- JSON-LD (`Organization`, `ProfessionalService`, `WebSite`, `BreadcrumbList`) (hecho, `seo-structured-data`): un
  grafo por página con la marca Retama (sin domicilio, NIF, fundador, perfiles ni zona de servicio mientras no existan),
  sus servicios en el idioma de la página y la miga de pan en las páginas legales.
- Imágenes OG por idioma generadas en build (hecho, `og-images`): `/og/es.png` y `/og/en.png`, 1200×630, la portada en
  pequeño (wordmark, título a dos tonos, la frase del hero y la retama del póster), declaradas con Open Graph y
  `twitter:card` en cada página indexable; la 404 no lleva ninguna.
- robots.txt (crawlers de IA permitidos) y llms.txt (hecho, `seo-structured-data`): los dos se generan en el build con
  el origen del sitio; llms.txt va en inglés y enlaza las páginas de los dos idiomas.
- FAQ (hecho, `faq`): un capítulo de preguntas en la portada, entre el método y el contacto, con plazos, presupuesto,
  trabajo remoto, propiedad del código, garantía de seis meses y mantenimiento; acordeón nativo sin JavaScript, en el
  menú y en el índice, repetido como `FAQPage` en el JSON-LD y en llms.txt.
- Aviso legal, privacidad y cookies (LSSI/RGPD) (hecho, `legal-pages`): una página `/legal/` por idioma con las tres secciones, el titular por variables de build y los enlaces en el pie y bajo el formulario.

## M5 — Blog

**Entra (un change por PR, encadenados):**
1. `blog` (hecho): colección de Markdown por idioma en el repositorio, con el slug traducido y las traducciones unidas
   por una clave; el build falla si un artículo no está en todos los idiomas. Índice (`/blog/`, `/en/blog/`) y artículo
   con canónica, hreflang recíproco, Open Graph `article` con la imagen del idioma, JSON-LD `BlogPosting` y miga de
   pan; en el sitemap y en llms.txt. «Blog» en la cabecera, el índice de capítulos y el pie. Dos artículos iniciales
   para clientes, firmados por Retama.
2. `blog-feed` (hecho): RSS 2.0 por idioma (`/blog/rss.xml`, `/en/blog/rss.xml`) con el resumen y el enlace de cada
   artículo, anunciado en el head del índice y de los artículos y enlazado en el índice; imagen Open Graph propia de
   cada artículo (`/og/<idioma>/<slug>.png`), con «Blog», su título y la retama, dibujada en el build.

## M6 — Operación y lanzamiento

- `observability` (hecho): Workers Logs y Traces al 100 %, con los fallos del contacto (`unavailable`, `delivery`) en
  severidad de error, y UptimeRobot gratis cada 5 minutos sobre `/`, `/en/` y `GET /api/contact/`, que responde 200
  con los secretos y el binding o 503 si falta alguno. Los avisos van por email a la cuenta, sin página de estado.
- `client-errors` (hecho): endpoint propio `POST /api/report/` (ADR 0011, que amplía el 0002) que registra en Workers
  Logs, con severidad `warn` y sin datos personales, los errores de JavaScript de las páginas (`sendBeacon`, como mucho 5
  por carga) y las violaciones de la CSP (`report-to` y `report-uri`), con su propio límite de 20 informes por minuto e IP.
- `web-analytics` (hecho): Cloudflare Web Analytics puesto a mano tras el evento `load`, con el token en
  `PUBLIC_CF_ANALYTICS_TOKEN` (Workers Builds); sin token, ni beacon ni Cloudflare en la CSP. La política de privacidad
  cuenta la medición.
- `domain` (hecho): producción en `retama.dev`, Custom Domain del Worker, y `www.retama.dev` con un 301 a `retama.dev`;
  la URL `workers.dev` de producción, apagada; las Previews siguen en `workers.dev`. En la zona, el robots.txt
  gestionado y el bloqueo de bots de IA se dejan apagados, para que no contradigan el robots.txt del sitio.
- Checklist de lanzamiento, con el NIF y el domicilio en el aviso legal (`PUBLIC_LEGAL_NIF`, `PUBLIC_LEGAL_ADDRESS`; art. 10 de la LSSI) y los textos legales revisados por un gestor.

## v2 (aplazado)

- Heatmaps, grabaciones y funnels con **PostHog EU** tras consentimiento, con CMP ligero (ADR 0007).
- Portfolio o casos de éxito.
- Chat o agente IA que cualifica leads (requiere un ADR que amplíe el 0002).

## Decisiones aplazadas

| Decisión | Dueño | Último momento responsable |
| --- | --- | --- |
| Versión exacta de TypeScript compatible con `astro check` | Usuario + agente | S1 |
| Dirección de arte, tipografías y logotipo | Usuario (con taste-skill) | Inicio de M1 |
| Copy final es/en | Usuario | M2 |
| Datos legales (razón social, NIF, domicilio) para el aviso legal: en M4 el titular es una persona física con nombre y municipio (`legal-pages`); faltan el NIF y el domicilio | Usuario | Checklist de lanzamiento (M6) |
| Cuentas de Resend, Cal.com y WhatsApp Business; direcciones principal y de respaldo | Usuario | M3 |
| Proveedores gratuitos de uptime y errores de cliente: UptimeRobot y un endpoint propio `/api/report` (elegidos en M6) | Usuario | M6 |
| Herramienta y CMP de heatmaps | Usuario | v2 |
| Confirmar que el plan gratuito de Cloudflare permite uso comercial (términos vigentes) | Usuario | Antes de S1 en producción |
