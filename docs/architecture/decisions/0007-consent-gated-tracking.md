# 0007. Medición sin cookies como base; seguimiento con cookies solo tras consentimiento

- Status: accepted
- Date: 2026-10-21

## Context and drivers
RGPD y LSSI con la guía de la AEPD sobre analítica (`constraint:rgpd-lssi`), privacidad (`scenario:privacy-security`) y peso de scripts (`scenario:perf-mobile`). Los heatmaps se aplazan a v2 (ronda 7).

## Options considered
1. Analítica completa con cookies desde el inicio y banner: da muchos datos, pero empeora la experiencia, añade peso y obliga a gestionar el consentimiento ya en v1.
2. Solo medición sin cookies: no hace falta banner, pero no hay heatmaps ni grabaciones.
3. Base sin cookies en v1. En v2, una herramienta de comportamiento que se carga solo tras un consentimiento explícito y revocable.

## Decision
v1 mide de forma agregada, sin cookies ni identificadores persistentes, y no muestra banner. Cualquier herramienta que use cookies o grabe sesiones se carga solo después de un opt-in explícito, y se puede retirar con la misma facilidad.

## Consequences
- Más fácil: v1 se lanza sin banner y con mejor rendimiento.
- Más difícil: el análisis de intención detallado espera a v2.
- Prohibido: cargar cualquier script de seguimiento con cookies antes del consentimiento.

## Fitness function
- Un test E2E sin consentimiento comprueba que no se crean cookies ni se hacen peticiones a dominios de seguimiento.
- Check: `pnpm test:e2e --grep "ADR 0007"`

## Review trigger
Se activan los heatmaps (v2) o cambia la guía de la AEPD.
