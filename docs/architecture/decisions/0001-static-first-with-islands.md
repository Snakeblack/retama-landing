# 0001. Renderizado estático por defecto con islas interactivas aisladas

- Status: accepted
- Date: 2026-10-21

## Context and drivers
La web tiene que conseguir Lighthouse 100 y un LCP de 1,8 s o menos en móvil (`scenario:perf-mobile`). También tiene que llegar completa a buscadores y motores de IA sin ejecutar JS (`scenario:seo-discovery`). La experiencia visual es muy rica (`scenario:brand-impact`) y la mantiene una sola persona (`constraint:solo-team`).

## Options considered
1. Aplicación de una sola página con runtime de componentes: las transiciones son ricas, pero el runtime se envía siempre y el contenido depende de JS.
2. Render en servidor bajo demanda en cada petición: el contenido siempre está fresco, pero cuesta cómputo por visita y no aporta nada a contenido que cambia en cada release.
3. HTML generado en build, con islas interactivas que hidratan de forma independiente y diferida: no hay JS salvo donde hace falta, el HTML está completo y se puede cachear en el borde.

## Decision
Todas las páginas se generan en build como HTML estático. La interactividad (escena 3D, formulario) vive en islas aisladas que se hidratan cuando la isla es visible o el hilo está libre. Ninguna isla es necesaria para leer el contenido ni para navegar.

## Consequences
- Más fácil: rendimiento, cacheo, SEO y superficie de ataque mínima.
- Más difícil: el estado compartido entre islas tiene que ir por eventos del DOM.
- Prohibido: contenido que solo exista tras la hidratación.

## Fitness function
- El HTML de cada página contiene todos los encabezados y textos sin ejecutar JS. Lo verifica un test E2E con JS desactivado.
- El presupuesto de JS por página se comprueba en CI.
- Ambas comprobaciones se convertirán en líneas `- Check:` cuando exista el scaffold (primer slice).

## Review trigger
La web necesita contenido personalizado por usuario o datos en tiempo real.
