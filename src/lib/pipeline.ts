// The pipeline. Runs at build time, deterministically, with no network calls.
//
//   ingest → resolve entities → deduplicate → score credibility → aggregate evidence
//
// Every number rendered in the UI comes from here, and every claim keeps a pointer
// back to the Korean sentence it came from.

import { RAW_REVIEWS, SOURCES, type RawReview, type SourceId } from "@/data/corpus";
import { resolveClinics, parseClinicName, type ClinicEntity } from "./normalize";
import { clusterDuplicates, type DuplicateCluster } from "./dedupe";
import { scoreCredibility, type CredibilityResult } from "./credibility";
import { normalizeProcedure, type ProcedureCategory } from "./procedures";

export interface EnrichedReview extends RawReview {
  clinicId: string;
  procedure: ProcedureCategory | null;
  credibility: CredibilityResult;
  isDuplicateOf: string | null;
  sourceLabel: string;
}

export interface PriceStat {
  procedureId: string;
  procedureEn: string;
  n: number;
  medianKrw: number;
  minKrw: number;
  maxKrw: number;
}

export interface Clinic extends ClinicEntity {
  reviews: EnrichedReview[];
  /** Reviews that survived dedup and cleared the credibility floor. */
  counted: EnrichedReview[];
  sources: SourceId[];
  procedures: ProcedureCategory[];
  prices: PriceStat[];
  medianCredibility: number;
  incentivisedShare: number;
  /** Median price if you naively trusted every review — shown against the real one. */
  naiveReviewCount: number;
}

const CREDIBILITY_FLOOR = 40;

function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function build() {
  // 1. Entity resolution over every surface string in the corpus.
  const entities = resolveClinics(RAW_REVIEWS.map((r) => r.clinicRaw));
  const rawToClinic = new Map<string, string>();
  for (const e of entities) for (const v of e.variants) rawToClinic.set(v.raw, e.id);

  // 2. Near-duplicate detection, scoped within a resolved clinic so that two people
  //    describing the same common procedure at different clinics are never merged.
  const dedupInput = RAW_REVIEWS.map((r) => ({ id: r.id, text: r.ko, postedAt: r.postedAt, clinicId: rawToClinic.get(r.clinicRaw)! }));
  const allClusters: DuplicateCluster[] = [];
  const suppressed = new Set<string>();
  const errs: number[] = [];
  for (const e of entities) {
    const docs = dedupInput.filter((d) => d.clinicId === e.id);
    const res = clusterDuplicates(docs);
    allClusters.push(...res.clusters);
    res.suppressed.forEach((id) => suppressed.add(id));
    if (res.meanAbsError) errs.push(res.meanAbsError);
  }
  const dupOwner = new Map<string, string>();
  for (const c of allClusters) for (const d of c.duplicates) dupOwner.set(d.id, c.primaryId);

  // 3. Credibility + procedure normalisation.
  const enriched: EnrichedReview[] = RAW_REVIEWS.map((r) => ({
    ...r,
    clinicId: rawToClinic.get(r.clinicRaw)!,
    procedure: normalizeProcedure(r.procedureRaw),
    credibility: scoreCredibility(r),
    isDuplicateOf: dupOwner.get(r.id) ?? null,
    sourceLabel: SOURCES[r.source].label,
  }));

  // 4. Aggregate per clinic.
  const clinics: Clinic[] = entities.map((e) => {
    const reviews = enriched.filter((r) => r.clinicId === e.id);
    const counted = reviews.filter((r) => !r.isDuplicateOf && r.credibility.score >= CREDIBILITY_FLOOR);

    const byProc = new Map<string, EnrichedReview[]>();
    for (const r of counted) if (r.procedure) {
      if (!byProc.has(r.procedure.id)) byProc.set(r.procedure.id, []);
      byProc.get(r.procedure.id)!.push(r);
    }

    const prices: PriceStat[] = [...byProc.entries()]
      .map(([pid, rs]) => {
        const vals = rs.map((r) => r.statedPriceKrw).filter((v): v is number => v !== null);
        if (!vals.length) return null;
        return {
          procedureId: pid,
          procedureEn: rs[0].procedure!.en,
          n: vals.length,
          medianKrw: median(vals),
          minKrw: Math.min(...vals),
          maxKrw: Math.max(...vals),
        };
      })
      .filter((p): p is PriceStat => p !== null)
      .sort((a, b) => b.n - a.n);

    const incentivised = reviews.filter((r) => r.credibility.band === "Likely incentivised").length;

    return {
      ...e,
      reviews,
      counted,
      sources: [...new Set(reviews.map((r) => r.source))],
      procedures: [...new Map(counted.filter((r) => r.procedure).map((r) => [r.procedure!.id, r.procedure!])).values()],
      prices,
      medianCredibility: median(reviews.map((r) => r.credibility.score)),
      incentivisedShare: reviews.length ? incentivised / reviews.length : 0,
      naiveReviewCount: reviews.length,
    };
  }).sort((a, b) => b.counted.length - a.counted.length || b.medianCredibility - a.medianCredibility);

  const stats = {
    rawReviews: RAW_REVIEWS.length,
    surfaceNames: new Set(RAW_REVIEWS.map((r) => r.clinicRaw)).size,
    resolvedClinics: entities.length,
    duplicateClusters: allClusters.length,
    duplicatesSuppressed: suppressed.size,
    incentivisedFiltered: enriched.filter((r) => !r.isDuplicateOf && r.credibility.score < CREDIBILITY_FLOOR).length,
    countedReviews: enriched.filter((r) => !r.isDuplicateOf && r.credibility.score >= CREDIBILITY_FLOOR).length,
    sources: Object.keys(SOURCES).length,
    minhashMeanAbsError: errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : 0,
  };

  return { clinics, enriched, entities, clusters: allClusters, stats };
}

export const PIPELINE = build();

export function getClinic(id: string): Clinic | undefined {
  return PIPELINE.clinics.find((c) => c.id === id);
}

export function reviewById(id: string): EnrichedReview | undefined {
  return PIPELINE.enriched.find((r) => r.id === id);
}

export function krw(n: number): string {
  return `₩${(n / 10000).toLocaleString()}만`;
}
export function usd(n: number): string {
  // Indicative only — fixed rate, stated as such wherever it is shown.
  return `$${Math.round(n / 1380 / 10) * 10}`;
}
export { parseClinicName };
