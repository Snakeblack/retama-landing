# s1-walking-skeleton

## Intent and acceptance

S1 walking skeleton: scaffold Astro 7 + Cloudflare Workers, i18n es/en, SEO base, CSP y cabeceras, view transitions nativas, DESIGN.md mínimo, skills vendorizadas, CI con puertas, previews y release-please

Acceptance: La URL de producción sirve / (es) y /en/ con canónica, hreflang recíproco y sitemap; Lighthouse CI da 100 en las 4 categorías; las cabeceras y la CSP están verificadas por E2E; un PR de prueba genera su preview; los ADRs con comprobación automatizable tienen líneas - Check:

## Plan

Cinco unidades de trabajo entregadas como PRs encadenados (decisión del usuario, 2026-10-21):

1. [x] Scaffold Astro 7 + adapter Cloudflare, TypeScript estricto, Biome + eslint-plugin-astro, Vitest + Playwright; i18n es/en con paridad de claves; canónica, hreflang + x-default, sitemap; 404 por idioma.
2. [ ] CSP de `security.csp` llevada a `_headers` por ruta + resto de cabeceras; `@view-transition` nativo; E2E de cabeceras y CSP sin violaciones; cero cookies.
3. [ ] DESIGN.md mínimo (tokens provisionales) → `@theme` de Tailwind 4; `design:lint` y comprobación de sincronía.
4. [ ] Skills vendorizadas (ADR 0010) con manifiesto de hashes, test del manifiesto y escaneo de riesgo; `CLAUDE.md`/`AGENTS.md`.
5. [ ] CI de GitHub Actions (lint, typecheck, test, E2E, Lighthouse CI, auditoría de dependencias), Workers Builds, repo público + protección de `main`, release-please con PAT; líneas `- Check:` en los ADRs.

## Decisions

- Prior decision (memory): TSR Retama landing stack -> docs/architecture/technical-baseline.md: current.
- Prior decision (memory): ADR 0001-0010 Retama landing -> docs/architecture/decisions/: current.
- TypeScript 6.0.3 y no 7.0.2: `@astrojs/check` 0.9.11 declara el peer `typescript ^5 || ^6` (usuario, 2026-10-21).
- Sin Corepack: Node 25+ ya no lo incluye. `packageManager: pnpm@12.14.0`, `.node-version` 24 y `pnpm/action-setup` en CI (usuario, 2026-10-21).
- wrangler 4.150.0 y `@cloudflare/vite-plugin` 1.63.2 (override): 4.151.3 y vite-plugin 1.64 no cumplen el `minimumReleaseAge` de pnpm 12. No se relaja la política.
- `session: false` e `imageService: "compile"`: por defecto el adapter provisiona KV (`SESSION`) y el binding de Cloudflare Images, y el ADR 0003 prohíbe los bindings persistentes.
- La salida es `static`: el Worker solo sirve activos y no hay rutas on-demand hasta M3 (ADR 0002).
- `wrangler.jsonc` solo lleva `name`, `compatibility_date` y el manejo de HTML/404: el adapter genera `dist/client/wrangler.json` con el resto.
- `trailingSlash: "always"` + `html_handling: "force-trailing-slash"`; `/en` → 307 a `/en/`.
- 404 por idioma: Astro emite `en/404/index.html` y `scripts/postbuild.mjs` lo mueve a `en/404.html` para `not_found_handling: "404-page"`. Las 404 llevan `noindex` y quedan fuera del sitemap.
- `security.csp` de Astro solo emite `<meta http-equiv>`: el ADR 0006 exige cabecera (y `frame-ancestors` no funciona en meta), así que el post-build copiará la política de cada página a `_headers` (unidad 2).
- E2E y Lighthouse contra `wrangler dev -c dist/client/wrangler.json` (workerd aplica `_headers`); `astro preview` en Astro 7 pasa a segundo plano fuera de un TTY.
- `SITE_URL` fija el origen de canónicas y sitemap; el valor por defecto `https://retama-landing.workers.dev` se sustituye por la URL real cuando el usuario dé el subdominio.
- Biome es dueño de JS/TS/JSON/CSS; ESLint solo de `.astro` (soporte experimental en Biome).

## Evidence

<!-- ospec:evidence:start -->
<!-- ospec:evidence:end -->
