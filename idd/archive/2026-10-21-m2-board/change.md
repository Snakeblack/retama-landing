# m2-board

## Intent and acceptance

M2 (1/3): tablero estático de la portada es/en con la dirección «The well-kept board»: banda del nombre y hero con la ficha central para la escena (póster provisional), Servicios, Sectores, Método, la pieza viva sin JS (tipo de proyecto → primeras decisiones), bloque de contacto con mailto, pie con créditos, copy final redactado e imágenes reales PD/CC0 en gris

Acceptance: / y /en/ muestran el tablero completo de DESIGN.md sin JS (un h1, grupos con su ficha de encabezado, ≥4 imágenes reales en gris acreditadas en el pie); la acción principal lleva al bloque de contacto con mailto:retamozogpt@gmail.com; la pieza viva cambia de tipo de proyecto sin JS; paridad de claves i18n; design:lint, E2E (incluido ADR 0001 y 0006) y Lighthouse 100 x4 en verde

## Plan

Primer change de tres para M2 (`m2-board`, `m2-motion`, `m2-hero-3d`), cada uno con su rama, su PR y su sesión. Este va en la rama `feat/m2-board`, encadenada sobre `feat/m1-design-system` mientras el PR #13 no esté fusionado (`team.delivery_strategy: single-pr`). Tres unidades:

1. [x] Geometría de la retama: `src/lib/retama-shape.ts` (generador con semilla, tallos sobre el suelo y raíces más hondas que la mata) con su test (`tests/unit/retama-shape.test.ts`) y el póster SVG estático (`src/components/board/Poster.astro`).
2. [x] Tablero estático es/en: hero «Name band and rails», Servicios, Sectores, Método con la pieza viva (`<details name>`), Contacto con mailto y pie con créditos (`src/components/board/*`, `src/lib/board.ts`); copy final redactado en `src/i18n/es.ts` y `en.ts`; cuatro imágenes de dominio público en `src/assets/board/`.
3. [x] E2E del tablero sin JS (grupos, anclas, imágenes acreditadas, contacto, pieza viva) en `tests/e2e/site.spec.ts`; DESIGN.md al día (Overview, Layout, Imagery, Motion and 3D).

## Decisions

- Prior decision (memory): M1 decisiones del usuario, dirección dense-tiles -> DESIGN.md: current.
- Prior decision (memory): Flujo de entrega por change (commit + PR, CI verde, PRs encadenados) -> idd/config.yaml (team) y memoria del usuario: current.
- Decisiones del usuario (2026-10-21): M2 en tres changes; el agente redacta el copy y el usuario lo revisa en el PR; imágenes mixtas con prioridad a lo real (PD/CC0 de Wikimedia; un prompt de IA solo para huecos sin candidata, y el paisaje de Contacto se queda fuera por ahora); la acción principal lleva a un bloque de contacto con `mailto:retamozogpt@gmail.com`, cuyo texto visible es la propia dirección; la pieza viva va aquí, sin JS, como `<details name>` exclusivo, con cuatro tipos (web o CMS, software a medida, escritorio, agentes y automatización) y sin estado en la URL; los ids de sección se traducen por idioma.
- Imágenes elegidas por el usuario en una hoja de contactos en gris, todas de dominio público y con la especie comprobada en las categorías de Commons: Clusius 1576, p. 508 (*R. monosperma*, con raíces) en el hero; Cosson, *Illustrationes florae Atlanticae* Tab. 112 (*R. dasycarpa*) en Método; dos fotos de Javier Martín en la Dehesa Boyal de Puertollano (*R. monosperma*, planta y flores) en Servicios y Sectores. El gris va horneado en el archivo con ImageMagick, y las láminas se invierten sobre el grafito (papel al tono `surface-raised`, trazo a `on-surface`), como pidió el usuario. Las fuentes procesadas se guardan en `src/assets/board/` y Astro genera AVIF y WebP en el build.
- El póster de la escena es un SVG en línea dibujado en el build desde `retamaShape(571009059, …)`, la semilla del reparto de taste-skill. La misma función alimentará la escena 3D en `m2-hero-3d`, para que los tres niveles del ADR 0004 dibujen la misma planta. Solo la raíz principal va en `primary`. El elemento LCP medido es la banda del nombre (texto): LCP 1,7 s y CLS 0 en Lighthouse móvil.
- El h1 es la frase descriptiva de la ficha central, no el nombre: la banda «Retama» es display decorativo con `aria-hidden` (el nombre ya está en el enlace del wordmark), y el h1 lleva la propuesta de valor para buscadores.
- El mosaico de 12 columnas empieza en `lg` (1024 px); por debajo, el tablero de dos columnas, porque a 768 px una ficha de 3 columnas no cabe una frase a 32 px. Las filas son de 96 px y crecen si el contenido lo pide (utilidad `board-rows` en `global.css`, `minmax(var(--spacing-row), auto)`), y las imágenes van en `absolute inset-0` para no dimensionar su fila: la lámina vertical de Método estiraba todo el grupo.
- El ancla de contacto no está en la navegación: la fila de enlaces lleva Servicios, Sectores y Método, y a su lado va la única acción (ficha naranja) hacia el grupo de contacto, para que se vea en el primer pantallazo a 1440×900.
- La cabecera alinea su texto con el de las fichas (margen + padding de ficha), para que el texto no quede a 12 px del borde.
- El pie va fuera de `<main>`, en un slot `footer` nuevo de `Base.astro`, para conservar el landmark `contentinfo`; los créditos de imagen viven en `src/lib/board.ts` (iguales en los dos idiomas) y las palabras traducibles, en i18n.
- Revisión de taste-skill: `lint.mjs` 0 FAIL / 0 WARN. `inspect.mjs` deja 1 FAIL (`still-page`, la página no se mueve) porque la capa de movimiento es el change `m2-motion`, y 4 WARN justificados: `first-action` (la acción es una ficha de 96 px, una fila del tablero, y el detector solo cuenta controles de hasta 84 px), `no-footage` (la imagen en movimiento será la escena 3D), `off-centre` (las fichas tienen 12 px a los dos lados y el texto va sobre su padding), `small-title` (el h1 descriptivo de la decisión anterior). Corregido lo demás: texto al borde, titular de tres líneas a 390 px, falsa eyebrow (orden de las fichas del hero en el móvil), frases largas y filas de fichas iguales a 768 px.
- El presupuesto de JS por página del ADR 0001 se fija en `m2-hero-3d`, con la primera isla: este change no envía JavaScript.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-21T11:42:55.499Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-21T11:42:55.499Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-21T11:42:55.499Z)
- ev-4: living-doc-current for living-doc (2026-10-21T11:43:05.955Z)
<!-- ospec:evidence:end -->
