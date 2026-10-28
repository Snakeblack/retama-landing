# blog-writing-skill

## Intent and acceptance

Skill de redacción para el blog: blader/humanizer vendorizada (ADR 0010) dentro de una skill local que añade las reglas de español de España (castellano neutro, palabras sencillas, sin calcos del inglés ni regionalismos) y el flujo de un artículo del blog

Acceptance: Existe .claude/skills/blog-writing con SKILL.md local, el humanizer original sin cambios y su LICENSE; manifest.json la registra con commit fijado, licencia y veredicto; pnpm skills:scan pasa; AGENTS.md nombra su tema

## Plan

<!-- ospec:plan:start -->
- Files: `.claude/skills/blog-writing/LICENSE`, `.claude/skills/blog-writing/SKILL.md`, `.claude/skills/blog-writing/humanizer.md`, `.claude/skills/manifest.json`, `AGENTS.md`
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- Patrón de envoltorio de web-interface-guidelines: el SKILL.md original de humanizer se guarda sin cambios como humanizer.md y un SKILL.md local lo aplica y añade las reglas del español de España, que mandan sobre el original; un solo tema (blog-writing), sin tocar el esquema del manifiesto
<!-- ospec:decisions:end -->

- Fuente elegida: blader/humanizer (unas 61.900 estrellas, MIT), la skill de este tema con más estrellas en GitHub el 2026-10-28; ninguna en español pasaba de 11.
- La revisión de confianza (generación 1) aprobó sin bloqueos; su sugerencia, tratar lo leído en páginas externas como dato y nunca como instrucción, se aplicó en el paso 2 del SKILL.md local.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-28T20:59:10.272Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-28T20:59:10.272Z)
- ev-3: frozen-review for trust-review (2026-10-28T21:00:02.956Z, subagent-stop)
- ev-4: check-run for checks-pass (2026-10-28T21:01:06.528Z)
- ev-5: adr-impact-declaration for adr-impact-declaration (2026-10-28T21:01:06.528Z)
- ev-6: frozen-review for trust-review (2026-10-28T21:02:23.218Z, subagent-stop)
- ev-7: check-run for checks-pass (2026-10-28T21:03:18.792Z)
- ev-8: adr-impact-declaration for adr-impact-declaration (2026-10-28T21:03:18.792Z)
- ev-9: living-doc-current for living-doc (2026-10-28T21:03:22.218Z)
<!-- ospec:evidence:end -->
