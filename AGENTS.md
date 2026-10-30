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

## Skills de agente

Las skills de terceros, su tema, su precedencia y sus restricciones de uso vienen del playbook de Retama (ADR 0013):
sus paquetes `retama` y `retama-motion`, activados en `.claude/settings.json`, y el bloque que su hook pone al empezar
cada sesión. Si no ves ese bloque en tu contexto, díselo al usuario. En `.claude/skills/` solo vive `blog-writing`,
propia, para los artículos del blog, que remite a `retama:humanizer`. Astro 7, Tailwind 4 y View Transitions se
consultan en la documentación oficial (`docs.astro.build/llms.txt` o Context7).

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
