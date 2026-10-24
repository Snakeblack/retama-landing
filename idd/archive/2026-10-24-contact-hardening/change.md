# contact-hardening

## Intent and acceptance

Harden the contact surface (#59): fetch to Resend and Turnstile siteverify never follow redirects, the Cal.com iframe is sandboxed, and a Workers Builds build refuses Turnstile's test site key

Acceptance: Contact unit tests prove a 3xx from Resend or siteverify is not followed and fails closed; the booking iframe carries a sandbox attribute and the booking flow still works in a browser; a build with WORKERS_CI=1 and no site key or a test site key fails, while local, CI and E2E builds do not

## Plan

1. Redirects: `redirect: "manual"` in the siteverify and Resend `fetch` calls (`src/server/contact.ts`). The test
   double of `tests/unit/contact.test.ts` follows a 3xx like the platform's fetch unless told not to, so the tests
   prove that nothing reaches the redirect target and that the request fails closed.
2. Sandbox: the Cal.com iframe gets `allow-scripts allow-same-origin allow-forms allow-popups
   allow-popups-to-escape-sandbox` (`src/scripts/booking.ts`), asserted in `tests/e2e/booking.spec.ts`.
3. Site key: `scripts/lib/turnstile-key.mjs` (`refusedSiteKey`, `TEST_SITE_KEY`) and a throw in `astro.config.mjs`,
   like `scripts/lib/legal-owner.mjs`; covered by `tests/unit/turnstile-key.test.ts`.
4. Contract: the Resend, Turnstile and Cal.com rows of `docs/architecture/technical-baseline.md`.

## Decisions

- Sandbox tokens (user, 2026-10-24): the base set plus `allow-popups-to-escape-sandbox`; no top navigation.
- Booking check (user): a real booking driven with Playwright on a local build with real Cal.com, then cancelled with
  the Cal.com MCP. Done 2026-10-24: booked 2026-11-06 19:00 inside the sandboxed frame, the top page never navigated,
  booking `7cZWpmanzNd95mcV8SFkaj` cancelled. Cal.com refuses `example.com` attendees.
- Site keys refused (user): a missing key and every Turnstile test key (`[123]x` plus twenty zeros plus two letters),
  in production and in the Previews. Checked by hand: an empty key, `1x…AA` and `3x…FF` stop the build with
  `WORKERS_CI=1`; the real key builds.
- The optional HSTS and `X-Frame-Options` headers on `/api/contact/` stay out (user).
- A 3xx reaches the existing `!response.ok` paths: Resend gives `delivery` with the status logged, siteverify gives
  `verification`.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: repro-run-pair for repro-test (2026-10-24T20:27:54.614Z)
- ev-2: check-run for checks-pass (2026-10-24T20:32:47.344Z)
- ev-3: contract-spec-and-test for contract-spec-and-test (2026-10-24T20:32:47.344Z)
- ev-4: frozen-review for trust-review (2026-10-24T20:33:23.513Z, subagent-stop)
- ev-5: check-run for checks-pass (2026-10-24T20:34:11.653Z)
- ev-6: contract-spec-and-test for contract-spec-and-test (2026-10-24T20:34:11.653Z)
- ev-7: living-doc-current for living-doc (2026-10-24T20:34:18.330Z)
<!-- ospec:evidence:end -->
