# m1-design-system

## Intent and acceptance

M1: dirección de arte elegida con taste-skill, DESIGN.md completo (paleta oscura, tipografía autoalojada, espaciado, componentes, Motion/3D con presupuesto), wordmark de Retama y regla de lint de estilos del ADR 0005

Acceptance: DESIGN.md recoge la dirección elegida por el usuario y pasa pnpm design:lint; theme.css regenerado; las fuentes se sirven desde el propio sitio; el wordmark aparece en la cabecera de es y en; una regla de lint rechaza valores sueltos de color y tamaño; Lighthouse sigue en 100 x4

## Plan

Un solo PR (`team.delivery_strategy: single-pr`), rama `feat/m1-design-system`, en tres unidades:

1. [x] Regla del ADR 0005 contra valores sueltos: `scripts/lib/design-values.mjs` con su test (`tests/unit/design-values.test.ts`), dentro de `pnpm design:lint`.
2. [x] Dirección de arte con taste-skill y DESIGN.md completo: paleta grafito y naranja, Stack Sans autoalojada con la API de fuentes de Astro, espaciado del tablero, componentes, imágenes y la sección Motion and 3D con su presupuesto; tema regenerado con utilidades `type-*`.
3. [x] Wordmark SVG en la cabecera de es y en, barra superior, favicon nuevo, portada y 404 provisionales con tokens; se retira `home.eyebrow`; E2E de wordmark y fuentes del propio origen.

## Decisions

- Prior decision (memory): Release v0.1.0 publicada; siguiente sesión M1 -> docs/roadmap.md: current.
- Decisiones del usuario (2026-10-21): dirección `dense-tiles` («The well-kept board»); logotipo solo wordmark y fuera el eyebrow; M1 solo toca `/`, `/en/` y las 404, sin página de muestra; la regla de valores sueltos es un script propio sin dependencias.
- Reparto de taste-skill: sector `agency`, tono `technical`, secciones intro, features, list, how-it-works, faq, contact, footer; seed 571009059. Opciones repartidas: dense-tiles, type-only-statement y contact-sheet. Historial en `.taste-skill/` (ignorado).
- Un único reparto adicional, el del hero: «Sheet with a text cell» llenaba la primera pantalla de fotografías que Retama no tiene y no ponía nada a tamaño display, lo que choca con el hero 3D progresivo (ADR 0004, alcance funcional). Se queda «Name band and rails», cuya ficha central grande recibe la escena 3D. La paleta y la tipografía repartidas se adoptan sin cambios.
- Stack Sans (OFL) desde `@fontsource-variable/stack-sans-headline` y `-text` 5.3.0 fijados como devDependencies, con `fontProviders.local()` de Astro: los archivos se sirven desde `/_astro/fonts/` y no hay peticiones a terceros (la CSP sigue con `font-src 'self'`). Solo el subconjunto latin, que cubre es y en. Se descartó `fontProviders.fontsource()` porque descarga en cada build y no fija la versión.
- Astro registra cada familia con un nombre con hash y la expone, junto a su fallback con métricas ajustadas, como `--font-<slug>`. `design-check.mjs` reescribe cada `--font-<nivel>: "<Familia>"` exportado a `var(--font-<slug-de-la-familia>, "<Familia>", sans-serif)`, así DESIGN.md sigue nombrando la familia real. Los dos `<style>` del componente `<Font>` entran en la CSP como hashes.
- `lineHeight` va entre comillas en DESIGN.md: como número YAML el CLI de design.md lo ignora sin avisar (así se perdía en S1); como cadena lo exporta a `--leading-*`.
- `design-check.mjs` genera una utilidad `type-<nivel>` por cada nivel tipográfico (familia, tamaño, interlineado, tracking y peso), para que un componente fije un nivel con una sola clase y variantes como `md:`.
- El CLI de design.md no admite tokens de movimiento (una clave `motion:` da el aviso `token-like-ignored`, que `design:lint` trata como fallo). Los tokens de movimiento viven en la tabla de la sección Motion and 3D hasta M2, que los define una sola vez en código.
- Regla de valores sueltos (ADR 0005), dentro de `pnpm design:lint`, que ya es un check de IDD y del ADR. En las clases de `.astro`: escala, paleta, interlineado, tracking, radios, pesos y espaciado por defecto de Tailwind, tamaños de contenedor en `w-`/`max-w-` y valores arbitrarios literales; los arbitrarios que solo usan `var(--…)` y la forma `(--…)` se aceptan. En CSS (`.css` y `<style>` de `.astro`, menos `theme.css`): colores hex, funciones de color, colores con nombre en propiedades de color, longitudes `px`/`rem`/`em` distintas de 0 y números sueltos en propiedades tipográficas; se ignoran comentarios y preludios de at-rules, y `@apply` pasa por la regla de clases. No revisa atributos SVG ni el frontmatter.
- `theme-color` sale de `--color-surface` leyendo `theme.css` en el layout, en lugar de un hex suelto.
- Wordmark: «Retama» en Stack Sans Headline 500 con tracking -0.02em, convertido a contornos con fontkit (una herramienta temporal en el scratchpad, que no entra en el repo) desde la instancia estática 500 de `@fontsource/stack-sans-headline`; fontkit falla al instanciar la variable desde woff2. El SVG mide en `em` (3.391 × 0.716) y hereda tamaño de `type-wordmark` y color de `currentColor`; el enlace lleva el texto «Retama» en `sr-only`. El favicon usa la «R» del mismo contorno sobre el grafito, con la barra naranja.
- Portada y 404 siguen siendo provisionales (el tablero llega en M2): una ficha con titular, frase y, en la 404, la acción principal. A propósito no pasan la revisión de taste-skill (pantallas casi vacías); el inspector se ejecuta en M2 sobre la portada real.
- El enlace de idioma conserva la clase `lang-switch`: no da estilo, pero es el gancho del E2E de CSP del ADR 0006. Quitarla al rehacer la cabecera rompió ese check, y se restauró.
- Señal `persistent-data`: el mismo falso positivo que en S1 (`writeFile` en `scripts/design-check.mjs`, que escribe el tema). Su obligación se cubre con una ejecución observada de `node scripts/fitness.mjs no-persistent-bindings`.
- `lint.mjs` de taste-skill sobre `src/`: 0 FAIL, 0 WARN.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: migration-test for migration-compat-and-test (2026-10-21T10:56:32.280Z)
- ev-2: check-run for checks-pass (2026-10-21T10:57:56.751Z)
- ev-3: contract-spec-and-test for contract-spec-and-test (2026-10-21T10:57:56.751Z)
- ev-4: adr-impact-declaration for adr-impact-declaration (2026-10-21T10:57:56.751Z)
- ev-5: living-doc-current for living-doc (2026-10-21T10:58:24.701Z)
<!-- ospec:evidence:end -->
