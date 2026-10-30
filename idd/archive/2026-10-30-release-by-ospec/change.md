# release-by-ospec

## Intent and acceptance

Release with ospec and the playbook's retama:delivery instead of release-please and the landing's own merge script (M3, landing change b)

Acceptance: release-please (workflow, config, manifest and its test), scripts/merge-pr.mjs, scripts/lib/merge-pr.mjs, its test and pnpm pr:merge are gone; idd/config.yaml declares delivery (serial, CHANGELOG.md, per-change); AGENTS.md sends branches, PRs, merge and releases to retama:delivery, except that the release commit is the PR's last commit and, after the merge, the tag goes on the verified release commit of main with a GitHub Release from its CHANGELOG section; ADR 0014 amends ADR 0009 with the per-change versioning and the technical baseline describes it; the branch-protection fitness check also fails when main stops requiring a pull request or stops applying to admins; CHANGELOG.md has the Keep a Changelog header and an [Unreleased] that ospec close fills, above the old entries, which stay unchanged; lint, typecheck, test, e2e and design pass

## Plan

<!-- ospec:plan:start -->
- Files: `.github/workflows/release-please.yml`, `.release-please-manifest.json`, `AGENTS.md`, `CHANGELOG.md`, `docs/architecture/decisions/0009-delivery-gates.md`, `docs/architecture/decisions/0014-per-change-versioning.md`, `docs/architecture/technical-baseline.md`, `idd/config.yaml`, `package.json`, `release-please-config.json`, `scripts/fitness.mjs`, `scripts/lib/branch-protection.mjs`, `scripts/lib/merge-pr.mjs`, `scripts/merge-pr.mjs`, `tests/unit/branch-protection.test.ts`, `tests/unit/merge-pr.test.ts`, `tests/unit/release-config.test.ts`
<!-- ospec:plan:end -->

## Decisions

<!-- ospec:decisions:start -->
- ADR 0014 amends ADR 0009 with the per-change versioning only; 0009 keeps its text and gains an 'Amended by' line, as 0010 only changed its status when 0013 superseded it (user, 2026-10-30)
- main is protected (PR, required checks quality/e2e/lighthouse, linear history, enforce_admins), so the release commit chore(release): x.y.z is the PR's last commit instead of a direct push to main; after the rebase merge the annotated tag goes on that commit's SHA in main, checked first (user, 2026-10-30)
- The landing keeps publishing a GitHub Release for every tag, with the notes of its CHANGELOG section: the repository is public and its Latest badge would freeze at v0.13.0 (user, 2026-10-30)
- The RELEASE_PLEASE_TOKEN secret is deleted after the merge and the user revokes the PAT (user, 2026-10-30)
- The CHANGELOG keeps its release-please entries as they are, under the Keep a Changelog header and an [Unreleased] section; v0.13.0 already lists playbook-skills and copy-humanizer, so no entry is written by hand
- The branch-protection fitness check also fails when main stops requiring a pull request or stops applying to admins, since the release commit inside the PR relies on nobody pushing to main; its verdict lives in scripts/lib/branch-protection.mjs with a unit test (trust review, 2026-10-30)
- docs/roadmap.md keeps 'release-please' under S1: it records what S1 delivered
<!-- ospec:decisions:end -->

## Evidence

<!-- ospec:evidence:start -->
- ev-1: frozen-review for trust-review (2026-10-30T08:07:55.031Z, subagent-stop)
- ev-2: check-run for checks-pass (2026-10-30T08:09:49.328Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-30T08:09:49.328Z)
- ev-4: frozen-review for trust-review (2026-10-30T08:11:16.130Z, subagent-stop)
- ev-5: check-run for checks-pass (2026-10-30T08:12:05.899Z)
- ev-6: living-doc-current for living-doc (2026-10-30T08:12:05.979Z)
<!-- ospec:evidence:end -->
