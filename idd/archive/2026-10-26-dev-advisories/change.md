# dev-advisories

## Intent and acceptance

Two moderate Dependabot alerts stay open on development dependencies with a patch: fflate 0.7.3
(GHSA-px8p-9vwx-vf98, fixed in 0.7.5), pinned exactly by satori even in its latest release, and uuid 8.3.2
(GHSA-w5hq-g745-h8pq, fixed in 11.1.1), required by @lhci/cli 0.15.1, its latest release

Acceptance: pnpm overrides resolve fflate 0.7 to ^0.7.5 and uuid 8 to ^11.1.1; pnpm audit --audit-level moderate
reports only the 3 ignored highs; a unit test keeps those versions out of the lockfile; the build still renders the OG
images with satori and Lighthouse CI still collects; Dependabot alerts #1 and #3 close after the merge

## Plan

1. `tests/unit/dependency-alerts.test.ts`: the lockfile resolves no fflate 0.7 below 0.7.5 and no uuid below 11.1.1
   (reproduction first: it fails on the current lockfile with 0.7.3 and 8.3.2).
2. `pnpm-workspace.yaml`: overrides `uuid@8: ^11.1.1` and `fflate@0.7: ^0.7.5`, next to the ones @lhci/cli already
   needs, each with its reason.
3. `pnpm-lock.yaml`: regenerated with `pnpm install`.

## Decisions

- Overrides and not `auditConfig.ignoreGhsas`: both advisories have a patched release, and `pnpm-workspace.yaml` keeps
  `ignoreGhsas` for advisories without one (extract-zip, zod 3). No parent fixes them: satori 0.63.2, its latest,
  still pins fflate 0.7.3, and @lhci/cli 0.15.1 is its latest release.
- The selectors stay on the vulnerable line (`fflate@0.7`, `uuid@8`), like `body-parser@1` and `undici@7`: fflate 0.8
  of @types/three is untouched, and a future dependency that asks for another uuid major is not forced to 11.
- uuid 11 and not a later major: @lhci/cli only calls `require("uuid").v4()` (src/collect/node-runner.js), and uuid
  11 is the line that keeps CommonJS (its own deprecation notice says so). Verified from the @lhci/cli path:
  `require("uuid")` resolves `uuid@11.1.1/dist/cjs/index.js` and `v4()` returns an id.
- Neither advisory was reachable here: satori imports `inflateSync` from fflate and @shuding/opentype.js bundles its
  own copy, while the bug is in `unzipSync` with ZIP64; @lhci/cli never passes a buffer to v3, v5 or v6. The fix
  closes the alerts at no cost.
- The lockfile also moves `legacy-javascript` from 0.0.3 to 0.0.4 (2026-10-23): `@paulirish/trace_engine`, under
  Lighthouse, asks for it with the `latest` tag, and pnpm resolves the tag again when the overrides change. Any
  regeneration of the lockfile would bring it; Lighthouse CI exercises it.
- The test calls `./node_modules/.bin/vitest` for the reproduction pair: `pnpm exec` checks the lockfile first and
  rewrites it from the overrides, so a red run through it never reads the old lockfile.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: repro-run-pair for repro-test (2026-10-26T16:20:56.630Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-26T16:21:54.475Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-26T16:23:25.497Z)
- ev-4: repro-run-pair for repro-test (2026-10-26T16:23:51.883Z)
- ev-5: check-run for checks-pass (2026-10-26T16:24:46.106Z)
- ev-6: adr-impact-declaration for adr-impact-declaration (2026-10-26T16:24:46.106Z)
<!-- ospec:evidence:end -->
