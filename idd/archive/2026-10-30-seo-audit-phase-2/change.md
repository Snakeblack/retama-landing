# seo-audit-phase-2

## Intent and acceptance

Fase 2 de la auditoría SEO de retama.dev: el CTA de cada servicio abre el formulario con su tipo marcado y ofrece la reserva, Retama pasa a OnlineBusiness en el JSON-LD, la firma del blog enlaza al equipo, el artículo de costes trae una tabla de precios atada a services.ts, las URL sin barra final responden 301 y la zona activa Crawler Hints

Acceptance: Desde una página de servicio, Hablemos lleva al formulario de la home con el tipo de ese servicio marcado y la página ofrece Reservar una llamada; el JSON-LD tipa a Retama como OnlineBusiness; la firma de cada artículo enlaza al capítulo del equipo y su autor lleva sameAs; el artículo de costes, en es y en, trae una tabla de precios que un test compara con services.ts; /blog y cada página pedida sin barra final responden 301 a su URL con barra; technical-baseline recoge la configuración de la zona

## Plan

<!-- ospec:plan:start -->
- Files: `DESIGN.md`, `docs/architecture/technical-baseline.md`, `scripts/lib/redirects.mjs`, `scripts/postbuild.mjs`, `src/components/Article.astro`, `src/components/ServicePage.astro`, `src/content/blog/en/what-custom-software-costs.md`, `src/content/blog/es/cuanto-cuesta-un-software-a-medida.md`, `src/lib/board.ts`, `src/lib/contact-form.ts`, `src/lib/seo.ts`, `src/lib/services.ts`, `src/scripts/contact.ts`, `src/styles/global.css`, `tests/e2e/blog.spec.ts`, `tests/e2e/booking.spec.ts`, `tests/e2e/service-pages.spec.ts`, `tests/e2e/site.spec.ts`, `tests/unit/contact-form.test.ts`, `tests/unit/og-image.test.ts`, `tests/unit/redirects.test.ts`, `tests/unit/seo.test.ts`, `tests/unit/services.test.ts`
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- CTA de servicio (usuario, 2026-10-30): Hablemos lleva a /?projectType=<tipo>#contacto, con el nombre y los valores del campo del formulario, como los dejaría un formulario GET, igual en los dos idiomas; contact.ts marca ese tipo solo si el navegador no trae ya uno marcado, e ignora sin aviso un valor que no sea uno de los cinco, sin normalizar mayúsculas
- Reserva en la página de servicio (usuario, 2026-10-30): Reservar una llamada es un enlace normal a Cal.com, sin script ni marco, solo en un build con PUBLIC_BOOKING
- JSON-LD (usuario, 2026-10-30): Retama pasa de Organization y ProfessionalService, un LocalBusiness desaconsejado por schema.org y sin dirección, a OnlineBusiness solo, el subtipo de Organization de un negocio online
- Firma (usuario, 2026-10-30): Manuel M. es un enlace en línea al capítulo del equipo, y el autor del BlogPosting lleva sameAs al LinkedIn de Michael, el mismo de su ficha
- Tabla de precios (usuario, 2026-10-30): el artículo de costes trae, en es y en, las cifras de software a medida (diagnóstico, aplicación web, escritorio y mantenimiento), cada fila enlazada a su página; un test compara sus cifras con services.ts y con los textos que las dan
- Redirecciones (usuario, 2026-10-30): el 301 de las URL sin barra final sale de un _redirects que genera el postbuild, una línea por página, y las rutas que no existen siguen en el 404 directo; http://www se queda en dos saltos, porque uno exigiría apagar Always Use HTTPS en la zona compartida con clientes.retama.dev; Crawler Hints se activa a mano
- Tabla de precios, enlaces: las tres filas de software a medida comparten la página del servicio, así que la frase sobre la tabla la enlaza una vez, como pide el E2E de la fase 1 (un enlace por artículo), y solo la fila del mantenimiento enlaza, a las preguntas, donde están sus condiciones
- Elección restaurada: Chromium devuelve la elección de la persona al volver atrás después de que corre la isla y por encima del tipo, así que el E2E prueba el resultado (gana la elección) y no la guarda de contact.ts, que cubre a un navegador que la devuelva antes; al recargar, Chromium sin interfaz no restaura el formulario
<!-- ospec:decisions:end -->

Notas:

- La decisión de la tabla que pide cada fila enlazada la precisa la de sus enlaces: el servicio se enlaza una vez, en la frase, y solo el mantenimiento enlaza en su fila.
- Pendiente a mano: encender Crawler Hints en la zona, que technical-baseline ya da por encendido; se comprueba por la API de Cloudflare antes de fusionar.
- El E2E «cada tarjeta de Servicios de / lleva a su página, se pulse donde se pulse» sigue intermitente (falló 1 de 8 veces con la reserva activa); viene de antes y este cambio no lo toca.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-30T17:41:44.837Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-30T17:41:44.837Z)
- ev-3: living-doc-current for living-doc (2026-10-30T17:42:27.784Z)
<!-- ospec:evidence:end -->
