# playwright-no-apt

## Intent and acceptance

The e2e job installs Chromium with --with-deps, which downloads its system packages with apt from
azure.archive.ubuntu.com; on 2026-10-26 that took 7 min 50 s for 25.9 MB in PR #83 and once ran a job of main into its
15-minute timeout, while the browser itself downloads in about 7 s

Acceptance: The e2e job installs only Playwright's Chromium, without apt packages; the same e2e suite passes in CI and
the install step takes seconds

## Plan

1. Safety net first: `ospec check` on the unchanged tree (lint, typecheck, test, e2e, design, and the ADR 0009 fitness).
2. `.github/workflows/ci.yml`, e2e job: `pnpm exec playwright install chromium` instead of
   `pnpm exec playwright install --with-deps chromium`, with a comment that says why.
3. The PR's own e2e job proves the suite still launches Chromium on the runner without the apt packages.

## Decisions

- Option 1 of three (user, 2026-10-26: «1. si»): drop `--with-deps`. The others were the official Playwright container
  image (no apt and everything pinned, but a 30-60 s pull and a tag to keep in step with `@playwright/test` by hand) and
  the runner's Chrome through `channel: "chrome"` (no download, but its version follows the runner image, not local).
- The runner already has Chrome's libraries because it ships Google Chrome (the lighthouse job uses it), and no e2e test
  compares screenshots, so the fonts `--with-deps` adds do not matter. A missing library fails the launch at once and
  names it, instead of a slow install.
- Measured in PR #83 (run 40358969684): apt fetched 25.9 MB in 7 min 50 s (55.2 kB/s); Chrome for Testing, FFmpeg and
  the headless shell downloaded from cdn.playwright.dev in about 7 s.
- `timeout-minutes: 15` stays: it still bounds a hung run, and nothing in this change needs a different limit.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-26T16:41:06.286Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-26T16:41:06.286Z)
- ev-3: frozen-review for trust-review (2026-10-26T16:42:49.772Z, subagent-stop)
- ev-4: check-run for checks-pass (2026-10-26T16:43:59.627Z)
- ev-5: adr-impact-declaration for adr-impact-declaration (2026-10-26T16:43:59.627Z)
<!-- ospec:evidence:end -->
