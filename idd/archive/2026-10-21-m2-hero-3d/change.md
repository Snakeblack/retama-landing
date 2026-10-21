# m2-hero-3d

## Intent and acceptance

Escena 3D progresiva del hero (ADR 0004): la retama del póster en Three.js (WebGPU, luego WebGL2, luego el póster), cargada tras el primer pintado y solo si su ficha es visible

Acceptance: En / y /en/ el póster SVG sigue siendo lo que se pinta primero; tras la carga, con la ficha visible, una escena Three.js de la misma planta (mismo generador y semilla) sustituye al póster sin salto y gira despacio; se pausa fuera de pantalla y con la pestaña oculta; con reduced-motion, ahorro de datos o GPU débil no se descarga y queda el póster; sin WebGPU usa WebGL2; ningún texto depende de ella; CSP sin violaciones, presupuesto de JS inicial y Lighthouse 100 x4

## Plan

Rama `feat/m2-hero-3d` desde `main` (7ae7ae4), un PR. Tres unidades:

1. [x] Planta y nivel, con tests: `src/lib/retama-scene.ts` levanta los trazos del póster al espacio (x e y intactos, profundidad de una segunda secuencia sembrada) y escribe en cada punto el crecimiento, la savia y el viento; `src/lib/scene-tier.ts` elige WebGPU, WebGL2 o póster y decide la GPU lenta por la mediana de los primeros frames. La semilla y el marco del póster pasan a `HERO` en `retama-shape.ts`, compartidos por `Poster.astro` y la escena.
2. [x] Escena: `src/scripts/scene.ts` (en el bundle inicial, pequeño) espera la carga, la ficha visible, un momento libre y el shutter; sondea la GPU; crea el canvas y lo pasa a `src/scripts/scene-worker.ts`, que construye `scene-three.ts` (Three r186, `three/webgpu` + TSL) en un worker. Capa de pausa en `Hero.astro` y etiquetas es/en; relevo póster → escena en `global.css`.
3. [x] DESIGN.md (Motion and 3D) y E2E (`tests/e2e/scene.spec.ts`): movimiento reducido, sin WebGPU ni GPU que rinda, WebGL2 corriendo con pausa al tocar y sin violaciones de CSP, y la vuelta al póster cuando la escena se rinde.

## Decisions

- Prior decision (memory): «M2 decisiones del usuario: 3 changes, copy, imágenes, contacto» -> docs/roadmap.md (M2): current; este es el tercer change (Three, póster, fallbacks, presupuesto de JS).
- Decisión del usuario (gate open-facts, 2026-10-21): no solo un giro sino una animación real: **viento en los tallos** (el cursor también es viento), **savia que sube** y **crecimiento al entrar**, aceptando que el póster se funde y la planta vuelve a crecer. No eligió el giro lento ni la inclinación: la escena no gira y la aceptación «gira despacio» queda sustituida por estos tres movimientos. GPU débil: sondeo antes de descargar y fps de los primeros frames.
- Decisión del usuario (WCAG 2.2.2): primero eligió un botón discreto; al verlo preguntó por qué hacía falta y, con las alternativas delante, eligió que **un toque o clic sobre la escena la pause**: una capa `<button>` transparente sobre la ficha, sin texto visible, con nombre accesible que cambia (Pausar/Reanudar la animación de la retama) y el anillo de foco hacia dentro, porque la ficha recorta lo que sale.
- La escena dibuja en un **Web Worker con OffscreenCanvas**. Medido: con Three en el hilo principal, Lighthouse móvil bajaba a 72 (TBT 0 → ~1,9 s por parsear 890 KB y construir los shaders tras la carga), lo que también arriesga el INP en un móvil real. En el worker vuelve a 100 con TBT 0. Sin `transferControlToOffscreen` se queda el póster. El worker es un chunk aparte (242 KB gzip) que no cuenta en el presupuesto inicial (46,6 KB de 60).
- Trazos como cintas de triángulos de 1 px CSS (2 px la raíz principal) y no `LineSegments`: WebGPU y WebGL2 solo dibujan líneas de 1 px de dispositivo, más finas que el póster en pantallas de alta densidad. Las cintas se dibujan por las dos caras.
- Cámara en perspectiva con lente estrecha (20°) que reconstruye el `xMidYMin slice` del `viewBox` del póster: de frente, la escena encuadra igual que el póster y la profundidad solo se nota con el viento.
- Sondeo de GPU en el hilo principal antes de descargar nada: adaptador WebGPU de respaldo o WebGL2 con `failIfMajorPerformanceCaveat` → póster. El navegador de los E2E dibuja WebGL2 por software, así que el test que la hace correr quita ese flag en el sondeo.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-21T16:58:48.310Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-21T16:58:48.310Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-21T16:58:48.310Z)
- ev-4: living-doc-current for living-doc (2026-10-21T16:58:53.525Z)
<!-- ospec:evidence:end -->
