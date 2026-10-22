# chapters-services

## Intent and acceptance

Rehacer el capítulo Servicios de la portada (M2.5 3/5): cuatro tarjetas de servicio con una trama de puntos de la retama generada en el build

Acceptance: En / y /en/, el capítulo Servicios muestra su encabezado y cuatro tarjetas (nombre y una frase cada una, en es y en) con una trama de puntos de la retama dibujada en el build y sin JS; design:lint, e2e y Lighthouse móvil siguen en verde

## Plan

1. Servicios (`src/components/board/Services.astro`): el encabezado sobre el fondo y cuatro tarjetas (nombre a tamaño statement y una frase). La retama del póster va en cada tarjeta como trama de puntos: un `<g>` definido una vez, que cada tarjeta muestra con su `viewBox`. Desde `lg`, cada una enmarca su parte de la planta; por debajo, son cortes seguidos de una misma columna. La tercera es el campo claro. `strokePath` pasa a `retama-shape.ts` y el póster lo comparte.
2. Método recibe el fragmento de las puertas (6×5, en el hueco bajo el ADR) y la cifra «1 interlocutor» (6×3).
3. `global.css`: los puntos aparecen de arriba abajo con un `clip-path` ligado al scroll (`view()`). Con movimiento reducido, o sin soporte, ya están dibujados.
4. DESIGN.md (Layout, Imagery y Motion), roadmap, textos es/en y tests (`tests/e2e/services.spec.ts` y `strokePath`).

## Decisions

- Respuestas del usuario en open-facts (2026-10-22): composición A, escritorio dentro de Software a medida, puertas y cifra a Método, entrada escalonada y trama que se dibuja con el scroll.
- La trama usa `stroke-dasharray="0 5"` con remate redondo sobre los paths del generador, en lugar de miles de `<circle>`: un solo juego de paths, al que las tarjetas llegan por `<use>`. El HTML crece 15 KB sin comprimir y 0,8 KB con gzip.
- Se usa `<g>` en `<defs>` y no `<symbol>`: un `<symbol>` sin `viewBox` recortaría la planta al tamaño del `viewBox` de cada tarjeta.
- Las claves `services.figure*` conservan el nombre en Método, como ya hacen `hero.figure*`.
- `dots-draw` termina en `inset(0)` explícito: un `inset()` no interpola contra `none`, y sin ese final los puntos aparecían de golpe a mitad del recorrido. Lo cubre un e2e. `index-wipe` (cabecera) tiene el mismo defecto; queda fuera de este change y se reporta.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-22T00:15:17.232Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-22T00:15:17.232Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-22T00:15:17.232Z)
- ev-4: check-run for checks-pass (2026-10-22T00:17:33.654Z)
- ev-5: contract-spec-and-test for contract-spec-and-test (2026-10-22T00:17:33.654Z)
- ev-6: adr-impact-declaration for adr-impact-declaration (2026-10-22T00:17:33.654Z)
- ev-7: living-doc-current for living-doc (2026-10-22T00:17:37.838Z)
<!-- ospec:evidence:end -->
