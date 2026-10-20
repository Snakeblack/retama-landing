# 0008. Rutas por idioma con el idioma por defecto en la raíz y alternativas recíprocas

- Status: accepted
- Date: 2026-10-21

## Context and drivers
SEO multilingüe (`scenario:seo-discovery`): es por defecto más en, con posibilidad de ampliar (ronda 6).

## Options considered
1. Detectar el idioma y servir distintas versiones en la misma URL: las URLs quedan limpias, pero no se pueden indexar por idioma.
2. Un dominio o subdominio por idioma: la señal geográfica es fuerte, pero hay más dominios que operar.
3. Prefijo de ruta por idioma, con el idioma por defecto sin prefijo y alternativas recíprocas más `x-default`.

## Decision
Cada idioma tiene su propia URL: el idioma por defecto en la raíz y el resto bajo su prefijo. Cada página declara su canónica y todas sus alternativas, incluida `x-default`. Las cadenas y el contenido se organizan por idioma, y el build falla si falta alguna clave. No hay redirecciones automáticas por el idioma del navegador; solo se sugiere el cambio.

## Consequences
- Más fácil: indexación por idioma y añadir idiomas nuevos.
- Más difícil: mantener los contenidos equivalentes en todos los idiomas.
- Prohibido: páginas sin su alternativa o con alternativas no recíprocas.

## Fitness function
- Un test comprueba la paridad de claves entre idiomas.
- Un test E2E comprueba hreflang recíproco en todas las páginas del sitemap.

## Review trigger
Se añade un mercado que requiere un dominio propio.
