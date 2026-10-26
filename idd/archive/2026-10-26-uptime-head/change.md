# uptime-head

## Intent and acceptance

The baseline, the roadmap and the test comments say UptimeRobot checks /api/contact/ with GET; its free HTTP monitors
send HEAD, which Astro answers with the GET handler and no body

Acceptance: Docs and contract describe the HEAD check; an e2e test on the built Worker proves HEAD /api/contact/
answers the health status without body and with no-store

## Plan

1. `docs/architecture/technical-baseline.md`: the contact function answers the health check with GET or HEAD (HEAD
   without body); the Uptime row says HTTPS HEAD and why the GET handler serves it; the UptimeRobot decision row says
   the free plan sends HEAD, with the UptimeRobot help page as source.
2. `docs/roadmap.md` (M6, `observability`): `HEAD /api/contact/` instead of `GET`.
3. `tests/e2e/contact.spec.ts`: HEAD /api/contact/ on the built Worker answers 503 (the test build has no secrets),
   an empty body and `Cache-Control: no-store`; the GET test comment no longer says the monitor sends GET.
4. `tests/unit/contact.test.ts`: the `contactHealth` comment says the monitor sends HEAD and Astro answers it with GET.

## Decisions

- Prior decision (memory): Hand-off retama-landing: arreglar problemas pendientes antes de fusionar #81 ->
  docs/architecture/technical-baseline.md (Uptime row): current (the row said GET).
- UptimeRobot's free HTTP monitors send HEAD by default and choosing the method is a Pro feature
  (uptimerobot.com/help/monitor-status-is-wrong, UptimeRobot blog on HTTP method selection, read 2026-10-26).
- No `HEAD` export in `src/pages/api/contact.ts`: Astro 7.4.1 (`runtime/server/endpoint.js`) runs the GET handler for
  a HEAD and drops the body, and `curl -I https://retama.dev/api/contact/` answered 200 with `no-store` on
  2026-10-26. The new e2e test fails if that fallback goes away (a 404 instead of the health status).
- The comments in `src/pages/api/contact.ts` and `src/server/contact.ts` stay as they are: ospec rejects a `docs`
  change that touches product code, and rising to `bug` would need a red test for behaviour that already works. They
  still describe the GET handler correctly; the baseline, the platform's contract document, now names the HEAD.
- The Cloudflare GraphQL analytics were rate limited during the change, so the HEAD of UptimeRobot in production was
  not measured again; the previous session saw it on 2026-10-26 (UA UptimeRobot/2.0, about 279 a day).

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-26T16:17:05.282Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-26T16:17:05.282Z)
<!-- ospec:evidence:end -->
