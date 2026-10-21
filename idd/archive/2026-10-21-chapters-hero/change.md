# chapters-hero

## Intent and acceptance

Portada por capítulos (1/4): DESIGN.md y roadmap del hito, estructura de capítulos, cabecera con Hablemos fijo y hero «Software / a medida» con efecto de código sobre la escena 3D

Acceptance: En / y /en/ el primer capítulo muestra «Software» a tamaño display con «a medida» debajo, la retama 3D crece bajo la palabra, el h1 dice qué es Retama, «Retama» solo aparece como logo, el tablero del hero desaparece y un «Hablemos» fijo lleva al contacto; DESIGN.md describe los capítulos y pnpm design:lint, lint, test y e2e pasan

## Plan

1. [x] Copy es/en por capítulos (hero.word, hero.rest, hero.lead, nav.talk, manifesto.line1/2), cabecera con enlaces y «Hablemos» fijo que se oculta sobre el hero y el contacto (scroll-driven). Las cifras y el fragmento ADR pasan a Método.
2. [x] Primer intento: «Software» CSS con descifrado y la retama de líneas en una ficha 16:9. El usuario lo rechazó («no es impresionante»), y queda en la historia de la rama.
3. [x] Escena «del código a la planta» (`src/lib/glyph-scene.ts` puro y testeado, `scene-three.ts` en TSL, atlas en el worker). La etapa queda fijada a pantalla completa y la cámara baja por las raíces con el manifiesto. Hay bloom en la savia.
4. [x] Ajustes del usuario sobre lo construido:
   - El hover agita los glifos en vez de apartarlos.
   - «a medida» también en glifos y en primario.
   - Título centrado en escritorio.
   - El título vuelve a letras al terminar la lluvia, y el hover sobre él trae los glifos.
   - La «S» se alinea con la «a».
   - Botón de pausa en la esquina.
   - Sin el descifrado CSS al recargar.
   - Título no seleccionable.
5. [x] DESIGN.md, roadmap (M2.5 pasa a cinco changes: este absorbe el manifiesto; entran la cabecera y la optimización de la escena), Lighthouse 100×4 e inspector de taste-skill.

## Decisions

- Decisiones del usuario en el gate open-facts (2026-10-21): todas las recomendadas (descifrado, dos frases del manifiesto, trama de la retama para Servicios, reparto del hito, cabecera, Hablemos fijo, pruebas en Método, copy).
- Después de ver el primer hero, el usuario eligió el concepto «Del código a la planta», bloom solo en la escena y la bajada por las raíces con el manifiesto. Además pidió priorizar el efecto sobre Lighthouse y optimizar después. Con eso, este change absorbe el manifiesto (antes el change 2).
- Las palabras de glifos se colocan muestreando el título HTML en un canvas 2D con su propia fuente. Así el paso de glifos a letras coincide letra a letra, y en CSS el barrido es una máscara movida por `@property --solid` al mismo ritmo (t-open, lineal) que el uniform `reveal` del shader.
- La planta del hero se densifica (110 tallos, 16 raíces laterales, marco 1600×1900). La colocación compartida entre el póster y la escena está en `plantPlacement`: el 70 % del ancho desde lg y centrada por debajo.
- El bloom solo afecta a lo HDR (umbral 0,9). Con un umbral bajo levantaba todo el fondo a gris. Con mezcla aditiva, la corona se atenúa por distancia para que no se queme en blanco.
- Las palabras del manifiesto aún no tintadas van al 52 % de opacidad (unos 5:1): al 30 % daban 2,54:1 y, con el manifiesto a 22 px en el móvil (que no es texto grande), WCAG pide 4,5:1; con menos, Lighthouse bajaba accesibilidad a 96.
- El manifiesto va a tamaño statement por debajo de lg y a headline sobre 8 columnas desde lg, para no pasar de dos líneas (DESIGN.md y el inspector).
- Inspector de taste-skill: quedan dos FAIL de la propia herramienta, que ya salían en el «antes» (su servidor no sirve `.avif` ni las fuentes, y no ve las animaciones de GSAP). Se defienden estos WARN:
  - «a medida» en primario es decisión del usuario.
  - El h1 mide 18 px porque contiene dos tamaños.
  - No hay fotos ni vídeo propios.
  - La frase larga de Sectores se resuelve en el change 4.
- En los e2e, la escena con WebGL2 por software se rinde a los ~6 s. Por eso el paso a letras y el hover se prueban con un worker simulado.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-21T20:34:19.689Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-21T20:34:19.689Z)
- ev-3: check-run for checks-pass (2026-10-21T20:36:45.197Z)
- ev-4: contract-spec-and-test for contract-spec-and-test (2026-10-21T20:36:45.197Z)
- ev-5: adr-impact-declaration for adr-impact-declaration (2026-10-21T20:36:45.197Z)
- ev-6: living-doc-current for living-doc (2026-10-21T20:36:50.364Z)
<!-- ospec:evidence:end -->
