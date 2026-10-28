# Retama landing: guía para agentes

Landing de Retama (es en `/`, en en `/en/`): Astro 7 estático sobre Cloudflare Workers. Lee primero
`docs/product/brief.md`, `docs/architecture/technical-baseline.md` y los ADRs de
`docs/architecture/decisions/`; mandan sobre cualquier skill o costumbre.

## Antes de tocar la interfaz

- Lee `DESIGN.md` entero (ADR 0005). Colores, tipografía, espaciado y radios salen de sus tokens a través de
  `src/styles/theme.css`, que se genera con `pnpm design:theme` y nunca se edita a mano.
- Ningún texto existe solo tras ejecutar JS (ADR 0001); la interactividad vive en islas.
- Sin `style=""` inline, manejadores inline ni `<ClientRouter />`: la CSP no tiene `unsafe-inline` (ADR 0006).
  Las transiciones entre páginas son `@view-transition` nativas.
- Cada texto visible va en `src/i18n/es.ts` y `src/i18n/en.ts` con las mismas claves (ADR 0008).

## Precedencia de skills

Si dos fuentes se contradicen, gana la primera:

1. `DESIGN.md`
2. `taste-skill` (dirección de arte)
3. La skill global `ospec-workflow:design-system`, solo para auditar

Cada tema tiene una sola skill responsable (ADR 0010): dirección de arte → `taste-skill`; revisión de
interfaz → `web-interface-guidelines`; animación → `gsap-*`; 3D → `threejs-*`; calidad web →
`core-web-vitals`, `performance`, `seo`, `best-practices`, `web-quality-audit`; hreflang → `seo-hreflang`;
plataforma → `wrangler`, `workers-best-practices`, `turnstile-spin`; redacción del blog → `blog-writing`, que envuelve
blader/humanizer con las reglas del español de España. La accesibilidad la cubre la skill global
`ospec-workflow:accessibility`. Astro 7, Tailwind 4 y View Transitions se consultan en la documentación oficial
(`docs.astro.build/llms.txt` o Context7).

## Skills vendorizadas (`.claude/skills/`)

- Son copias fijadas a un commit y auditadas; `manifest.json` registra origen, commit, licencia, veredicto y el
  hash de cada archivo. `pnpm skills:scan` lo comprueba en CI junto con los patrones de riesgo.
- Nunca descargues, clones ni "actualices" una skill en el momento de usarla, ni la copies a `~/.claude`.
- `turnstile-spin` es solo de consulta: no ejecutes sus scripts ni su asistente (usan un token de la API de
  Cloudflare), no pidas ni guardes tokens (tampoco en `~/.cf-turnstile-token`), y no hagas su paso 11: ni
  persistirla ni instalar o sincronizar su prompt alojado (`developers.cloudflare.com/turnstile/spin/prompt.md`),
  que sustituiría el `SKILL.md` auditado. El widget de Turnstile se crea a mano en el dashboard.
- `taste-skill` guarda su historial en `.taste-skill/` (`TASTE_SKILL_HISTORY`, ignorado por git).
- Para actualizar una skill: descárgala en un directorio aparte fijando el commit, revisa el diff, actualiza
  `manifest.json` (commit, veredicto y `reviewed`), ejecuta `node scripts/skills-scan.mjs --rehash` y
  `node scripts/skills-scan.mjs`, y entrégalo en un PR propio.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo (sin CSP: valida con el build) |
| `pnpm build` | Build estático, más CSP y 404 por idioma (`scripts/postbuild.mjs`) |
| `pnpm preview` | Build servido por workerd con `_headers` |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm test:e2e` | Puertas de calidad |
| `pnpm design:lint` / `pnpm design:theme` | Lint de DESIGN.md con contraste y sincronía del tema / regenerarlo |
| `pnpm pr:merge <n>` | Fusiona un PR por el procedimiento (abajo); `--dry-run` solo comprueba |

## Fusionar PRs

Cada PR se fusiona con `pnpm pr:merge <n>` (`scripts/merge-pr.mjs`), uno a uno, nunca con `gh pr merge` a mano. El
script se niega si el PR no está abierto, tiene conflictos, está por detrás de su base (da la orden
`gh pr update-branch <n> --rebase`) o tiene algún check pendiente o en rojo sobre su último commit. Un check en rojo que
no es obligatorio, como el Workers Builds de la rama de release-please, solo pasa si se nombra con
`--allow-failing "<check>"`. Fusiona con rebase atado a ese commit, comprueba que GitHub lo da por fusionado y solo
entonces borra la rama remota y la local, si `git cherry` encuentra todos sus commits en la base. Con varios PRs
pendientes, primero los de funcionalidad y al final el de release-please; un PR encadenado se fusiona en su padre y
después el padre en `main`.

Los cambios de código siguen IDD (`idd/config.yaml`). Commits en Conventional Commits, sin atribución a
herramientas.
