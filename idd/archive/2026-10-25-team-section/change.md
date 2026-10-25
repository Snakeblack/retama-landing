# team-section

## Intent and acceptance

Present the two partners on the home, with name, role, one sentence each, LinkedIn for Michael and a design-consistent placeholder where each photo will go

Acceptance: In es and en, the home shows both partners with their full names, roles and sentences, a LinkedIn link for Michael only and a placeholder image per partner that follows DESIGN.md, all in the HTML without JavaScript; DESIGN.md records the section; all checks pass

## Plan

1. E2E first (`tests/e2e/team.spec.ts`): the chapter between the method and the questions, both names and roles, one
   LinkedIn link, the initials as hidden placeholders and, on desktop, four tiles of one height in one row; the header
   and the chapter index gain the chapter (`header.spec.ts`).
2. Copy in `es.ts` and `en.ts` (`team.*`, `nav.team`, `anchor.team`); the partners in `src/lib/board.ts`.
3. `Team.astro`, wired into `Home.astro` and its chapter list, which feeds the header and the index.
4. DESIGN.md (the team, the header, the index and the portraits in Imagery) and the functional scope.
5. The tests that count the chapters and their order (`questions.spec.ts`, `site.spec.ts`) gain the team.

## Decisions

- Own chapter before the questions; initials as the placeholder; "1 person to talk to" stays, since Paul is that
  person; Paul's sentence names the warehouse, the route and sales (owner, 2026-10-26).
- The portrait swaps itself: `import.meta.glob` finds `src/assets/team/<key>.jpg` and renders an astro:assets
  `<Picture>` (AVIF, WebP), else the initials. Checked on a build with a temporary photo, then removed.
- Photos are processed before they enter the repository (greyscale, metadata stripped, cropped); the originals stay in
  `negocio/fotos/`, outside git.
- Paul's text is the field tile, the one partner the client deals with; the role is in ink there, because the muted ink
  fails contrast on the field.
- The names live once in `board.ts`: they are proper nouns, the same in both languages. No `founder` in the JSON-LD
  until the company exists (`seo.ts`).

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-25T23:55:25.590Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-25T23:55:25.590Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-25T23:55:25.590Z)
- ev-4: living-doc-current for living-doc (2026-10-25T23:55:32.540Z)
<!-- ospec:evidence:end -->
