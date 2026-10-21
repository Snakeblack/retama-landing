# chapters-header

## Intent and acceptance

Cabecera M2.5: flota sobre el hero, selector ES / EN compacto y, en el móvil, botón Índice que abre un panel modal con los capítulos, el actual marcado y Hablemos

Acceptance: En / y /en/ la cabecera flota sobre el hero sin segunda fila de enlaces en el móvil; el botón Índice abre un dialog modal (foco dentro, Escape cierra) con Inicio, Servicios, Sectores y Método, el capítulo actual marcado y Hablemos; pulsar un capítulo cierra el panel y lleva a él; la cabecera se esconde al bajar y vuelve al subir; DESIGN.md lo describe y lint, typecheck, test, e2e y design:lint pasan

## Plan

1. [x] Copy es/en (`nav.index`, `nav.close`, `nav.home`, `nav.here`) y `LangSwitch.astro` (`ES / EN`): el idioma actual en tinta y el otro como enlace, que a la tecnología de apoyo le da su nombre completo.
2. [x] La cabecera de `Base.astro` es una barra fija con la franja primaria. Las ranuras son `nav` (enlaces desde md), `menu` (índice en el móvil) y `action` (el «Hablemos», fuera de la barra que se mueve). El hero y la 404 dejan sitio debajo de ella con `--header-height`.
3. [x] `ChapterIndex.astro`: un `<dialog>` modal que se abre con `command="show-modal"` y se cierra con `command="close"`. Lleva teselas por capítulo y «Hablemos» abajo, y el foco entra en «Cerrar».
4. [x] `header.ts`: la cabecera se esconde al bajar y vuelve al subir, salvo con el teclado dentro. Además, cierra el índice al elegir, marca el capítulo actual y abre el diálogo donde no hay invoker commands.
5. [x] CSS: fondo transparente sobre el hero, con scroll-driven; barrido y entrada escalonada del índice; `scroll-margin-top` en los capítulos.
6. [x] e2e `header.spec.ts`, ajuste del selector de idioma en `site.spec.ts`, DESIGN.md (Layout, Elevation y Motion) y roadmap.

## Decisions

- Respuestas del usuario en el gate open-facts (2026-10-21), todas las recomendadas:
  - El índice, solo por debajo de md; desde md, los enlaces siguen en la cabecera.
  - Los textos propuestos, sin barajado de letras.
  - La cabecera se esconde al bajar en todas las anchuras.
- Antes, el usuario eligió la B+ entre las maquetas A, B+ y las demás.
- `<dialog>` modal con invoker commands en vez de `popover`: el modal atrapa el foco y deja inerte el resto, y abre y cierra sin script. Sin JS, elegir un capítulo navega por detrás y el diálogo se cierra con «Cerrar» o Escape.
- El «Hablemos» fijo sale de la barra a la ranura `action`: un `translate` en un ancestro cambiaría su caja contenedora y se movería con la cabecera. El diálogo puede quedarse dentro porque está en el top layer.
- La cabecera solo se queda fija con el foco por teclado (`:focus-visible`). Si contara cualquier foco, tras cerrar el índice con un toque el foco volvería al botón y la cabecera ya no se iría.
- El salto a un capítulo cae bajo la cabecera con `scroll-margin-top`, en vez de esconderla con script durante el salto.
- La cabecera toma el fondo entre `exit 100% - 2h` y `exit 100% - h` del hero, para que lo tenga antes de que el siguiente capítulo pase por debajo. Con `exit 90%–100%` llegaba tarde.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: adr-impact-declaration for adr-impact-declaration (2026-10-21T21:07:48.192Z)
- ev-2: check-run for checks-pass (2026-10-21T21:10:07.159Z)
- ev-3: contract-spec-and-test for contract-spec-and-test (2026-10-21T21:10:07.159Z)
- ev-4: adr-impact-declaration for adr-impact-declaration (2026-10-21T21:10:07.159Z)
- ev-5: living-doc-current for living-doc (2026-10-21T21:10:12.558Z)
<!-- ospec:evidence:end -->
