# m2-hero-wind

## Intent and acceptance

El cursor sopla viento sobre la escena en vez de apartar los tallos

Acceptance: En una pantalla con puntero, los tallos cercanos al cursor se mecen con un viento más fuerte y rápido, sin inclinarse lejos de él; al salir el cursor el viento vuelve poco a poco a la brisa; táctil, movimiento reducido y póster no cambian

## Plan

En la rama `feat/m2-hero-3d`, un commit más en el PR #19, que aún no se ha fusionado. Una unidad:

1. [x] `src/scripts/scene-three.ts`: fuera el empuje radial. Alrededor del cursor (radio 260 unidades del póster), las ráfagas de ruido se hacen hasta 3,5 veces más amplias y se les suma un temblor de ruido más fino y unas siete veces más rápido, ambos ponderados por la altura del tallo como el viento base. `stormForce` (`src/lib/retama-scene.ts`, con test) sube la fuerza en torno a un segundo y la deja amainar en unos dos. DESIGN.md (Motion and 3D) describe el nuevo viento.

## Decisions

- Petición del usuario (2026-10-21, tras ver el PR #19): «no me gusta el efecto hover, me gustaria que se moviese como con más viento al acercar el hover».
- La velocidad del viento no se cambia por vértice: multiplicar el reloj por la cercanía haría saltar la fase del ruido al mover el cursor. Por eso el viento fuerte es una segunda capa de ruido más rápida y no el mismo ruido acelerado.
- Se queda igual: solo con hover y puntero fino (en táctil el toque pausa) y sin cambios en los niveles, la carga ni el worker. La intensidad se juzga en el preview.
- Medido en WebGPU (Chromium, 1440×900, zona de 320 px alrededor de la copa, píxeles que cambian en 100 ms): unos 3.200 sin cursor, 6.300 con él y 3.500 tres segundos y medio después de que salga.
