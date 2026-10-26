# report-timing-test

## Intent and acceptance

El test de tiempo casi lineal de `tests/unit/report.test.ts` comprueba la complejidad del parser de informes y no la
velocidad del runner (issue #73).

Acceptance: el test falla si una regex de `src/lib/report.ts` vuelve a ser cuadrática (1 KB frente a 8 KB) y no
depende de un límite de reloj absoluto que un runner cargado supera.

## Plan

1. `tests/unit/report.test.ts`: los 14 casos adversarios se generan para un tamaño dado; cada uno se mide con 8 KB y
   con 1 KB, y se compara cuánto crece el tiempo. Solo cambia el test: `src/lib/report.ts` queda igual.

## Decisions

- Open facts (usuario, 2026-10-26): relación por caso entre 8 KB y 1 KB; umbral 24 (lineal ≈ 8, cuadrático ≈ 64);
  un caso que lee 8 KB en menos de 1 ms pasa sin comparar, porque los cuadráticos tardaban de 26 a 63 ms.
- Reproducción: el test anterior, con vitest fijado a un núcleo que comparte con tres bucles ocupados, falla igual que
  en CI (`expected 58.8 to be less than 50`); el nuevo pasa con el mismo comando.
- El caso de 1 KB se lee 8 veces por ejecución, así que las dos medidas duran lo mismo y el planificador las
  interrumpe por igual. Sin eso, con carga la relación de 8 KB subía a 26–35 y el test fallaba siempre.
- Mediana de 9 ejecuciones en vez del mejor de 7 que se acordó: con carga, el mejor de 7 falló en 7 de 8 intentos
  (relaciones de 25 a 37), porque el mínimo depende de la única ejecución que el planificador no interrumpe; la
  mediana pasó 8 de 8.
- Prueba de mutación: con la regex `EMAIL` sin acotar y la lazy de `FRAME_URL` de antes del client-errors, el test
  marca los 9 casos cuadráticos (relaciones de 45 a 67) con carga y sin ella.
