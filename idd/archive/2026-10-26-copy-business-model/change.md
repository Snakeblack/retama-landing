# copy-business-model

## Intent and acceptance

Align the home's copy and the blog with the agreed business model v2.0 (copy review of 2026-10-26, points 1-22 but the lead source): price by value and cycles paid upfront in the cost article, the web card from a landing to a CMS site, lead times on the cards, the free web proposal, one-off SEO, the maintenance minimum, fully remote but close when needed, Paul first with his logistics line, and English privacy texts that no longer say share

Acceptance: In es and en: the cost article no longer ties the price to working time nor says cycles are paid afterwards, and gives the landing and MVP lead times; every service card shows its starting price and its lead time (SEO: no monthly fee); the FAQ gives the diagnosis lead time, the agents' fee from 150 a month, the maintenance minimum of three months and that a website's proposal is free; the method says fully remote but close when needed; the team shows Paul first with his logistics line; the English form and privacy texts no longer say the data is shared; the JSON-LD and llms.txt repeat the new texts; all checks pass

## Plan

1. Tests first: the services cards end in their lead time (SEO: "no monthly fee") and the chapter carries the
   starting-prices note (`tests/e2e/services.spec.ts`); Paul comes first in the team (`team.spec.ts`); the English
   questions are "Common questions" (`questions.spec.ts`, `team.spec.ts`).
2. Copy in `es.ts` and `en.ts`: `services.note` (new) and the cards, `faq.a1`, `a2`, `a5`, `a6`, `contact.step3Rest`,
   `method.d2` and `d4`, `live.web.r1`, `live.desktop.d1`/`r1`, `sectors.item4Problem` and `team.paulLine`; in English
   also `faq.title`, `live.web.r2`, `form.privacy`, `legal.privacy.recipientsText` and `legal.updated`.
3. `Services.astro` shows the note under the heading; `board.ts` puts Paul first.
4. Blog: the cost article prices by value, gives the landing and MVP lead times and has each cycle paid when it starts;
   the decisions article gives the code on full payment.
5. Docs: DESIGN.md (services, team, contact), the brief (method) and the functional scope.

## Decisions

- Prior decision (memory): Modelo de negocio acordado (v2.0) -> negocio/modelo-de-negocio.md: current. The copy
  follows its sections 2, 4, 5, 6 and 7; the document itself stays out of the repository.
- Prior decision (memory): web-pricing-terms -> idd/archive/2026-10-25-web-pricing-terms/change.md: current. Prices
  stay literal text in the i18n files and the "Desde … + IVA" / "From … + VAT" format; the lead time follows a " · ".
- The texts are the ones the owner approved on 2026-10-26 after the copy review; points 21 (where the lead comes from,
  which touches the API and the email) and the SEO points go to their own changes.
- Fully remote, "but close when you need us" (owner's words), only in the method; the hero and the sectors keep
  "remote, from Spain" as a fact.
- Paul's line says only what serves the client: over ten years in logistics solving problems by the client's side,
  with no employer, no present-tense job, no warehouse and no sales of produce (owner). His role in Retama stays
  "Clientes y ventas".
- Prices are "desde" wherever they start somewhere (owner): one sentence under the services heading says they are
  starting prices and the lead times a guide, the agents' fee is "desde 150 €/mes", and the FAQ gives "desde" for each
  minimum and says the proposal sets the final price. The €90 hour stays a flat rate.
- The SEO card gives "sin cuota mensual" where the others give a lead time, because the model sets no lead time for
  SEO. The custom software card keeps "desde 8.000 €", the minimum of its category; the FAQ gives the desktop's €10,000.
- The method's English says "content management system" in full: its e2e bans tooling acronyms there (CMS included);
  the FAQ and the card say "CMS", as in Spanish "CMS" and "gestor de contenidos".
- Only the English legal text changed, so only its date moves to 26 October; the Spanish one, which prevails, is
  unchanged since 24 October.
- The plan lists `idd/config.yaml` although the change does not edit it: the intent cites its `persistent_data: []`
  (line 41) for the persistence category, ospec accepts a cite outside the documentation only in a planned file, and a
  resolved intent cannot be recorded again with another cite. The cites of `en.ts` and `es.ts` were taken before the
  edits moved those lines by two (`} satisfies Dictionary;` is now line 346, `export type Dictionary` line 347).

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-26T18:15:09.161Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-26T18:15:09.161Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-26T18:15:09.161Z)
- ev-4: living-doc-current for living-doc (2026-10-26T18:16:04.762Z)
<!-- ospec:evidence:end -->
