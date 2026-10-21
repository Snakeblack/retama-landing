# m2-motion

## Intent and acceptance

Capa de movimiento de la portada (M2 2/3): tokens de movimiento, shutter de la escena, entradas por grupo, respuesta de cada control, escena fijada de Sectores y lupa de código sobre la banda «Retama», con presupuesto de JS por página (ADR 0001)

Acceptance: En / y /en/ la escena se abre con el shutter, cada grupo entra una vez al llegar, los controles responden, Sectores se fija en escritorio y la lupa muestra código bajo el puntero (pasada automática en táctil); con reduced-motion solo hay fundidos; sin JS todo el contenido sigue visible; CSP sin violaciones, presupuesto de JS comprobado en CI y Lighthouse 100 x4

## Plan

Rama `feat/m2-motion` desde `main` (M2 board ya fusionado). Cuatro unidades:

1. [x] Tokens de movimiento: `pnpm design:theme` genera la tabla Motion de DESIGN.md en `theme.css` (`scripts/lib/motion-tokens.mjs`) y `src/lib/motion.ts` los lee de la página (curvas cubic-bezier resueltas en JS, tiempos en segundos). Tests unitarios.
2. [x] Shutter en CSS (`[data-shutter]`, keyframes `shutter` y `settle`) y respuesta en cada control (utilidad `feedback`: color en `t-hover`, hundido de `--spacing-focus` en `t-press`).
3. [x] Capa GSAP (`src/scripts/motion.ts`, isla única de la portada): entradas por grupo y la cifra «100» que cuenta; presupuesto de JS (`scripts/lib/js-budget.mjs`, `node scripts/fitness.mjs js-budget`) como `- Check:` del ADR 0001 y paso de CI.
4. [x] Lupa de código sobre la banda «Retama» (`[data-lens]`, `/code-lens.svg`) y enmiendas de DESIGN.md (tokens generados, monoespaciada solo en la lupa, segundo gesto firma). E2E de movimiento en escritorio, móvil, reduced-motion y sin JS.
5. [x] Escena fijada de Sectores retirada por decisión del usuario; pasa a su propio change (`m2-sectors-scene`).

## Decisions

- Prior decision (memory): «M2: retama solo dos veces… y la lupa de código para m2-motion» (idd/archive/2026-10-21-m2-board-imagery/change.md): current; este change la construye.
- Decisiones del usuario (gate open-facts, 2026-10-21, «todas las recomendadas»): scroll nativo sin Lenis (DESIGN.md prohíbe secuestrar el scroll); Sectores se fija solo desde `lg` unas 2,5 pantallas recorriendo los 4 sectores, sin snap, y no se fija por debajo de `lg` ni con reduced-motion; 60 KB gzip de JS al inicio por página; monoespaciada del sistema; tokens generados desde la tabla de DESIGN.md.
- El shutter es CSS puro: corre en el primer pintado, no depende de que cargue el script y no parpadea. El primer pantallazo no tiene entradas para no retrasar el LCP; solo cuenta la cifra «100» (contar hasta 0 o 1 no dice nada).
- La capa de la lupa es un `::after` con `content: attr(data-text)` dentro de un `span` con el mismo texto: hereda fuente, tamaño y tracking, así que coincide letra a letra sin contornos ni SVG de la palabra. Se rellena con `background-clip: text` y una máscara radial que mueven `--lens-x/--lens-y` (CSSOM, permitido por la CSP del ADR 0006). Sin JS `--lens` vale 0 y no dibuja nada.
- La textura es el fuente real de `src/lib/retama-shape.ts` servido como `/code-lens.svg` (endpoint estático), en flujo continuo sin sangrías: con las líneas originales el código quedaba demasiado disperso dentro de los trazos de peso 300 y las letras se leían huecas. El SVG solo usa atributos de presentación (sin `style`), porque la CSP de `_headers` también se aplica a él.
- La textura se escala con la palabra (`background-size: 90% auto`): a 8 px fijos, en el móvil (banda de 104 px) el código era más grueso que los trazos y la «R» dejaba de leerse.
- Decisión del usuario (2026-10-21, tras verla construida): la escena fijada de Sectores no convence. Fijar la página dos pantallas y media solo para cambiar el color de una lista no enseña nada nuevo y queda «hecho pero sin sentido». Se retira de este change, DESIGN.md vuelve a la línea original del presupuesto y la aceptación queda sin el pin. La escena se rehace en su propio change, `m2-sectors-scene`: en cada paso cambia la imagen del grupo por un fragmento de interfaz propio del sector (Logística: panel de rutas; Empresa: cola de aprobaciones interna; Gaming: herramienta de estudio; Otros: una misma interfaz en marca blanca que cambia de marca), con un wipe entre ellos, todos rotulados «Ejemplo» y presentes en el HTML sin JS.
- El minificador de CSS reescribe los tiempos (`240ms` → `.24s`) y las curvas (`0.22` → `.22`): el lector de tokens acepta las dos formas.
- La línea `- Check:` del presupuesto sustituye en el ADR 0001 a la frase que la anunciaba para M2, sin tocar la decisión (el mismo criterio que en S1). Cuenta los scripts de cada página y sus imports estáticos; los `import()` (la escena 3D de m2-hero-3d) no cuentan. Hoy son 44,6 KB gzip.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-21T13:09:48.119Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-21T13:09:48.119Z)
- ev-3: frozen-review for trust-review (2026-10-21T13:11:25.652Z, subagent-stop)
- ev-4: check-run for checks-pass (2026-10-21T13:13:19.240Z)
- ev-5: adr-impact-declaration for adr-impact-declaration (2026-10-21T13:13:19.240Z)
- ev-6: frozen-review for trust-review (2026-10-21T13:14:43.077Z, subagent-stop)
- ev-7: check-run for checks-pass (2026-10-21T13:16:10.107Z)
- ev-8: adr-impact-declaration for adr-impact-declaration (2026-10-21T13:16:10.107Z)
- ev-9: check-run for checks-pass (2026-10-21T13:29:19.808Z)
- ev-10: adr-impact-declaration for adr-impact-declaration (2026-10-21T13:29:19.808Z)
- ev-11: frozen-review for trust-review (2026-10-21T13:31:21.668Z, subagent-stop)
- ev-12: check-run for checks-pass (2026-10-21T13:32:49.329Z)
- ev-13: adr-impact-declaration for adr-impact-declaration (2026-10-21T13:32:49.329Z)
- ev-14: living-doc-current for living-doc (2026-10-21T13:32:52.725Z)
<!-- ospec:evidence:end -->
