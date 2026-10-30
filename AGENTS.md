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

## Entrega

Los cambios de código siguen IDD (`idd/config.yaml`). Ramas, commits, PRs, fusión y releases siguen la skill
`retama:delivery` del playbook de Retama (ADR 0014), salvo en un punto: `main` está protegida (PR, checks obligatorios y
`enforce_admins`), así que la release no se sube directa a `main`. Con el OK del usuario a la versión, el último commit
del PR es `chore(release): x.y.z`: pasa `[Unreleased]` de `CHANGELOG.md` a `## [x.y.z] - AAAA-MM-DD` y sube
`package.json`. Tras la fusión, y antes de etiquetar nada:

1. `git fetch origin`, `git switch main` y `git pull --ff-only`: el HEAD local debe ser igual a `origin/main`.
2. El asunto de ese HEAD es `chore(release): x.y.z`, su `package.json` está en x.y.z y su `CHANGELOG.md` tiene la
   sección `## [x.y.z] - AAAA-MM-DD`. Si no, para: otro PR se ha fusionado en medio o la fusión no ha llegado.
3. `gh api repos/Snakeblack/retama-landing/commits/<sha>/check-runs --jq '.check_runs[] | "\(.name) \(.conclusion)"'`
   da `success` en `quality`, `e2e` y `lighthouse`. Si alguno falta, sigue en curso, se ha cancelado o ha fallado,
   para y no etiquetes.
4. `git tag -a vX.Y.Z <sha> -m "vX.Y.Z"` sobre ese SHA explícito y `git push origin vX.Y.Z`.
5. `gh release create vX.Y.Z --verify-tag --title "vX.Y.Z" --notes-file <fichero>`, con las notas de esa sección.

Un PR encadenado se fusiona en su padre y después el padre en `main`, que lleva la release.
