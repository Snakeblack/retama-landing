# produce-sector

## Intent and acceptance

Replace the gaming sector with fresh-produce distribution, the entry sector of the agreed business model, with its own example fragment of the day's orders

Acceptance: In es and en, the sectors switcher no longer names gaming anywhere; a fresh-produce tab has its problem, three builds and an example fragment of the day's orders that comes alive like the others; the brief, the functional scope and DESIGN.md name the new sector; all checks pass

## Plan

1. E2E first (`tests/e2e/sectors.spec.ts`): the four tabs in order, the third with the day's orders and one alert row,
   and no "gaming" on the page in either language.
2. Copy in `es.ts` and `en.ts`: `sectors.item3*` become fresh produce; `frag.economy.*` leave for `frag.orders.*`.
3. `Sectors.astro`: the gaming table becomes the produce table, through the same `ExampleTable`.
4. DESIGN.md (Imagery), the brief (sectors and actors) and the functional scope.

## Decisions

- The tab is "Hortofrutícola" / "Fresh produce", in the third place where gaming was, so it does not stand out
  (owner, 2026-10-26).
- The problem, the three builds and the rows of the fragment are the ones proposed and approved; routes stay in the
  logistics tab, so the produce fragment shows orders and stock instead.
- The made-up client names follow the rule of every fragment: an example, labelled as one.

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-26T07:41:25.865Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-26T07:41:25.865Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-26T07:41:25.865Z)
- ev-4: living-doc-current for living-doc (2026-10-26T07:41:33.766Z)
<!-- ospec:evidence:end -->
