# merge-pr-script

## Intent and acceptance

pnpm pr:merge <n>: fusiona un PR solo si pasa las comprobaciones del procedimiento (estado, CI sobre su commit, al día con main), verifica que quedó fusionado y solo entonces limpia las ramas

Acceptance: pnpm pr:merge <n> se niega y explica por qué con un PR BEHIND, en conflicto, en borrador, cerrado, con checks pendientes o en rojo no nombrados en --allow-failing; con todo en verde fusiona con rebase atado a su commit, confirma MERGED y solo entonces borra la rama remota y la local cuyo contenido ya está en main; --dry-run solo comprueba

## Plan

1. TDD: `mergeVerdict` and `inMain` in scripts/lib/merge-pr.mjs, pure and offline.
2. scripts/merge-pr.mjs: check, merge with rebase tied to the checked commit, verify MERGED, then clean up.
3. `pnpm pr:merge`; AGENTS.md documents the procedure. Tried with `--dry-run` on a merged PR and on the open
   release-please PR, with and without `--allow-failing`.

## Decisions

- Owner, 2026-10-23, after a merge refused for BEHIND was chained with a branch deletion: "en este proyecto debemos de
  controlar bien los prs y las fusiones, no debe volver a pasar esto". A script makes the procedure mechanical.
- Owner: a BEHIND pull request stops the script, which prints `gh pr update-branch <n> --rebase`; it never updates
  the branch itself.
- Owner: any failing or cancelled check blocks unless named with `--allow-failing`, and the accepted ones are printed.
- The merge passes `--match-head-commit` with the checked SHA, so a push between the check and the merge makes GitHub
  refuse it.
- No `--delete-branch` on `gh pr merge`: the remote branch is deleted only after GitHub reports MERGED, and the local
  one only when `git cherry` finds all its commits in the base (rebase merges change the hashes, so
  `git branch --merged` cannot tell).
- Node (.mjs) like the other scripts, calling `gh` and `git` with `execFileSync` and no shell.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-23T18:48:32.882Z)
- ev-2: living-doc-current for living-doc (2026-10-23T18:48:42.472Z)
<!-- ospec:evidence:end -->
