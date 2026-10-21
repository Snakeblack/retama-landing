# m2-board-imagery

## Intent and acceptance

Corrección de imágenes del tablero (PR #14): la retama solo como firma (póster del hero y lámina de Clusius en Método, con una frase que descifra la metáfora); fragmentos de interfaz data-ui en el raíl del hero (ADR 0004 real), Servicios (puertas de calidad reales de esta web) y Sectores (panel de rutas rotulado como ejemplo); DESIGN.md Imagery enmendado

Acceptance: / y /en/ muestran la retama solo en el póster del hero y en la lámina de Método junto a la frase de la metáfora; el raíl del hero, Servicios y Sectores llevan fragmentos data-ui en HTML sin JS; el de Sectores lleva la etiqueta visible de ejemplo; cada imagen tiene alt y crédito; design:lint, E2E y Lighthouse 100 x4 en verde

## Plan

Corrección dentro del PR #14 (rama `feat/m2-board`), pedida por el usuario antes de fusionar. Dos unidades:

1. [x] Fragmentos `data-ui` en HTML (`AdrFragment`, `ChecksFragment` y `RoutesFragment` en `src/components/board/`) en lugar de tres imágenes; la lámina de Clusius pasa del hero a Método, recortada por las raíces, junto a la ficha que explica la metáfora; se retiran las otras tres imágenes y sus créditos.
2. [x] DESIGN.md (Imagery, Layout) con la regla nueva y E2E del tablero: tres fragmentos, el de ejemplo con su etiqueta, y un crédito por imagen.

## Decisions

- Prior decision (memory): M2 decisiones del usuario (imágenes PD/CC0) -> idd/archive/2026-10-21-m2-board/change.md: current; este change la sustituye en parte por decisión del usuario.
- Decisión del usuario (2026-10-21): una portada llena de retamas puede leerse como un vivero o una marca agrícola, y el alcance pide entender en menos de 5 s que Retama hace software. La retama queda solo como firma: el póster/escena del hero y la lámina de Clusius en Método, con la frase «Raíces más hondas que la planta» que descifra la idea. El resto de huecos llevan fragmentos de interfaz.
- Fragmentos honestos: el del hero es el ADR 0004 real (título y estado); el de Servicios son las puertas reales del CI de esta web (lint y tipos, tests, sistema de diseño, E2E sin JS, preview por rama, Lighthouse 100 ×4), sin tiempos ni números de PR que caduquen; el de Sectores es un panel de rutas de logística rotulado «Ejemplo», porque Retama no tiene aún trabajo de clientes que enseñar (decisión del usuario).
- Se enmienda la regla «al menos cuatro imágenes reales» de DESIGN.md Imagery (decisión del usuario): la retama dos veces y los fragmentos en el resto; cada imagen sigue llevando su crédito.
- Los fragmentos no reciben clases de colocación desde fuera (`class:list` con expresiones escapa a `design:lint`): la ficha padre los coloca en la rejilla y cada fragmento usa `h-full` con clases literales.
- La lámina de Clusius se recorta por abajo (`object-bottom`) en Método para que se vean las raíces junto a la frase de la metáfora.
- Cuarto fragmento en Contacto: un ejemplo rotulado de la primera respuesta (tres preguntas concretas), que muestra lo que promete el texto del grupo. Hace falta porque el inspector de taste-skill solo cuenta fragmentos de 300×200 px o más (`few-pictures`, FAIL con menos de cuatro) y el ADR del raíl estrecho del hero no llega. En el móvil va después de la dirección. La etiqueta «Ejemplo» pasa a una clave común (`frag.example`).
- En el móvil, la banda «Retama» (104 px) no cabía con el padding de 20 px y se cortaba 8 px por la derecha, lo que parecía un error y no un recorte buscado (`off-centre`, FAIL). Por debajo de `md` va sin padding horizontal y cabe entera.
- Inspector tras el change: 1 FAIL (`still-page`, que es `m2-motion`) y 6 WARN justificados: `first-action` y `small-title` (ya justificados en m2-board), `no-footage` (la imagen en movimiento será la escena 3D), `no-real-pictures` (decisión del usuario: la retama solo como firma), `off-centre` a 390 px (12 px frente a 24 px: el aire que deja la banda del nombre a su derecha) y `mixed-font-headline` a 390 px (la banda «Retama» está en el display y el resto en el texto; no hay una palabra destacada en otra cara).
- El efecto de lupa de código sobre «Retama» (decisión del usuario) queda para `m2-motion`, con monoespaciada solo como textura y como segundo gesto firma; no entra aquí porque este PR no envía JS.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-21T12:03:29.880Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-21T12:03:29.880Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-21T12:03:29.880Z)
- ev-4: check-run for checks-pass (2026-10-21T12:08:46.712Z)
- ev-5: contract-spec-and-test for contract-spec-and-test (2026-10-21T12:08:46.712Z)
- ev-6: adr-impact-declaration for adr-impact-declaration (2026-10-21T12:08:46.712Z)
- ev-7: living-doc-current for living-doc (2026-10-21T12:08:46.789Z)
<!-- ospec:evidence:end -->
