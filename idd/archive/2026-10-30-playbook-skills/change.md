# playbook-skills

## Intent and acceptance

La landing toma sus skills de agente del playbook de Retama: activa retama y retama-motion en .claude/settings.json, quita sus copias vendorizadas, su manifiesto y su escaneo, sustituye su ADR 0010, quita TASTE_SKILL_HISTORY y deja una blog-writing propia, sin código de terceros, que remite a retama:humanizer

Acceptance: activate.mjs --check sale con 0 en la landing y una sesión ve el bloque de Retama, retama:humanizer y retama-motion:gsap-core; .claude/skills solo tiene blog-writing, sin humanizer.md ni LICENSE; no quedan manifest.json, skills-scan ni su test; el ADR 0010 está sustituido; AGENTS.md, el technical baseline y el glosario remiten al playbook; pasan lint, typecheck, test, e2e y design

## Plan

<!-- ospec:plan:start -->
- Files: `.claude/settings.json`, `.claude/skills/blog-writing/LICENSE`, `.claude/skills/blog-writing/SKILL.md`, `.claude/skills/blog-writing/humanizer.md`, `.claude/skills/manifest.json`, `.github/workflows/ci.yml`, `AGENTS.md`, `docs/architecture/decisions/0010-vendored-agent-skills.md`, `docs/architecture/decisions/0013-agent-skills-from-the-playbook.md`, `docs/architecture/technical-baseline.md`, `docs/product/glossary.md`, `idd/config.yaml`, `package.json`, `scripts/lib/agent-setup.mjs`, `scripts/lib/skills.mjs`, `scripts/skills-scan.mjs`, `tests/unit/agent-setup.test.ts`, `tests/unit/skills-manifest.test.ts`
- Work units: 2
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- ADR 0013 sustituye al 0010: las skills de terceros, su tema, su precedencia y sus restricciones vienen del playbook (retama y retama-motion activados en .claude/settings.json) y en .claude/skills solo viven skills propias; su fitness es tests/unit/agent-setup.test.ts, que falla con el árbol anterior (usuario, 2026-10-30)
- blog-writing se queda con los pasos, el formato, la voz (un solo lector, tuteo, nosotros), lo que Retama puede afirmar y la versión en inglés; sus reglas de la lengua pasan a references/espanol.md de retama:humanizer, y las cifras de la web («8.000 €») quedan escritas en ella, como pide espanol.md para la costumbre del proyecto
- TASTE_SKILL_HISTORY sale de .claude/settings.json, como pide la Nota de Retama de retama:taste-skill: el historial común está en la carpeta personal, donde se copió el de la landing con la v0.3.0 del playbook
- .claude/settings.json entra en impact.security_boundary: en un repositorio público decide qué paquetes cargan las sesiones (usuario, 2026-10-30)
- Biome, ESLint y tsconfig siguen excluyendo .claude/skills, donde queda blog-writing; la entrega (pnpm pr:merge, release-please y el ADR 0009) es el cambio siguiente
- Identidad local de la landing: user.name Michael Snake con su user.email local retamozogpt@gmail.com, fijada con git config --local antes del primer commit (usuario, 2026-10-30)
- Revisión de confianza 1: un WARNING y una sugerencia, aplicados. El fitness pasa a scripts/lib/agent-setup.mjs, con un test por caso: la configuración versionada solo admite enabledPlugins con los dos paquetes del playbook, y .claude/skills solo carpetas con SKILL.md y Markdown no ejecutable, sin enlaces simbólicos, hooks en el frontmatter ni caracteres invisibles. El ADR 0013 recupera la regla de «sin hooks» del 0010, dice que el playbook fija y audita cada skill y que la configuración no puede fijar la versión de un paquete, y añade como disparador una skill o una release del playbook comprometida o sin auditar
- Revisión de confianza 2: dos WARNING, aplicados (usuario, 2026-10-30). La guarda pasa a todo lo versionado: bajo .claude/ solo settings.json y skills/, y ningún .mcp.json (git ls-files), con security_boundary en .claude/** y .mcp.json. En las skills propias rechaza también allowed-tools y hooks entre comillas o en una línea, las órdenes que se ejecutan al cargarse (!`…`) y los caracteres U+061C y U+2066–U+2069. Las secuencias de escape van escritas como tales en el código y en los tests, no como caracteres invisibles
- Revisión de confianza 3: un WARNING, aplicado (usuario, 2026-10-30): la guarda detecta también los bloques de código que se abren con ```! y se ejecutan al cargar la skill, como el de ralph-loop.md del marketplace oficial, con un test que falla con la regla anterior y otro que acepta un bloque normal
<!-- ospec:decisions:end -->

- El cambio entró como refactor y ospec lo subió a feature (kind-mismatch): al borrar las copias desaparece un ejemplo
  de código de core-web-vitals/references/CLS.md, que su heurística toma por línea de contrato. Las dos preguntas de
  open-facts se volvieron a resolver con las mismas respuestas del usuario.
- Revisiones de confianza: la 1 y la 2 dieron WARNING y SUGGESTION, la 3 un WARNING (aplicados, ver Decisions) y la 4,
  autorizada por el usuario tras el límite de tres, aprobó sin hallazgos. Sus citas de los ficheros borrados se leyeron
  en una copia de main fuera del repositorio.
- La versión de este cambio la saca el siguiente, que pasa la entrega de release-please a ospec: el PR de
  release-please que se abra tras este no se fusiona (usuario, 2026-10-30).
- Comprobado a mano el 2026-10-30: activate.mjs --check sale con 0 en la landing, y una sesión de claude -p ve el
  bloque de Retama, retama:humanizer, retama-motion:gsap-core y blog-writing.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-29T20:46:01.113Z)
- ev-2: check-run for checks-pass (2026-10-29T23:14:38.431Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-29T23:14:38.431Z)
- ev-4: frozen-review for trust-review (2026-10-29T23:18:03.876Z, relayed)
- ev-5: check-run for checks-pass (2026-10-29T23:20:08.553Z)
- ev-6: frozen-review for trust-review (2026-10-29T23:23:33.072Z, relayed)
- ev-7: check-run for checks-pass (2026-10-30T00:27:33.422Z)
- ev-8: frozen-review for trust-review (2026-10-30T00:32:10.086Z, relayed)
- ev-9: check-run for checks-pass (2026-10-30T00:34:46.706Z)
- ev-10: frozen-review for trust-review (2026-10-30T00:38:42.930Z, relayed)
- ev-11: living-doc-current for living-doc (2026-10-30T00:38:52.211Z)
<!-- ospec:evidence:end -->
