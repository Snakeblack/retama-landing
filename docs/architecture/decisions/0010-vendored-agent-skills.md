# 0010. Herramientas de agente vendorizadas, fijadas y auditadas, con un solo dueño por tema

- Status: accepted
- Date: 2026-10-21

## Context and drivers
El desarrollo depende de agentes de IA (`constraint:solo-team`). Las skills de terceros son una superficie de inyección de instrucciones y de cadena de suministro (`scenario:privacy-security`). El usuario pidió que estén en el propio repositorio.

## Options considered
1. Instalación global desde marketplaces: las actualizaciones son cómodas, pero las instrucciones pueden cambiar sin revisión y no se comparten con el repositorio.
2. Skills que descargan sus instrucciones en cada uso: siempre están al día, pero el contenido es remoto y mutable.
3. Copia dentro del repositorio, fijada a un commit concreto, auditada, con licencia y un único tema por skill.

## Decision
Las skills de agente se copian en el repositorio desde un commit fijado y se auditan antes de entrar: inyección, red, escritura fuera del repositorio, telemetría y atribución. Un manifiesto registra origen, commit, licencia y veredicto. Cada tema (dirección de arte, animación, 3D, calidad web, plataforma) tiene una sola skill responsable. Ninguna skill puede descargar instrucciones en tiempo de uso.

## Consequences
- Más fácil: comportamiento reproducible y revisable en cada PR.
- Más difícil: las actualizaciones son manuales y se revisan con diff.
- Prohibido: dos skills con el mismo tema, o skills con hooks o instrucciones remotas.

## Fitness function
- Un test compara el manifiesto con el contenido de las skills vendorizadas (hash por archivo).
- Un escaneo en CI busca patrones de riesgo: URLs de las que se descargan instrucciones, scripts remotos ejecutados sin revisión y caracteres invisibles.

## Review trigger
Una skill aparece comprometida, su licencia cambia o surge una oficial que cubre mejor su tema.
