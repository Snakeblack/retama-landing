# chapters-method

## Intent and acceptance

Rehacer Método, Sectores y Hablemos de la portada (M2.5 4/5) sobre el tablero oscuro: Método más corto y sin jerga, con el elegidor de proyectos como prueba; sin casillas huecas

Acceptance: En / y /en/, Método muestra título, frase y cifras 1/0/100 en una casilla, los cuatro principios en otra y el elegidor de cuatro proyectos (acordeón nativo exclusivo, en pestañas, sin JS) con tres decisiones marcadas Ejemplo; sin ADR, lint, tests, E2E, Lighthouse ni CMS en la página; Hablemos lleva título y entrada, la dirección, la respuesta de ejemplo y tres pasos; Sectores ajusta su fila superior; lint, typecheck, test, e2e y design:lint en verde

## Plan

1. Método (`src/components/board/Method.astro`). Primera fila: el título con su frase y las cifras 1, 0 y 100 al pie, y al lado los cuatro principios en una casilla. Debajo, el elegidor de proyectos: la casilla de la pregunta, cuatro pestañas de dos en dos y la ficha de tres decisiones, marcada «Ejemplo», a la derecha desde `lg` y debajo en el móvil. Las filas toman la altura de su contenido.
2. `global.css`: `[data-projects]` dispone el acordeón exclusivo en pestañas con subgrid y `::details-content`, como Sectores. Sin ese soporte, queda un acordeón normal. La pestaña abierta, que es el campo claro, no lleva el grano del suelo.
3. Hablemos (`Contact.astro`): el título y la entrada, la dirección en el campo claro, la respuesta de ejemplo a la derecha y, a todo el ancho, los tres pasos que siguen a escribir. Sectores: la fila de arriba sin `row-span`.
4. Salen `AdrFragment`, `ChecksFragment`, la lámina de Clusius y su crédito, y la casilla de créditos del pie. Se actualizan los textos es/en (sin jerga), DESIGN.md (Overview, Layout, grano e Imagery), el roadmap y los e2e.

## Decisions

- El usuario eligió el 2026-10-22, sobre maquetas con contenido real y el tablero oscuro: Método A sin lámina, los textos sin jerga tal cual, los tres pasos de Hablemos como ciertos y, en Sectores, solo el ajuste de la fila de arriba.
- Al no quedar ninguna imagen encontrada, la casilla «Créditos» del pie se quitaba o se quedaba vacía. Se quita, junto con `imageCredits` y las claves `footer.credits` y `footer.publicDomain`, y la marca ocupa 9 columnas. DESIGN.md mantiene la regla de acreditar en el pie cualquier imagen que vuelva.
- `data-count` se pone con `""` o `undefined`, nunca con un booleano: Astro pinta `data-count={false}` como `data-count="false"`, y entonces contaban las tres cifras.
- La leyenda inglesa dice «quality checks» y no «quality tests», para que el e2e sin jerga busque `tests?` sin excepciones.
- Las decisiones de A medida, Escritorio y Agentes y todo el inglés siguen el registro aprobado en la maqueta de Una web. Están registrados como supuestos para que el usuario los revise.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-22T08:35:35.339Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-22T08:35:35.339Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-22T08:35:35.339Z)
- ev-4: living-doc-current for living-doc (2026-10-22T08:35:41.548Z)
<!-- ospec:evidence:end -->
