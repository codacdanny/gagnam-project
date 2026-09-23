# Gangnam Evidence Explorer

Turns fragmented Korean clinic reviews into a source-backed comparison of procedures,
prices and credibility — for English-speaking medical-tourism buyers who can't read the
originals.

The brief named the hard problem as *"review syndication at scale across many Korean
sources, with translation + de-duplication + clinic normalisation"*, with trust signals as
the moat. That is exactly what this build implements, and the `/pipeline` route exists so
the work is inspectable rather than asserted.

## The argument

Korean cosmetic-surgery review content is heavily incentivised — 체험단 (review-group)
campaigns, 협찬 (sponsorship), paid 원고료 posts. Aggregating that corpus and translating
it into confident English is not a neutral act: it launders clinic marketing into
something that reads like patient evidence, which is *worse* than the status quo, because
the Korean original at least looked like an ad.

So this pipeline grades before it aggregates. Incentivised reviews are detected, scored,
excluded from every price and count — and still shown, with the reason.

## Pipeline

Four deterministic stages. No network calls, no model inference at request time, no API
keys. The same corpus always produces the same numbers.

**1. Ingest** — 30 reviews, 4 sources (Naver Blog, Naver Cafe, Babitalk, Gangnam Unni).

**2. Entity resolution** (`src/lib/normalize.ts`) — 23 distinct clinic name strings resolve
to 6 clinics. Strips entity-type suffixes (의원 / 성형외과 / 성형외과의원 / 클리닉), branch
tokens (강남점, 압구정, 신사점) and whitespace, then clusters by Sørensen–Dice similarity
over character bigrams at a 0.82 threshold. Latin-script brandings fold through a curated
alias lexicon, because romanising 더뷰티 gives `deobyuti`, not `THE BEAUTY` — an algorithm
cannot recover that mapping, so it is data, not code. Every transformation is retained and
displayed per variant as an audit trail.

**3. Cross-source de-duplication** (`src/lib/dedupe.ts`) — 128-permutation MinHash over
4-character shingles, compared within a resolved clinic so that two patients describing the
same common procedure at different clinics are never merged. The earliest posting is kept.
Exact Jaccard over the full shingle sets is computed alongside the estimate, so the
approximation error is reported rather than assumed: **mean absolute error 0.008**.
Threshold calibration is empirical — known repostings land at 0.37–1.00, unrelated reviews
peak at 0.019, and the threshold sits at 0.30 inside that gap.

**4. Credibility scoring** (`src/lib/credibility.ts`) — an explainable rule system over
disclosure language (원고료 / 협찬 / 체험단 / 무료로 제공받아), structural marketing tells
(booking handles, outbound links, absolute claims, promotional urgency, clinic-name
repetition), and first-hand markers that incentivised copy almost never contains: a stated
price, a post-op timeline, an admitted drawback. Every signal carries the exact substring
that fired it, so no score is unexplained. Reviews below 40 are excluded from aggregates.

## What this changes

Prices are computed only from reviews that survived de-duplication and cleared the
credibility floor. Both counts are shown side by side — `counted of collected` — so the effect of
the filtering is visible rather than hidden inside an average.

## Running it

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build
```

Next.js 16 · React 19 · Tailwind 4 · TypeScript. Fully static output.

## Scope and honesty

The corpus in `src/data/corpus.ts` is a hand-authored fixture modelled on real Korean
review patterns — register shifts between repostings, invented clinic marketing names,
disclosure boilerplate — with duplicates and name variants planted deliberately so the
pipeline's behaviour can be verified against a known answer. It is not live scraped data,
and the UI says so. The processing pipeline is real.

Translations are pre-computed and stored alongside each source. In production this stage
would be a model call; it is factored as a data field so the pipeline shape is unchanged
by swapping it. Everything downstream of translation — the parts the brief called hard —
runs as real code here.

The next things to build, in order: a connector layer behind the corpus interface; a
labelled evaluation set for the entity-resolution and credibility stages so precision and
recall are measured rather than eyeballed; and a verified-credential layer
(성형외과 전문의 board certification), which is the one trust signal that cannot be
astroturfed.
