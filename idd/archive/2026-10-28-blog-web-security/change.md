# blog-web-security

## Intent and acceptance

Artículo del blog, en español y en inglés, sobre la seguridad web: lo que ha pasado en 2026 con PHP, Java y Node, y cómo Retama mantiene al día las dependencias de lo que construye y mantiene sin cambiar el comportamiento

Acceptance: Existen src/content/blog/es/seguridad-web-actualizar-sin-romper.md y src/content/blog/en/web-security-updating-without-breaking.md con la misma key, título de 40 caracteres como máximo, sin código, cada dato con su fuente oficial enlazada y el proceso de Retama contado sin promesas absolutas; pnpm test y pnpm build pasan

## Plan

<!-- ospec:plan:start -->
- Files: `src/content/blog/en/web-security-updating-without-breaking.md`, `src/content/blog/es/seguridad-web-actualizar-sin-romper.md`, `tests/e2e/blog.spec.ts`
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- El e2e del blog cuenta los artículos de la carpeta de cada idioma (src/content/blog/<idioma>/*.md) en vez de fijar 2, para que un artículo nuevo no obligue a tocar el test; sigue comprobando que el índice y el RSS listan todos
<!-- ospec:decisions:end -->

- Fuentes primarias leídas el 2026-10-28: aviso de la CISA del 21-10-2026 (php2shell, actualizado el 26-10 con su entrada en KEV), página de seguridad de Apache Tomcat 11 (CVE-2026-34486, corregido en 11.0.21), alerta de la CISA del 04-08-2026 (KEV), aviso de Node.js de octubre de 2026, post-mortem de axios (issue 10636) y aviso AD-2026-009 de la CSA de Singapur. Las descargas de axios (100,3 millones la semana anterior al ataque) salen de la API de npm.
- El proceso de Retama que cuenta el artículo es el de este repositorio: lockfile congelado, pnpm audit en cada PR y cada día, minimumReleaseAge de pnpm por defecto (1440 min), scripts de instalación bloqueados salvo allowBuilds y las puertas de calidad de ADR 0009. El usuario confirmó que el mantenimiento lo incluye.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-28T21:10:51.322Z)
- ev-2: living-doc-current for living-doc (2026-10-28T21:11:05.449Z)
<!-- ospec:evidence:end -->
