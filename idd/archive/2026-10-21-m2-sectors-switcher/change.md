# m2-sectors-switcher

## Intent and acceptance

Sectores como selector compacto en vez de escena fijada: pestañas de los 4 sectores, igual en móvil y escritorio, que avanzan solas con barra de progreso mientras se ven y se paran al tocarlas; cada sector cuenta el problema del cliente y tres cosas que construimos, junto a su fragmento de ejemplo, que cobra vida como una app real; sin pin ni scroll extra

Acceptance: En / y /en/ Sectores ocupa menos de una pantalla en escritorio, no se fija y funciona igual en el móvil; las pestañas cambian el sector con un wipe, avanzan solas mientras se ven y paran al interactuar; cada sector muestra problema, tres entregables y su fragmento, que cambia de estado mientras se ve; sin JS es un acordeón exclusivo con todo el texto; con reduced-motion no avanza ni se anima; CSP sin violaciones, presupuesto de JS y Lighthouse 100 x4

## Plan

Misma rama y PR que `m2-sectors-scene` (`feat/m2-sectors-scene`, PR #18), como corrección tras verla construida. Tres unidades:

1. [x] Contenido: cada sector cuenta el problema del cliente y tres cosas que construimos (`sectors.itemNProblem`, `sectors.itemNBuild1..3`, `sectors.builds`) en es y en; sustituyen a las notas de una línea. Estados siguientes de los fragmentos (`frag.*` nuevos), escritos en el HTML (`data-live`).
2. [x] Selector: `Sectors.astro` es un acordeón exclusivo nativo (`<details name="sector">`) que `global.css` coloca como pestañas (subgrid y `::details-content`), 2×2 en el móvil y en fila desde `md`; título y frases en la fila de arriba. Fuera la escena fijada y su CSS.
3. [x] Movimiento (`src/scripts/motion.ts`): vuelta de 6 s por sector cada vez que el grupo entra en pantalla, con barra de progreso, wipe del panel y fragmento vivo (`liveFragment`); pausa con puntero o foco, parada al elegir pestaña y la pestaña abierta no se cierra. DESIGN.md (Motion) y E2E en escritorio, móvil, reduced-motion y sin JS.

## Decisions

- Prior decision (memory): «Sectores: selector compacto con fragmentos vivos en vez del pin» (este change): current; sustituye la escena fijada de `m2-sectors-scene`.
- Decisión del usuario (2026-10-21, tras ver la escena fijada): poca información, sin efecto wow, el único movimiento ligado al scroll de la página y nada en el móvil; no quiere hacer scroll para información de poco valor. Elige selector compacto, problema + qué construimos y fragmentos vivos.
- Decisiones del usuario (gate open-facts): una vuelta por entrada en pantalla, pausa con puntero o foco y parada al elegir pestaña, sin botón (WCAG 2.2.2); pestañas 2×2 en el móvil; 6 s por sector y un cambio de estado cada 1,5 s; la URL no guarda el sector; sin JS, el acordeón.
- Pestañas con `<details>` y no con `role="tablist"`: funcionan sin JS y ya existe el patrón en Método. La rejilla (subgrid sobre cada `details`, `pointer-events` solo en `summary` y contenido) va dentro de `@supports selector(::details-content)`; sin soporte queda el acordeón.
- Los sectores cerrados mantienen su tamaño ocultos (`content-visibility: visible; visibility: hidden` en `::details-content`): la fila mide lo que el sector más alto y la vuelta no mueve lo de debajo (CLS de campo).
- Los estados vivos se escriben en el HTML (`data-live`, `data-live-alert`) para que ningún texto exista solo tras el JS (ADR 0001); cada pase vuelve al estado del HTML. Los cuatro cambios de un pase duran 4,5 s.
- El ciclo de marcas del portal deja de tener su propio ScrollTrigger: es el pase vivo del sector Otros.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-21T14:31:30.431Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-21T14:31:30.431Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-21T14:31:30.431Z)
- ev-4: living-doc-current for living-doc (2026-10-21T14:32:19.422Z)
<!-- ospec:evidence:end -->
