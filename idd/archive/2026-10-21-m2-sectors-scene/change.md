# m2-sectors-scene

## Intent and acceptance

Escena fijada de Sectores (M2): desde lg la sección se fija y cada paso cambia el fragmento data-ui del grupo por uno propio del sector (Logística: rutas; Empresa: cola de aprobaciones; Gaming: herramienta de estudio; Otros: interfaz en marca blanca que cambia de marca) con un wipe y el nombre del sector en grande; todos rotulados «Ejemplo» y presentes en el HTML sin JS

Acceptance: En / y /en/ desde 1024px con movimiento la sección Sectores se fija unas 2,5 pantallas y recorre los 4 sectores, cada uno con su fragmento y un wipe entre ellos; por debajo de lg, con reduced-motion y sin JS no se fija y los cuatro sectores con sus fragmentos se ven; los textos están en es y en; CSP sin violaciones, presupuesto de JS y Lighthouse 100 x4

## Plan

Rama `feat/m2-sectors-scene` desde `feat/m2-motion` (PR #17 sin fusionar), con PR encadenado. Tres unidades:

1. [x] Fragmentos y copy: `RoutesFragment` pasa a `ExampleTable` (tabla de ejemplo genérica) para Logística, Empresa (cola de aprobaciones) y Gaming (editor de balance de la economía); `PortalFragment` para Otros (un portal de clientes con tres marcas inventadas: Norte, Sal y Faro). Claves nuevas en `es.ts` y `en.ts`.
2. [x] Sectores apilados: cada sector con su nombre, su nota y su fragmento (`[data-sectors]`); es la versión sin JS, en el móvil y con reduced-motion. Las dos frases quedan debajo.
3. [x] Escena fijada (`src/scripts/motion.ts`, `global.css`): desde `lg` con movimiento, `data-pinned` recoloca la rejilla (nombres a la izquierda, fragmentos apilados a la derecha), ScrollTrigger la fija centrada 2,5 pantallas y cada cuarto marca el nombre y hace el wipe del fragmento; el portal cicla sus marcas mientras está en pantalla. DESIGN.md describe la escena. E2E en escritorio, móvil, reduced-motion y sin JS.

## Decisions

- Prior decision (memory): «Sectores: pin retirado de m2-motion; escena con fragmento por sector en m2-sectors-scene» (idd/archive/2026-10-21-m2-motion/change.md): current; este change la construye.
- Decisiones del usuario (gate open-facts, 2026-10-21): sin escena, cada sector con su fragmento debajo; wipe por tiempo al cruzar cada cuarto, sin scrub ni snap; Empresa con cola de aprobaciones, Otros con un portal en marca blanca (solo cambian el nombre y el tono, nunca un segundo acento) y Gaming con un editor de balance de la economía del juego en vez de las builds; la lista de los cuatro nombres con el activo en tinta y su nota; las frases debajo, fuera del tramo; el ancla empieza en Logística; sin GSAP queda la versión apilada.
- Los hooks son `data-sectors*`: `data-scene` ya lo usa el póster del hero (la escena 3D).
- En el modo fijado, `ul` y `li` pasan a `display: contents`, así nombres y fragmentos son celdas de la misma rejilla y los fragmentos se apilan en una celda que abarca las cinco filas (explícitas: con `1 / -1` sobre filas implícitas no abarcaban nada).
- Las entradas se crean antes que el pin: con el pin creado, el hijo del grupo es el `pin-spacer` y la entrada le ponía un `transform`, que hace de bloque contenedor y anula el `position: fixed`. El pin lleva `refreshPriority: 1` para que los grupos de debajo midan su altura.
- La escena tiene su altura natural y se fija centrada; a pantalla completa los fragmentos dejaban media pantalla vacía. Si el grupo no cabe en la ventana, no se fija.
- La escena entra por sus piezas visibles (título, nombres y fragmentos), porque con `display: contents` la lista no tiene caja que animar.
- Las rejillas del grupo llevan `grid-cols-1` (`minmax(0, 1fr)`) y las tablas usan texto pequeño y relleno `sm` por debajo de `md` (DESIGN.md Imagery ya pide texto pequeño en los fragmentos): la cola de aprobaciones desbordaba el móvil de 360 px. A 320 px aún sobresale unos 18 px de su ficha.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: adr-impact-declaration for adr-impact-declaration (2026-10-21T14:04:16.874Z)
- ev-2: check-run for checks-pass (2026-10-21T14:05:35.755Z)
- ev-3: contract-spec-and-test for contract-spec-and-test (2026-10-21T14:05:35.755Z)
- ev-4: adr-impact-declaration for adr-impact-declaration (2026-10-21T14:05:35.755Z)
- ev-5: living-doc-current for living-doc (2026-10-21T14:05:41.007Z)
<!-- ospec:evidence:end -->
