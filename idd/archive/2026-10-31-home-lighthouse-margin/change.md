# home-lighthouse-margin

## Intent and acceptance

La portada (/ y /en/) va al filo del 100 de rendimiento de Lighthouse y el check lighthouse del CI falla de vez en cuando, también en main: GSAP viaja en el script de arranque y entra en el FCP y el LCP simulados, y montar el movimiento es una sola tarea larga que suma TBT

Acceptance: La capa de movimiento (GSAP) se pide después del primer pintado con contenido y fuera del script de arranque, y su montaje se reparte en tareas cortas; en 10 pasadas locales de lhci sobre / y /en/ las cinco métricas de rendimiento puntúan 1,00 en todas, así que el TBT puede subir hasta ~90 ms sin bajar del 100; un E2E comprueba que el script del movimiento llega después del FCP; el check lighthouse del CI pasa

## Plan

<!-- ospec:plan:start -->
- Files: `DESIGN.md`, `src/components/Home.astro`, `src/scripts/motion.ts`, `tests/e2e/motion.spec.ts`, `tests/e2e/service-pages.spec.ts`
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- GSAP y la capa de movimiento salen del script de arranque de la portada a un import() dinámico que espera al load y a la entrada first-contentful-paint de PerformanceObserver: un script de prioridad alta que termina antes del primer pintado entra en el grafo del FCP y del LCP de Lighthouse (lantern), y con rAF o requestIdleCallback tras el load el trozo aún podía terminar antes del FCP
- El montaje del movimiento se reparte en una tarea por paso (cada grupo de entradas, el selector de sectores, el manifiesto y la cuenta), dentro del contexto de gsap.matchMedia con context.add, porque crear los from() de todas las entradas en una sola tarea costaba ~45 ms con la CPU a 4× y era la tarea larga que sumaba TBT
- Capítulos ya vistos (usuario, 2026-10-31): cuando la capa de movimiento llega, un grupo cuyo borde superior ya ha pasado su punto de entrada (85 % de la pantalla) se queda como viene en el HTML, sin entrada, y una cifra que ya ha pasado el suyo (90 %) no cuenta; los de más abajo entran como siempre
- Capítulos ya vistos, precisión de la decisión anterior: «ya vistos» es en pantalla o por encima (su borde superior por encima del borde inferior de la pantalla), no el punto de entrada del 85 % ni el del 90 % de la cifra, porque un capítulo que asoma por abajo también se ve; el resto de los capítulos conserva su entrada en el 85 %
- El selector de sectores y el manifiesto no son entradas y quedan igual: la vuelta arranca cuando el selector está en pantalla y el manifiesto va atado al scroll, solo con opacidad, así que ninguno esconde texto
- El registro de ScrollTrigger también va en una tarea propia, después de la que evalúa GSAP, y el primer paso del tablero en la siguiente: con la CPU a 4× y a 6× (Playwright, Emulation.setCPUThrottlingRate) no queda ninguna tarea larga tras el primer pintado, donde antes la de GSAP duraba 92-100 ms a 4×; la pasada con un núcleo (systemd-run CPUQuota=100%) se descarta como medida porque la domina el ruido, incluidas tareas largas del propio Lighthouse
<!-- ospec:decisions:end -->

Notas:

- La precisión de los capítulos ya vistos sustituye a la decisión que la precede: lo que vale es «en pantalla o por encima», que es lo que hace `seen()` en `motion.ts` y lo que dice DESIGN.md.
- E2E de las tarjetas de Servicios («se pulse donde se pulse»): ya era intermitente antes de este change, y con el movimiento diferido pasó a fallar casi siempre. Playwright comprueba que la tarjeta está quieta antes de hacer scroll, y el scroll dispara su entrada, que la sube RISE px; el clic, a 24 px del borde inferior, caía en el hueco entre tarjetas. Ahora el test hace scroll hasta la tarjeta y espera a que esté quieta (opacidad 1, sin transformación) antes de medirla. 12 de 12 repetido, y 235 de 235 con el spec del movimiento.
- Medidas locales con lhci (10 pasadas por portada, preset móvil simulado). Antes: FCP ~1.074 ms, LCP 1,56-1,75 s, TBT 28-130 ms, FCP y LCP a 0,99, categoría 0,9965 (una pasada a 0,98). Después: FCP ~920 ms, LCP 1,35-1,51 s, TBT 0, las cinco métricas a 1,00 en las 20 pasadas. El JS de arranque de la portada baja de ~52 KB a 7 KB gzip.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: repro-run-pair for repro-test (2026-10-31T13:49:34.656Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-31T14:07:53.591Z)
- ev-3: check-run for checks-pass (2026-10-31T14:18:03.063Z)
- ev-4: adr-impact-declaration for adr-impact-declaration (2026-10-31T14:18:03.063Z)
- ev-5: living-doc-current for living-doc (2026-10-31T14:18:21.362Z)
<!-- ospec:evidence:end -->
