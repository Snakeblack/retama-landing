# worker-quota

## Intent and acceptance

Decide by ADR what to do about the Workers Free daily request limit (100,000/day per account, shared with retama-app): requests that are neither navigations nor assets invoke the Worker, and the zone's only rate limiting rule covers /api/report/ alone (M7 5/6)

Acceptance: An ADR amending 0011 records the decision on the daily request limit, its impact when exceeded (landing and retama-app), how it is detected and its review trigger; docs/roadmap.md marks worker-quota done

## Plan

1. `src/lib/contact-form.ts`: a 429 is the function's own limit only with its `{ "error": "rate-limited" }` body;
   any other 429 (Cloudflare's, such as the Workers daily request limit) is `unavailable`, which offers mail and
   WhatsApp. Reproduction test first in `tests/unit/contact-form.test.ts`.
2. `tests/unit/wrangler-config.test.ts`: assets and navigations do not invoke the Worker (no `run_worker_first`, no
   `assets_navigation_has_no_effect`, `compatibility_date` from 2025-04-01).
3. ADR 0012 (amends 0011): the Workers Free daily request limit is accepted in writing, with its impact, detection and
   review trigger.
4. `docs/architecture/technical-baseline.md` (edge platform row) and `docs/roadmap.md` (M7 item 5 done, accepted risk).

## Decisions

- Prior decision (memory): M7 auditoría OWASP: orden de changes y repo-secret-protection aplicado -> docs/roadmap.md
  (M7, item 5): current.
- Measure (user): accept the risk in ADR 0012, which amends 0011. No Workers Paid now and no change to the zone.
- Review trigger (user): whichever comes first, retama-app opening to real clients or the account above 25,000
  invocations a day (25 % of the limit) for several days in a row.
- Form (user): a 429 without the function's body is shown as unavailable, not "wait a minute".
- Scanner paths (user): no WAF custom rule for now.
- The daily limit belongs to the account, not the Worker, and retama-app (clientes.retama.dev, no static assets)
  shares it. Measured with the Cloudflare GraphQL analytics on 2026-10-26: landing 850-1,850 invocations a day,
  retama-app about 500.
- Widening the rate limiting rule was discarded: the free plan has one rule, path field only, counted per IP and
  location in 10 s windows; a per-IP limit cannot protect an account-wide limit.
- The HTTP status of error 1027 is not documented (Cloudflare documents 429 when `run_worker_first` requests exceed
  the free limit), so the form keys on the function's body, not on the status alone.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-26T15:59:17.539Z)
- ev-2: adr-impact-declaration for adr-impact-declaration (2026-10-26T15:59:17.539Z)
- ev-3: repro-run-pair for repro-test (2026-10-26T15:59:28.761Z)
- ev-4: living-doc-current for living-doc (2026-10-26T15:59:42.886Z)
<!-- ospec:evidence:end -->
