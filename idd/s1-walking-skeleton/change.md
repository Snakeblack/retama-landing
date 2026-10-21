# s1-walking-skeleton

## Intent and acceptance

S1 walking skeleton: scaffold Astro 7 + Cloudflare Workers, i18n es/en, SEO base, CSP y cabeceras, view transitions nativas, DESIGN.md mínimo, skills vendorizadas, CI con puertas, previews y release-please

Acceptance: La URL de producción sirve / (es) y /en/ con canónica, hreflang recíproco y sitemap; Lighthouse CI da 100 en las 4 categorías; las cabeceras y la CSP están verificadas por E2E; un PR de prueba genera su preview; los ADRs con comprobación automatizable tienen líneas - Check:

## Plan

Cinco unidades de trabajo entregadas como PRs encadenados (decisión del usuario, 2026-10-21):

1. [x] Scaffold Astro 7 + adapter Cloudflare, TypeScript estricto, Biome + eslint-plugin-astro, Vitest + Playwright; i18n es/en con paridad de claves; canónica, hreflang + x-default, sitemap; 404 por idioma.
2. [x] CSP de `security.csp` unificada en `_headers` + resto de cabeceras; `@view-transition` nativo; E2E de cabeceras y CSP sin violaciones; cero cookies.
3. [x] DESIGN.md mínimo (tokens provisionales) → `@theme` de Tailwind 4; `design:lint` y comprobación de sincronía.
4. [x] Skills vendorizadas (ADR 0010) con manifiesto de hashes, test del manifiesto y escaneo de riesgo; `CLAUDE.md`/`AGENTS.md`.
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
- `SITE_URL` fija el origen de canónicas y sitemap. El valor por defecto es la URL real de producción, `https://retama-landing.retamozogpt.workers.dev` (subdominio del usuario, 2026-10-21), así que Workers Builds no necesita la variable hasta el dominio propio (M6). Los previews también apuntan sus canónicas a producción.
- Workers Builds: Worker `retama-landing`, rama de producción `main`, build `pnpm build` y deploy `npx wrangler deploy`, que lee `dist/client/wrangler.json` a través de `.wrangler/deploy/config.json`. El primer deploy de `main` falló con "Could not detect a directory containing static files" porque `main` aún solo tiene `docs/` e `idd/` (la pila #6–#10 sin fusionar); se arregla al fusionar.
- CSP como cabecera: `scripts/postbuild.mjs` une las políticas `<meta>` de todas las páginas (sin `unsafe-inline`/`unsafe-eval`, el build falla si alguna página no tiene CSP) y añade `frame-ancestors 'none'`. Es una sola política para todo el sitio porque Cloudflare concatena con comas los valores repetidos, y eso serían varias políticas; la meta de cada página sigue limitándola a sus propios hashes.
- `public/_headers` tiene un único bloque `/*` con el marcador `__CSP__`: verificado con E2E que un segundo bloque `/*` sustituye al primero en workerd y borra las demás cabeceras.
- `design:lint` (`scripts/design-check.mjs`) falla también con los *warnings* del CLI, porque el contraste por debajo de WCAG AA solo es un warning y el CLI sale con 0 (verificado con un color de 1,55:1). Además compara el tema exportado con `src/styles/theme.css`; `design:theme` lo regenera. `theme.css` es generado y queda fuera de Biome.
- El CLI exporta `fontFamily` entre comillas (`"system-ui"` no es la palabra clave genérica), así que la pila real va detrás: `var(--font-body-md), system-ui, sans-serif`. M1 traerá tipografías autoalojadas.
- Los pesos se aplican con `font-(weight:--font-weight-*)`: Tailwind 4 no genera utilidades `font-*` a partir de `--font-weight-<nombre>` cuando ya existe `--font-<nombre>`.
- Quedan valores provisionales de Tailwind (`text-5xl`, `leading-[1.1]`) para el titular en móvil; la regla de lint que rechaza valores sueltos llega con el sistema de diseño (M1, ADR 0005).
- CSS inline (`build.inlineStylesheets: "always"`): unos 8 KB, sin petición que bloquee el render; su hash entra en la CSP.
- Skills: 20 carpetas de 7 repos fijados a los commits del baseline, descargadas como tarball de GitHub en un directorio aparte del scratchpad y sin ejecutar nada. `manifest.json` guarda origen, commit, licencia, tema, veredicto, archivos añadidos o excluidos y el sha256 de cada archivo. `pnpm skills:scan` y `tests/unit/skills-manifest.test.ts` comprueban los hashes, que no sobre ni falte ningún archivo, una sola fuente por tema y los hallazgos de riesgo sin revisar.
- Hallazgo que la auditoría de la foundation no vio: el paso 11 de `turnstile-spin` ejecuta `persist-skill.sh`, que clona el HEAD sin fijar de cloudflare/skills, es decir, descarga instrucciones en el momento de uso (lo prohíbe el ADR 0010). Se excluyen el script y su test, se añade la regla de escaneo `remote-clone` y `AGENTS.md` deja `turnstile-spin` solo como consulta.
- web-interface-guidelines: `command.md` se copia sin tocar (la descarga remota está en `install.sh`, que no se vendoriza) y un `SKILL.md` local adapta a Astro las reglas de React/Next, así el diff con upstream sigue limpio.
- LICENSE de upstream copiado en cada carpeta (MIT y Apache-2.0 exigen conservar el aviso).
- `CLAUDE.md` importa `AGENTS.md` (`@AGENTS.md`), que es la fuente única. `.claude/settings.json` fija `TASTE_SKILL_HISTORY` dentro del repo.
- Las herramientas de escritura convierten las secuencias `\u` en caracteres reales: la regla `invisible-char` y su test se escriben con escapes, y se comprobó que el código del repo no tiene caracteres invisibles.
- Lighthouse CI en local (preset móvil, 3 pasadas por URL): 100 en performance, accessibility, best-practices y seo en `/` y `/en/`, con LCP de unos 755 ms y CLS 0. El CI aplica `minScore: 1` en las cuatro categorías contra `wrangler dev`.
- Las actions se fijan por SHA (checkout v7.0.1, setup-node v7.1.0, pnpm/action-setup v6.1.0, upload-artifact v7.0.2, release-please-action v5.0.0).
- Auditoría de dependencias: `pnpm audit --audit-level high` es puerta. Todos los hallazgos vienen de `@lhci/cli`: se fuerzan `tmp >=0.2.6` y `basic-ftp >=6.2.1`, y se ignoran los dos GHSA de `extract-zip` (sin parche; solo descomprime navegadores descargados y LHCI usa el Chrome instalado), documentado en `pnpm-workspace.yaml`.
- Las líneas `- Check:` de los ADRs sustituyen las frases que las anunciaban, sin tocar la decisión. Quedan como revisión manual el presupuesto de JS (0001, primera isla en M2), el test de logs (0003, M3), la regla de valores sueltos (0005, M1), los E2E del 3D (0004, M2) y el escaneo de cabeceras del preview (0006).
- `scripts/fitness.mjs` respalda los checks de arquitectura: `on-demand-routes` (0002, lista permitida `src/pages/api/contact.ts`), `no-persistent-bindings` (0003, sobre el `wrangler.json` generado) y `branch-protection` (0009, vía `gh`). Se comprobó que los dos primeros detectan una violación inyectada.
- Señal `persistent-data` del diff: falso positivo (`writeFile` en herramientas de desarrollo: skills vendorizadas, post-build, design-check). ospec no permite retirarla, así que su obligación se cubre con una ejecución observada de `node scripts/fitness.mjs no-persistent-bindings`, que demuestra que no hay almacén que migrar.
- Trust review 1 (WARNING, no bloquea): `turnstile-spin` seguía documentando el prompt alojado, una descarga con curl que sobrescribiría `SKILL.md`, la descarga de scripts bajo demanda y el token en `~/.cf-turnstile-token`, y el escaneo no veía los symlinks. Corregido: reglas `remote-download`, `hosted-prompt` y `on-demand-fetch`; `home-dotfile` sustituye a `global-config-write` y cubre cualquier dotfile del home; los symlinks hacen fallar el escaneo, con test. Cada hallazgo restante está revisado con su motivo en el manifiesto, y `AGENTS.md` prohíbe esos pasos.
- Trust review 2 (WARNING, no bloquea): un symlink directamente en `.claude/skills/` no salía en la enumeración (`Dirent.isDirectory()` no sigue enlaces). Corregido: `listSkillEntries` rechaza los symlinks y los archivos sueltos de primer nivel salvo `manifest.json`, con test. La revisión confirmó resuelto el hallazgo 1.
- Uso comercial del plan gratuito de Cloudflare confirmado por el usuario (2026-10-21). Cuenta, subdominio `workers.dev`, conexión de Workers Builds y PAT `RELEASE_PLEASE_TOKEN` llegan más adelante.
- Email de autor `retamozogpt@gmail.com` (usuario, 2026-10-21) en todo el historial, también en `main`. GitHub cerró los PRs #1–#5 al reescribirlo y no permite reabrirlos; se sustituyen por #6–#10, y el usuario acepta que el email antiguo quede en esos PRs cerrados. La tag local `ospec-s1-base` conserva el commit base antiguo que usa ospec.
- Repo público y `main` protegido vía API: checks `quality`, `e2e` y `lighthouse` (strict), PR obligatorio sin aprobaciones (equipo de una persona), enforce_admins, historial lineal y sin force-push ni borrado.
- Merge de la pila: el workflow solo existe en #10, así que los PRs se fusionan de arriba abajo en su rama base (#10 → … → #7) y #6 entra en `main` con el CI completo y rebase-merge (el historial es lineal y release-please lee los commits).
- Biome es dueño de JS/TS/JSON/CSS; ESLint solo de `.astro` (soporte experimental en Biome).

## Evidence

<!-- ospec:evidence:start -->
<!-- ospec:evidence:end -->
