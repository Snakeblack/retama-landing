# 0005. Los tokens de diseño tienen una sola fuente de verdad, legible por personas y agentes

- Status: accepted
- Date: 2026-10-21

## Context and drivers
Hace falta una marca coherente y premium (`scenario:brand-impact`). El autor tiene poca experiencia en diseño y trabaja con agentes (`constraint:solo-team`), y el contraste debe ser accesible (`scenario:perf-mobile`, porque Lighthouse incluye accesibilidad).

## Options considered
1. Tokens escritos directamente en las hojas de estilo: no exige nada más, pero los agentes no reciben el porqué y los valores se dispersan.
2. Herramienta de diseño externa como fuente: es visual, pero queda fuera del repositorio y no se puede verificar en CI.
3. Un documento en la raíz con tokens estructurados más su justificación en prosa, del que se genera el tema de estilos.

## Decision
Un único documento en la raíz define los tokens (color, tipografía, espaciado, formas, componentes, movimiento) y explica su intención. El tema de estilos se genera a partir de él y no se edita a mano. Todo trabajo de UI, humano o de agente, lee ese documento antes de empezar.

## Consequences
- Más fácil: coherencia, revisión de diffs de diseño y uso por agentes.
- Más difícil: cada cambio visual pasa por el documento.
- Prohibido: colores o tamaños sueltos en los componentes.

## Fitness function
- Lint del documento (estructura y contraste WCAG) en CI.
- Comprobación de que el tema generado está sincronizado con el documento.
- Regla de lint de estilos que rechaza valores sueltos.
- Check: `pnpm design:lint` (lint con contraste y sincronía del tema, desde el slice 1).
- La regla de lint de estilos llega con el slice de diseño (M1).

## Review trigger
La especificación del documento cambia de forma incompatible o se adopta una herramienta de diseño colaborativa.
