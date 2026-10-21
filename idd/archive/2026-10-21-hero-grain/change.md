# hero-grain

## Intent and acceptance

Grano en el hero sin coste en la carga: la escena dibuja el grano de la página en su shader (fundido al crecer la retama) y el grano CSS de los fondos se activa tras load; arregla el 99 de Lighthouse del PR #22

Acceptance: Con la escena, el fondo del hero lleva el mismo grano que el resto (misma media y desviación medidas) y los glifos solo la capa ligera; Lighthouse móvil vuelve a 100 con LCP y Speed Index iguales a sin grano; el grano CSS de los fondos sigue igual tras load; con movimiento reducido el escenario del hero lleva el grano CSS; ospec check pasa

## Plan

1. [x] `src/lib/grain.ts`: un tile de ruido de valor fractal, dos octavas y repetible sin costura, con su test unitario.
2. [x] `scene-three.ts`: el shader multiplica el grano del suelo sobre el grafito y la capa ligera sobre los glifos, con la máscara por luminancia, en sRGB pasado a lineal. Queda calibrado con la misma media y desviación que el suelo CSS (22,6 ± 1,33 frente a 22,9 ± 1,33). Entra en un fundido de 0,8 s al asentarse la escena, y hasta entonces un `If` se salta el trabajo.
3. [x] `global.css`: el grano CSS pasa del body y de la capa fija a `[data-grounds]` (los capítulos tras el hero), al pie y al índice. Se activa con `:root[data-grain]`, que `header.ts` pone en `load`. Con movimiento reducido, el escenario lleva el grano desde el principio.
4. [x] e2e `grain.spec.ts`, DESIGN.md (Elevation & Depth).

## Decisions

- El usuario quería el grano sobre todo en el hero y pidió darle una vuelta antes de aceptar la opción recomendada, que era quitarlo del hero (2026-10-22).
- Diagnóstico, con Lighthouse en local con y sin GPU y la tira de fotogramas:
  - La escena corre dentro de Lighthouse con GPU por software.
  - Las imágenes SVG del grano CSS retrasaban el LCP unos 75 ms aunque estuvieran fuera de pantalla: el filtro feTurbulence se pinta en la carga.
  - Cualquier trabajo extra en el shader durante el montaje ralentizaba el barrido del título y subía el Speed Index de 1,07 a 1,8 s. En el CI eso daba un 99.
- Medido después del cambio: rendimiento 1, LCP 1,54 s y Speed Index 1,07 s, igual que sin grano, con y sin GPU.
- El ruido se precalcula en un tile y no con `mx_noise_float` por píxel: así cada píxel solo hace una lectura.
- Supuestos aceptados: sin JS no hay grano CSS; con el póster sin escena (GPU débil o rendida) el hero va sin grano; durante los ~6 s del montaje la escena va sin grano.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-21T22:40:44.744Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-21T22:40:44.744Z)
- ev-3: living-doc-current for living-doc (2026-10-21T22:40:51.721Z)
<!-- ospec:evidence:end -->
