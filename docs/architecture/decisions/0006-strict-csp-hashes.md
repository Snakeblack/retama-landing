# 0006. CSP estricta basada en hashes de build y navegación entre documentos nativa

- Status: accepted
- Date: 2026-10-21

## Context and drivers
Seguridad (`scenario:privacy-security`), con todas las páginas estáticas (ADR 0001). Un nonce exige render por petición, lo que choca con `scenario:perf-mobile`.

## Options considered
1. CSP con nonce por petición: es robusta, pero obliga a renderizar en servidor cada página.
2. CSP con hashes calculados en build y cabeceras estáticas: robusta y compatible con lo estático. A cambio, impide scripts inline dinámicos y los enrutadores de cliente que los inyectan.
3. Sin CSP o con `unsafe-inline`: es sencillo, pero inaceptable para una empresa de software que vende garantías.

## Decision
La CSP se genera en build con hashes de cada script y estilo. Se entrega como cabecera estática junto a HSTS, nosniff, Referrer-Policy, Permissions-Policy y `frame-ancestors 'none'`. Las transiciones entre páginas usan la API nativa de transiciones entre documentos, no un enrutador de cliente. Los terceros solo se admiten en una allowlist mínima y documentada.

## Consequences
- Más fácil: obtener la máxima puntuación en buenas prácticas y defender la seguridad como argumento comercial.
- Más difícil: la CSP no aplica en el servidor de desarrollo y hay que probar con el build; los embeds de terceros requieren entrada explícita.
- Prohibido: `unsafe-inline`, `unsafe-eval` y enrutadores de cliente incompatibles con la CSP.

## Fitness function
- Un test E2E sobre el build comprueba que las cabeceras están presentes y que no hay violaciones de CSP en consola.
- Escaneo de cabeceras en el preview.
- Check: `pnpm test:e2e --grep "ADR 0006"`

## Review trigger
Un tercero imprescindible no funciona con la CSP, o la plataforma ofrece nonces sin coste de render.
