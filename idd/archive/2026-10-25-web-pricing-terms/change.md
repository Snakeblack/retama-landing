# web-pricing-terms

## Intent and acceptance

Align the home's services, contact steps and questions with business proposal 1.4: 'from' prices per service, the fixed-price diagnosis, the new warranty, code ownership with licensed generic parts, and no promise of a tracking space

Acceptance: In es and en, each priced service card shows its 'from' price, the contact steps present the diagnosis, and faq.a2-a6 state prices, the warranty (2 weeks of close support + 3 months from go-live), code ownership on full payment with generic parts licensed, and no tracking space; the JSON-LD FAQPage repeats the answers word for word; all checks pass

## Plan

1. Contract test first: the JSON-LD offers carry a `PriceSpecification` whose `minPrice` matches the card's text in
   each language, and llms.txt lists each service with its price (`tests/unit/seo.test.ts`).
2. Copy in `src/i18n/es.ts` and `en.ts`: a `services.*From` key per card, `faq.a1`–`a6` and `contact.step3Rest`.
3. The card shows the price under its sentence (`Services.astro`); `seo.ts` keeps each service's minimum beside its key.
4. Docs: DESIGN.md (services and contact), the brief (prices leave "out of scope") and the functional scope.
5. The blog articles that promised six months of warranty and a tracking space say what the FAQ now says, with
   `updated: 2026-10-26`; the cost article also gives the floor of custom software and the diagnosis.
6. E2E: each service card shows its price under its sentence, and an updated article shows both of its dates.

## Decisions

- Prices are literal text in the i18n files, as the FAQ figures already were; the numbers live once more in `seo.ts`
  for the JSON-LD, and the contract test ties both, so a card and its offer cannot drift apart.
- SEO and analytics from €800 (owner, 2026-10-26, after a market check: freelance €500–1,200, agencies €800–2,000).
- The diagnosis opens custom software and automation only; a landing or a website gets a direct proposal (owner).
- Lead times, maintenance from €120/€250 a month and €90 an hour are published; prices go to llms.txt and JSON-LD
  (owner).
- Format: "Desde 1.500 € + IVA" in Spanish, "From €1,500 + VAT" in English (owner).
- The price sits in `type-body-strong` in the card's own ink, because the muted ink fails contrast on the field card.
- The product with a subscription is not mentioned (owner). Merge waits for the commercial partner's approval of
  proposal 1.4 (owner).

## Evidence

<!-- ospec:evidence:start -->
- ev-1: check-run for checks-pass (2026-10-25T23:26:25.791Z)
- ev-2: contract-spec-and-test for contract-spec-and-test (2026-10-25T23:26:25.791Z)
- ev-3: adr-impact-declaration for adr-impact-declaration (2026-10-25T23:26:25.791Z)
- ev-4: living-doc-current for living-doc (2026-10-25T23:26:33.419Z)
<!-- ospec:evidence:end -->
