# Technical baseline

- Estado: foundation confirmada (2026-10-21). Decisiones en `docs/architecture/decisions/`; mapa de conocimiento en `docs/architecture/knowledge-map.yaml`.

## Context and boundaries

```
 Visitante / Rastreador ──HTTPS──▶ [Plataforma de borde]
                                    ├─ Activos prerenderizados (HTML/CSS/JS/imágenes, es + en)
                                    └─ /api/contact (única ruta on-demand)
                                          ├─▶ Verificación anti-bot (siteverify)
                                          └─▶ Email transaccional ─▶ Bandeja principal + respaldo
 Navegador ──(clic)──▶ Calendario de reservas embebido
 Navegador ──────────▶ Medición sin cookies · Errores de cliente · (v2: heatmaps tras consentimiento)
 Uptime externo ─────▶ Home y /api/contact
```

**Fuera de alcance:** base de datos, CMS, cuentas de usuario, pagos y chat con IA (v1).

## Components and data

| Componente | Responsabilidad | Datos que posee | Quién escribe |
| --- | --- | --- | --- |
| Sitio estático | Páginas, i18n, blog (colección `blog` de Markdown en `src/content/blog/<idioma>/`, `src/content.config.ts`; el build falla si un artículo no está en todos los idiomas, `src/lib/blog.ts`), SEO (canónica, hreflang, sitemap, JSON-LD en `src/lib/seo.ts`, `robots.txt` y `llms.txt` generados en el build), escena 3D, animaciones | Contenido, artículos y traducciones (repo) | Editor, mediante PR |
| Isla 3D | Escena progresiva (ADR 0004) | Ninguno | — |
| Isla de contacto | Formulario, validación en cliente con las reglas de la función (`src/lib/contact.ts`), token anti-bot. Sin script, el botón queda desactivado y se ofrecen el correo y WhatsApp | Ninguno (estado efímero) | — |
| Función de contacto | Validar, verificar el anti-bot, limitar, entregar por email; con GET, responder la comprobación de salud del uptime (200 con los secretos y el binding, 503 si falta alguno, sin terceros ni envíos) | Ninguno; tránsito (ADR 0003) | — |
| DESIGN.md | Tokens y justificación visual (ADR 0005) | Sistema de diseño | Editor y agentes, mediante PR |
| Skills vendorizadas | Guía para los agentes (ADR 0010) | `.claude/skills/` + manifiesto | Editor, mediante PR |

## Integrations

| Dependencia | Dueño | Protocolo | Modo de fallo y respuesta |
| --- | --- | --- | --- |
| Plataforma de borde | Cloudflare | HTTPS, Git | Caída de la plataforma: la web no está disponible. El uptime externo avisa. Producción solo en `retama.dev`, Custom Domain del Worker declarado en `wrangler.jsonc` (sin URL `workers.dev`); `www.retama.dev` responde con un 301 a `retama.dev` desde una Redirect Rule de la zona; las Previews siguen en `workers.dev` (`preview_urls`) |
| Logs y trazas | Cloudflare (Workers Logs y Traces) | `observability` de `wrangler.jsonc`, logs y trazas al 100 %, también en las Previews | Plan gratis: 200.000 eventos al día y 3 días de retención; desde el 01-12-2026, precio de Cloudflare Observability. La función de contacto registra un JSON por petición sin datos personales; `unavailable` y `delivery` salen con severidad de error, el resto como información |
| Email transaccional | Resend | HTTPS API | Error o timeout: la función responde con un error y la UI ofrece email y WhatsApp. Se registra el código de error, no los datos |
| Anti-bot | Cloudflare Turnstile | Widget explícito, `interaction-only`, cargado al primer foco en el formulario + siteverify | Si la verificación no está disponible, se rechaza el envío (fail-closed) y se muestran vías alternativas |
| Límite de envíos | Cloudflare (binding `ratelimits` de Workers) | Binding | 3 envíos por minuto e IP (en IPv6, por /64), contados por ubicación. Sin el binding, se rechaza el envío (fail-closed). Las Previews no heredan los bindings: tienen el suyo en `previews` de `wrangler.jsonc`, con el mismo límite y su propio contador |
| Reserva de llamada | Cal.com (plan gratis) | iframe simple tras clic, sin el script de embed de Cal.com; detrás del flag de build `PUBLIC_BOOKING` (apagado por defecto) | El enlace directo a la página de reserva está siempre a la vista; sin JS, la acción es ese enlace |
| WhatsApp | Meta | Enlace `wa.me`; el número llega en la variable de build `PUBLIC_WHATSAPP_NUMBER` (Workers Builds), fuera del repositorio público | Sin dependencia en tiempo de ejecución. Sin número, la página no muestra WhatsApp |
| Titular del aviso legal | Usuario | Variables de build `PUBLIC_LEGAL_NAME` y `PUBLIC_LEGAL_TOWN` (obligatorias) y `PUBLIC_LEGAL_NIF` y `PUBLIC_LEGAL_ADDRESS` (cuando existan), en Workers Builds, producción y Previews; fuera del repositorio público | El build de Workers Builds (`WORKERS_CI=1`) falla sin nombre o sin municipio (`scripts/lib/legal-owner.mjs`), así que nunca se publica un aviso legal sin titular. En local y en GitHub Actions se construye sin ellos y el aviso no nombra a nadie; el E2E usa unos de prueba |
| Medición sin cookies | Cloudflare Web Analytics | Beacon puesto a mano (`src/lib/analytics.ts`) tras el evento `load`, en todas las páginas; el token del sitio llega en la variable de build `PUBLIC_CF_ANALYTICS_TOKEN` (Workers Builds). Sin token no hay beacon ni Cloudflare en la CSP. Las Previews lo cargan con el mismo token, pero Cloudflare descarta los hostnames que no acaban en `retama.dev` | Si falla o lo bloquea el navegador, se pierden métricas; nunca afecta a la página |
| Errores de cliente | Por decidir en M6 (plan gratis) | HTTPS | Si falla, no se reporta; nunca afecta a la página |
| Uptime | UptimeRobot (plan gratis) | HTTPS GET cada 5 minutos a `/`, `/en/` y `/api/contact/` (comprobación de salud) | Avisa por email a la cuenta; sin página de estado pública. El plan gratis solo hace GET o HEAD y da por caído lo que no es 2xx o 3xx: por eso la función responde al GET. Si UptimeRobot falla, no hay aviso; nunca afecta al sitio |
| Heatmaps (v2) | PostHog EU | Script tras consentimiento | Aplazado |

## Quality scenarios

| Id | Atributo | Estímulo | Respuesta | Medida | Prioridad |
| --- | --- | --- | --- | --- | --- |
| `perf-mobile` | Rendimiento | Primera visita en móvil medio, 4G, sin WebGPU | El contenido se pinta antes que el 3D; el 3D se carga diferido y degrada | Lighthouse 100 ×4 (móvil); LCP ≤ 1,8 s, INP ≤ 200 ms, CLS ≤ 0,1 en p75 (usuario, ronda 3) | 1 |
| `seo-discovery` | Descubrimiento | Un rastreador indexa en cualquier idioma | HTML completo sin JS, canónica + hreflang recíproco, sitemap, JSON-LD | Sin cifra | 1 |
| `brand-impact` | Marca | Un decisor llega a la portada | Percibe elegancia, seriedad y vanguardia con poco texto; versión completa con movimiento reducido | Sin cifra | 1 |
| `privacy-security` | Privacidad y seguridad | Visitante de la UE, rechazo de cookies o abuso del formulario | Sin rastreo previo al consentimiento; CSP y cabeceras activas; validación y antispam en servidor | Sin cifra | 1 |

## Constraints

| Id | Restricción | Fuente |
| --- | --- | --- |
| `constraint:rgpd-lssi` | Empresa en España/UE: RGPD, LSSI, guía de cookies de la AEPD; aviso legal con datos identificativos | Usuario, ronda 1 |
| `constraint:low-cost` | Coste ≈ 0 en terceros. La plataforma debe permitir uso comercial (Vercel Hobby lo prohíbe, por eso se eligió Cloudflare) | Usuario, rondas 1 y 4 |
| `constraint:solo-team` | Un desarrollador senior con agentes de IA; poca experiencia en diseño y marketing | Usuario, ronda 2 |

## Test strategy

| Capa | Qué protege | Herramienta |
| --- | --- | --- |
| Unitaria | Esquema de validación del contacto, saneado y escape del email, paridad de claves i18n, utilidades SEO (canónicas, hreflang, JSON-LD) y del blog (traducciones, tiempo de lectura, fechas) | Vitest |
| Integración / contrato | Función de contacto con el email, el anti-bot y el límite simulados: éxito, fallo del proveedor, token inválido, rate limit, logs sin datos personales. Su cableado en workerd (ruta, binding del límite, secretos ausentes) lo prueba el E2E sobre el build | Vitest con dobles en la frontera; `@cloudflare/vitest-pool-workers` solo admite vitest 4 (2026-10-22) |
| E2E | Navegación es/en, JS desactivado (ADR 0001), movimiento reducido y fallback 3D (ADR 0004), cabeceras y CSP sin violaciones (ADR 0006), cero cookies sin consentimiento (ADR 0007), hreflang (ADR 0008), accesibilidad (axe) | Playwright sobre el build |
| Medición | Presupuesto `perf-mobile` y tamaño de JS por página | Lighthouse CI sobre el preview |
| Diseño | Lint de DESIGN.md y contraste; tema sincronizado (ADR 0005) | CLI de DESIGN.md |

No se fija ningún porcentaje de cobertura. TDD estricto en la función de contacto y en las utilidades i18n y SEO.

## Technology record

| Elección | Implementa | Alternativas | Por qué (equipo, madurez, licencia, coste) | Fuente fechada |
| --- | --- | --- | --- | --- |
| `@astrojs/rss` 4.0.19 | 0001, 0008 | Generarlo a mano como `robots.txt` y `llms.txt` | Paquete oficial de Astro, MIT, que valida y escapa el XML; el RSS por idioma (`/blog/rss.xml`, `/en/blog/rss.xml`, `src/lib/feed.ts`) lleva el resumen y el enlace de cada artículo. Workers lo sirve como `application/xml` sin charset, que basta porque el XML declara `encoding="UTF-8"` (RFC 7303) | 2026-10-23: npm (@astrojs/rss 4.0.19, 30-06-2026); elegido por el usuario |
| Satori 0.33.5 + sharp 0.35.5, `@fontsource/stack-sans-headline` 5.3.0 estática | 0001, 0005, 0008 | resvg-js con un TTF vendorizado; PNG versionados en el repo | Dibujan en el build la imagen Open Graph de cada idioma y la de cada artículo del blog, que postbuild encuentra en el `BlogPosting` de su página (`scripts/lib/og-image.mjs`, desde `scripts/postbuild.mjs`): Satori pasa el texto a contornos y sharp, que ya traía Astro, lo convierte en PNG. Corre en Node porque el adaptador prerenderiza en workerd, donde sharp no funciona. Satori no lee woff2, de ahí la fuente estática (OFL-1.1). Satori es MPL-2.0 y publicó unas 30 versiones desde el 09-10-2026: se fija la 0.33.5, la última con más de dos semanas; sharp es Apache-2.0. Solo dependencias de desarrollo | 2026-10-23: npm (satori 0.33.5, 22-09-2026; sharp 0.35.5, 27-09-2026; @fontsource/stack-sans-headline 5.3.0, 19-07-2026); `prerenderEnvironment: "workerd"` por defecto en `@astrojs/cloudflare` 14.4.1 |
| Astro 7.4.x (SSG + islas) | 0001, 0006, 0008 | Next.js 16.4 (CSP con nonce obliga a render dinámico), SvelteKit 3.1 (major de 3 semanas) | 0 KB de JS por defecto, `security.csp` estable con hashes, i18n nativo; MIT; mantenido por Cloudflare desde 01-2026 | 2026-10-21: npm (astro 7.4.1, 19-10-2026); docs.astro.build; Business Wire 16-01-2026 |
| Cloudflare Workers + static assets, `@astrojs/cloudflare` 14.x | 0002, 0009 | Vercel Pro (20 $/mes), Vercel Hobby (no comercial) | Gratis con uso comercial (supuesto: ver gaps), Workers Builds con previews por rama y 3.000 min/mes gratis; el adapter ya no soporta Pages | 2026-10-21: docs.astro.build/…/cloudflare; developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing (29-05-2026); vercel.com/docs/limits/fair-use-guidelines |
| `_headers` + `security.csp` | 0006 | Cabeceras desde código del Worker | `_headers` aplica a los activos estáticos; la ruta on-demand fija sus cabeceras en código | 2026-10-21: docs.astro.build/…/cloudflare |
| View Transitions nativas cross-document (`@view-transition`) | 0006 | `<ClientRouter />` de Astro (incompatible con CSP) | Sin JS; mejora progresiva (sin transición en navegadores sin soporte) | 2026-10-21: docs.astro.build (CSP) |
| Three.js r186 (`three/webgpu`, TSL) | 0004 | Babylon.js, WebGL puro | WebGPURenderer con fallback automático a WebGL2; MIT | 2026-10-21: npm (three 0.186.1, 24-09-2026); threejs.org/docs |
| GSAP 3.15 + ScrollTrigger, Lenis 1.3 | 0004 | Motion 14 (MIT) | Mejor control de scroll; GSAP gratis con plugins (licencia Standard no-charge, no OSI, uso comercial permitido; aceptado en ronda 7); motor de animación único | 2026-10-21: npm (gsap 3.15.0, lenis 1.3.27) |
| Tailwind CSS 4.3, generado desde DESIGN.md | 0005 | CSS a mano con custom properties | `@theme` a partir de tokens exportados; MIT | 2026-10-21: npm (tailwindcss 4.3.3); google-labs-code/design.md @ `6e5da53` |
| Spec DESIGN.md + `@google/design.md` CLI | 0005 | Tokens en CSS, Figma | Legible por agentes, lint con contraste; Apache-2.0; versión alpha (riesgo de cambios) | 2026-10-21: github.com/google-labs-code/design.md |
| TypeScript estricto | 0001 | JS | Versión exacta compatible con `astro check` a decidir en el slice 1 (TS 7.0 aún no tiene API pública, que llega en 7.1) | 2026-10-21: npm (typescript 7.0.2) |
| pnpm 12 (Corepack), Node 24 LTS en CI | 0009 | npm | Node 26 pasa a LTS el 28-10-2026; Node 24 es la versión estable de referencia | 2026-10-21: nodejs/Release schedule.json |
| Biome 2.5 + eslint-plugin-astro | 0009 | Solo ESLint 10 + Prettier | Biome es rápido, pero su soporte de `.astro` es experimental | 2026-10-21: biomejs.dev language support |
| Vitest 5, Playwright 1.64, Lighthouse CI 0.15 | 0009 | — | LHCI no publica versión desde 06-2025: vigilar | 2026-10-21: npm |
| Resend (plan gratis: 3.000 emails/mes, 100/día) | 0003 | Cloudflare Email Service, Formspree | API simple y dominio verificado; terceros fuera de la CSP del cliente | 2026-10-21: resend.com/pricing |
| Cloudflare Turnstile | 0002, 0006 | hCaptcha, honeypot solo | Gratis, invisible, nativo de la plataforma. En `script-src` solo lo acompaña Cloudflare Web Analytics, cuando hay token; en `frame-src` lo acompaña Cal.com solo con la reserva activada. La clave de sitio llega en el build con `PUBLIC_TURNSTILE_SITE_KEY` (Workers Builds); sin ella, el build usa la de pruebas, que siempre pasa (desarrollo, CI y E2E). El widget, hecho a mano en el dashboard, admite `retama.dev` (producción) y `retamozogpt.workers.dev` (Previews) | 2026-10-21: cloudflare/skills `turnstile-spin`; 2026-10-22: CSP comprobada en el build con la clave de pruebas; widget creado en el dashboard |
| Cal.com (plan gratis) | 0006, 0007 | Calendly, enlace sin iframe | iframe simple con `?embed=true&theme=dark`, sin `embed.js`, así que solo entra en `frame-src https://cal.com`, y solo con `PUBLIC_BOOKING=true` (lo añade `Home.astro`). Al abrirlo deja solo la cookie de seguridad `__cf_bm` de Cloudflare. La página es `cal.com/retama/llamada` (`src/lib/board.ts`). En el plan gratis se ve con los colores y la marca de Cal.com: cambiarlos requiere el plan Teams | 2026-10-22: iframe probado con Playwright (peticiones a cal.com, app.cal.com y Sentry; ninguna cookie de seguimiento); cuenta revisada con el MCP de Cal.com (el color y quitar la marca son de Teams) |
| UptimeRobot (plan gratis: 50 monitores, cada 5 minutos) | 0002, 0009 | Better Stack, comprobación propia con Cron Triggers | Gratis y con uso comercial permitido; un monitor externo avisa aunque caiga Cloudflare. Sin elegir método ni códigos de estado (son de pago), de ahí el GET de salud en `/api/contact/` | 2026-10-23: términos de UptimeRobot (26-05-2026, «available for any use, including commercial»); uptimerobot.com/pricing; blog de UptimeRobot (selección de método HTTP y códigos propios, de pago) |
| Workers Logs y Traces | 0002, 0003 | Logpush (de pago), un proveedor externo de logs | Nativo de la plataforma y gratis con el tráfico del sitio; `observability.traces` hay que activarlo aparte (skill `workers-best-practices`) | 2026-10-23: developers.cloudflare.com/workers/observability (200.000 eventos al día, 3 días; precio de Cloudflare Observability desde el 01-12-2026) |
| Cloudflare Web Analytics | 0001, 0006, 0007 | Umami, Plausible (de pago), la configuración automática del borde | Sin cookies ni almacenamiento en el navegador, gratis, Web Vitals de campo. A mano y no automática, para que el repositorio decida cuándo carga y el E2E lo pruebe: la CSP admite `https://static.cloudflareinsights.com` en `script-src` y `https://cloudflareinsights.com` en `connect-src`, solo con token (lo añade `Base.astro`). Pesa 10,0 KB gzip: tras el evento `load` queda fuera del presupuesto de JS de inicio (la portada carga 49,7 de 60 KB) | 2026-10-24: developers.cloudflare.com/web-analytics (FAQ: CSP y hostnames por sufijo; recogida: `/cdn-cgi/rum` en cloudflareinsights.com); cloudflare.com/web-analytics («does not use any client-side state, such as cookies or localStorage»); beacon medido; E2E con el beacon como doble |
| release-please | 0009 | Tags manuales | SemVer desde Conventional Commits (ronda 5) | Pendiente de verificar la versión en el slice 1 |

## Agent skills (ADR 0010)

Vendorizadas en `.claude/skills/` en el slice 1 y auditadas el 2026-10-21. Ninguna tiene inyección, telemetría ni ejecución remota de scripts en las carpetas elegidas.

| Tema | Skill (carpeta) | Repo @ commit | Licencia | Notas |
| --- | --- | --- | --- | --- |
| Dirección de arte | `skills/taste-skill` | Leonxlnx/taste-skill @ `6010f91a9935f1c167dfc500fb1a475681892e6b` | MIT | Sus scripts contactan APIs públicas de imágenes y Google Fonts y lanzan Chrome por CDP. El historial se redirige al repo con `TASTE_SKILL_HISTORY`. Sustituye a frontend-design (ronda 8) |
| Revisión de interfaz | `command.md` de web-interface-guidelines, con un SKILL.md que lo lee en local | vercel-labs/web-interface-guidelines @ `434b7f91364665f2f733b310ec54809bf8f37937` | MIT | Se elimina la descarga remota de reglas y se adaptan las reglas de React a Astro |
| Animación | `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-performance` | greensock/gsap-skills @ `aed9cfd3277740755f6bfc1155c7aa645403b760` | MIT | Motor único |
| 3D | `threejs-fundamentals`, `-shaders`, `-postprocessing`, `-performance` | CloudAI-X/threejs-skills @ `0e181866f095b5f06d005133876e926515390d95` | MIT | Comunidad, un solo autor; cubre r186, WebGPU y TSL |
| Calidad web | `core-web-vitals`, `performance`, `seo`, `best-practices`, `web-quality-audit` | addyosmani/web-quality-skills @ `afa8da942115f2961fdbfa80807ea0b232ff6c00` | MIT | La accesibilidad la cubre la skill global `ospec-workflow:accessibility` para no duplicar |
| hreflang | `skills/seo-hreflang` | AgriciDaniel/claude-seo @ `4b99de2f7de7e7d5247042e5fb5b4ea9368ef734` | MIT | Solo la carpeta; el plugin no (tiene hooks y un instalador remoto) |
| Plataforma | `wrangler`, `workers-best-practices`, `turnstile-spin` | cloudflare/skills @ `86505e44f87d801aa1864a3c4109e9a8ae5c409f` | Apache-2.0 | Los scripts de `turnstile-spin` usan un token de la API de Cloudflare: no se ejecutan; el widget se crea a mano en el dashboard |

**Precedencia para evitar conflictos:**
1. DESIGN.md
2. taste-skill
3. La skill global `ospec-workflow:design-system`, solo para auditar

**Huecos:** Astro 7, Tailwind 4 y View Transitions se consultan en la documentación oficial (Context7 o `docs.astro.build/llms.txt`).
