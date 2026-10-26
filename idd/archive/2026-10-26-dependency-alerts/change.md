# dependency-alerts

## Intent and acceptance

Las alertas de Dependabot de repo-secret-protection no ven ninguna dependencia npm, porque pnpm 12 escribe el lockfile en dos documentos YAML y GitHub solo lee el primero (dependabot-core#15904), así que un aviso nuevo entre pushes no avisa a nadie. Un pnpm audit programado en CI cubre ese hueco con el mismo umbral e ignorados que la puerta de los PR, y la línea 1 de M7 se corrige

Acceptance: Un workflow programado a diario y lanzable a mano ejecuta pnpm audit --audit-level high sin instalar dependencias y falla ante un aviso alto nuevo; un test fija que el lockfile tenga un solo documento y que use el mismo comando de audit que el CI; docs/roadmap.md M7 describe la cobertura real; tras fusionar, el SBOM del dependency graph lista las dependencias npm del proyecto

## Plan

1. Lockfile: `pmOnFail: ignore` in `pnpm-workspace.yaml` and `pnpm-lock.yaml` without its first YAML document (the
   env document with pnpm 12.14.0 and its `@pnpm/exe.*` binaries). The project document stays byte-identical and loses
   its leading `---`. Guarded by `tests/unit/dependency-alerts.test.ts`.
2. Scheduled audit: `.github/workflows/audit.yml`, daily at 05:17 UTC and on `workflow_dispatch`, runs the gate's own
   `pnpm audit --audit-level high` with read-only permissions, `persist-credentials: false` and no install. The same
   test pins it to the command of `ci.yml`.
3. Pin: `scripts/lib/pnpm-pin.mjs` (`unpinnedPnpm`) and a throw in `astro.config.mjs`, like the legal owner and the
   Turnstile key guards: a Workers Builds build (`WORKERS_CI=1`) stops unless the pnpm in `npm_config_user_agent` is
   the `packageManager` of `package.json`. Covered by `tests/unit/pnpm-pin.test.ts`.
4. Docs: M7 of `docs/roadmap.md` (item 1 corrected, item 2 added, the rest renumbered) and two rows of
   `docs/architecture/technical-baseline.md` (dependency alerts, package manager).
5. After the merge: check that the dependency graph SBOM lists the npm dependencies, then dismiss the three accepted
   high alerts with the reasons of `pnpm-workspace.yaml`.

## Decisions

- Both measures (user, 2026-10-26): the scheduled audit and Dependabot restored through `pmOnFail: ignore`. They cover
  each other: the cron stops after 60 days without activity in a public repository, and Dependabot fails silently
  whenever GitHub misreads the lockfile.
- Notice of a failed scheduled audit (user): GitHub's email for the failed run; no issue, no `issues: write`.
- Alerts to dismiss once Dependabot sees the tree (user): the three highs that `auditConfig.ignoreGhsas` already accepts
  (extract-zip twice, zod), with the same reasons; the two moderate dev advisories (uuid, fflate) stay open.
- Only `ignore` works: `warn` writes the env document again, and so does the default `download`. A lockfile that
  still starts with `---` is read by pnpm as an env document and the whole tree is resolved again (seen in a copy:
  `@types/node` 24 to 26, vite 8.3.4 to 8.3.5). Without it, pnpm 12.14.0 and 12.15.0 accept the lockfile, frozen or not,
  without changing a byte; `pnpm audit` needs no `node_modules`.
- Pin guard (agent, from the trust review): with `pmOnFail: ignore`, nothing in the repository proved that Workers
  Builds runs the pinned pnpm, and the lockfile no longer records pnpm's own hash. The guard turns that claim into a
  build failure, which the PR's Preview build exercises before production. A build not launched by pnpm counts as
  unpinned. Checked by hand: with `WORKERS_CI=1`, pnpm 12.15.0 stops the build with the message, pnpm 12.14.0 builds.
- The daily time avoids minute 0, when GitHub's scheduled runs queue the most.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: repro-run-pair for repro-test (2026-10-26T11:05:53.011Z)
- ev-2: check-run for checks-pass (2026-10-26T11:07:03.538Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-26T11:07:03.538Z)
- ev-4: frozen-review for trust-review (2026-10-26T11:10:01.440Z, subagent-stop)
- ev-5: check-run for checks-pass (2026-10-26T11:12:22.108Z)
- ev-6: contract-spec-and-test for contract-spec-and-test (2026-10-26T11:12:22.108Z)
- ev-7: adr-impact-declaration for adr-impact-declaration (2026-10-26T11:12:22.108Z)
- ev-8: frozen-review for trust-review (2026-10-26T11:15:00.099Z, subagent-stop)
- ev-9: living-doc-current for living-doc (2026-10-26T11:15:06.143Z)
<!-- ospec:evidence:end -->
