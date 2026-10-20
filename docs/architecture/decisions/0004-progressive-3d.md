# 0004. Escena 3D como mejora progresiva que nunca bloquea

- Status: accepted
- Date: 2026-10-21

## Context and drivers
Impacto visual de vanguardia (`scenario:brand-impact`) dentro del presupuesto de rendimiento (`scenario:perf-mobile`), en dispositivos sin GPU moderna y para usuarios con movimiento reducido.

## Options considered
1. Escena 3D cargada al inicio como elemento principal: impacta, pero arruina el LCP y el INP en móvil.
2. Vídeo pregrabado: es ligero, pero no es interactivo ni demuestra dominio técnico.
3. Mejora progresiva: imagen estática optimizada como elemento LCP. La escena se carga diferida, eligiendo la mejor API gráfica disponible y degradando a una compatible o a la imagen.

## Decision
El elemento LCP es siempre HTML o una imagen. La escena se descarga e inicia después del primer pintado y solo si es visible. Si el usuario pide movimiento reducido, si el ahorro de datos está activo o si la GPU no rinde, la escena se queda estática o no se carga. El render se pausa fuera de pantalla y con la pestaña oculta.

## Consequences
- Más fácil: cumplir el presupuesto y garantizar accesibilidad.
- Más difícil: mantener tres niveles de presentación coherentes en lo visual.
- Prohibido: que el contenido o la navegación dependan de la escena.

## Fitness function
- Lighthouse en CI con el presupuesto de `scenario:perf-mobile`.
- Check: `pnpm build && pnpm exec lhci autorun`
- Un test E2E con movimiento reducido y otro con la API gráfica moderna desactivada verifican que hay un fallback visible.

## Review trigger
La escena no cabe en el presupuesto tras optimizarla, o el soporte de la API gráfica moderna cambia de forma sustancial.
