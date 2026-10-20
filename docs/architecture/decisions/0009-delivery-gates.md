# 0009. La plataforma despliega; el CI con puertas de calidad obligatorias autoriza la fusión

- Status: accepted
- Date: 2026-10-21

## Context and drivers
Hay presupuestos estrictos (`scenario:perf-mobile`), un solo responsable (`constraint:solo-team`) y el usuario pidió un preview por rama y versión SemVer automática (ronda 5).

## Options considered
1. Solo la integración Git de la plataforma: es simple, pero nada impide que una regresión llegue a producción.
2. Solo el CI, desplegando con la CLI: control total, pero hay que gestionar tokens y se pierden los previews nativos.
3. Modelo híbrido: la integración Git despliega los previews y producción; el CI ejecuta las puertas obligatorias en la protección de `main`.

## Decision
Desarrollo trunk-based. `main` es producción y solo se modifica por PR con todas las puertas en verde: lint, tipos, tests, E2E, presupuesto de rendimiento y auditoría de dependencias. Cada rama tiene su preview. Las versiones se calculan a partir de los mensajes de commit convencionales, en un PR de release que genera el changelog y la etiqueta.

## Consequences
- Más fácil: los despliegues son reversibles (se revierte el commit) y las regresiones se detectan antes de fusionar.
- Más difícil: el tiempo de CI pasa a formar parte del ciclo.
- Prohibido: hacer push directo a `main`.

## Fitness function
- La protección de rama de `main` exige los checks del CI. Se puede verificar con la API del repositorio.

## Review trigger
Entra una segunda persona en el equipo o se necesita un entorno de staging permanente.
