# whatsapp-from-env

## Intent and acceptance

Take the WhatsApp number from the build environment (PUBLIC_WHATSAPP_NUMBER) and hide WhatsApp when it is unset, so no placeholder number is ever published and the owner personal number stays out of the public repository

Acceptance: A build with PUBLIC_WHATSAPP_NUMBER set shows WhatsApp with that number, grouped in threes, linking to wa.me in the direct ways and the failure ways; a build without it shows no WhatsApp link and no 34600000000 anywhere; no tracked file holds the owner number

## Plan

1. Unit test for `whatsapp()` (link, readable number, + and spaces dropped, null without a number), with a test
   number: red.
2. `src/lib/board.ts`: drop the provisional `whatsappNumber` and `whatsappLabel`; add `whatsapp(number)`: green.
3. `astro.config.mjs`: optional public `PUBLIC_WHATSAPP_NUMBER`; `Contact.astro` shows both WhatsApp links only with it.
4. E2E follows the build (like `PUBLIC_BOOKING`); CI builds with a test number, a local run without one.
5. DESIGN.md and the baseline record that WhatsApp needs the variable.
6. The owner sets `PUBLIC_WHATSAPP_NUMBER` to their number in Workers Builds, production and Previews.

## Decisions

- The number comes from the build environment, not the repository: the repository is public and the number is the
  owner's personal one for now (owner, 2026-10-22: personal data as Workers Builds variables). A business number later
  is a change of variable, with no commit. Tests, docs and this record use the test number 34600000000 only.
- This change replaces the first attempt, `whatsapp-number`, whose CLI record quoted the owner's number: it is kept
  out of git (local `.git/info/exclude`), since `state.yaml` is not edited by hand.
- Without the variable the page shows no WhatsApp at all: the provisional 34600000000 could belong to someone, and a
  made-up channel is not honest. CI proves both cases: E2E with a test number, Lighthouse and local runs without.
- The variable is read as digits only, so the number written with + and spaces or compact gives the same link. The
  readable number assumes a two-digit country code (Spain).

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-22T21:28:11.149Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-22T21:28:11.149Z)
- ev-3: frozen-review for trust-review (2026-10-22T21:29:24.731Z, subagent-stop)
- ev-4: living-doc-current for living-doc (2026-10-22T21:29:27.518Z)
<!-- ospec:evidence:end -->
