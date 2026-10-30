# 0014. Una versión por cambio, con el procedimiento de entrega del playbook de Retama

- Status: accepted
- Date: 2026-10-30
- Amends: [0009](0009-delivery-gates.md)

## Context and drivers
El ADR 0009 calculaba cada versión a partir de los commits convencionales, en un PR de release que abría release-please con un token propio: un PAT con permiso de escritura guardado en un repositorio público (`scenario:privacy-security`). Retama entrega ahora todos sus proyectos con el mismo procedimiento, la skill `retama:delivery` de su playbook: una versión por cambio fusionado, con el OK del responsable, y un changelog que escribe `ospec close`. Un solo responsable (`constraint:solo-team`) no mantiene bien dos procedimientos. El playbook sube el commit de release directo a `main`, pero aquí `main` está protegida (ADR 0009) y lo rechaza.

## Options considered
1. Mantener release-please: la versión sale sola de los commits, pero exige un token propio y un segundo PR con su CI por cada versión, y se aparta de los demás proyectos de Retama.
2. El commit de release directo a `main`, como en el playbook: el mismo procedimiento que en la app y el playbook, pero obliga a quitar la protección a los administradores, y un push a `main` despliega en producción sin pasar las puertas.
3. El commit de release como último commit del PR del cambio: conserva la protección de `main` y no añade ninguna ronda de CI, a cambio de acordar la versión antes de fusionar.

## Decision
Opción 3. Cada cambio fusionado lleva su versión SemVer, con el OK del responsable, que decide antes si rompe la compatibilidad. `ospec close` escribe la entrada del cambio en `[Unreleased]` de `CHANGELOG.md`, en el formato de Keep a Changelog. El último commit del PR es `chore(release): x.y.z`: pasa `[Unreleased]` a `## [x.y.z] - AAAA-MM-DD` y sube `package.json`. Tras la fusión, la etiqueta anotada `vX.Y.Z` va sobre el SHA de ese commit en `main`, comprobado antes de etiquetar, y se publica su GitHub Release con las notas de su sección. El resto del ADR 0009 sigue vigente.

## Consequences
- Más fácil: un solo procedimiento de entrega en todos los proyectos de Retama, sin token propio en el repositorio ni PR de release aparte.
- Más difícil: la versión deja de ser automática y se decide antes de fusionar. La etiqueta y la GitHub Release son pasos a mano tras la fusión (`AGENTS.md`, Entrega).
- Prohibido: quitarle a `main` la exigencia de PR o la protección de los administradores, dejar que alguien se salte el PR o admitir force push: este procedimiento se apoya en que nadie suba directo a `main`.

## Fitness function
- La protección de `main` exige PR sin excepciones y los checks del CI, también a los administradores, y no admite force push. Se puede verificar con la API del repositorio.
- Check: `node scripts/fitness.mjs branch-protection`

## Review trigger
El playbook de Retama cambia su procedimiento de release, `main` deja de estar protegida o entra una segunda persona en el equipo.
