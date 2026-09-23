import Link from "next/link";
import { ArrowRight, ShieldCheck, CircleAlert, Ban } from "lucide-react";
import { PIPELINE, outcomeOf, type EnrichedReview, type ReviewOutcome } from "@/lib/pipeline";
import { bandFor } from "@/lib/credibility";
import { OUTCOME_LABEL, ReviewDot } from "@/components/ui";
import { ClinicExplorer, type ExplorerClinic, type ExplorerProcedure } from "@/components/clinic-explorer";

const ORDER: Record<ReviewOutcome, number> = { used: 0, repost: 1, paid: 2 };

export default function Home() {
  const { clinics, stats, enriched } = PIPELINE;
  const clinicName = new Map(clinics.map((c) => [c.id, c.nameEn]));

  const dotTitle = (r: EnrichedReview) =>
    `${clinicName.get(r.clinicId)} · ${r.procedure?.en ?? "Other"} · ${r.sourceLabel} · credibility ${r.credibility.score}`;

  const groups: { outcome: ReviewOutcome; reviews: EnrichedReview[]; note: string }[] = [
    { outcome: "used", reviews: enriched.filter((r) => outcomeOf(r) === "used"), note: "read as genuine patients" },
    { outcome: "repost", reviews: enriched.filter((r) => outcomeOf(r) === "repost"), note: "same review posted on another site" },
    { outcome: "paid", reviews: enriched.filter((r) => outcomeOf(r) === "paid"), note: "sponsored or promotional" },
  ];

  const explorerClinics: ExplorerClinic[] = clinics.map((c) => ({
    id: c.id,
    nameEn: c.nameEn,
    canonicalName: c.canonicalName,
    sourceCount: c.sources.length,
    medianCredibility: c.medianCredibility,
    band: bandFor(c.medianCredibility),
    used: c.counted.length,
    total: c.naiveReviewCount,
    paid: c.reviews.filter((r) => outcomeOf(r) === "paid").length,
    reposts: c.reviews.filter((r) => outcomeOf(r) === "repost").length,
    reviews: [...c.reviews]
      .sort((a, b) => ORDER[outcomeOf(a)] - ORDER[outcomeOf(b)])
      .map((r) => ({ id: r.id, outcome: outcomeOf(r), title: dotTitle(r) })),
    prices: c.prices,
    procedureIds: c.procedures.map((p) => p.id),
  }));

  // Only procedures with at least one reported price can be compared.
  const procedures: ExplorerProcedure[] = [
    ...new Map(clinics.flatMap((c) => c.prices.map((p) => [p.procedureId, { id: p.procedureId, en: p.procedureEn }] as const))).values(),
  ];

  return (
    <div className="space-y-16">
      <section className="relative left-1/2 -ml-[50vw] w-screen -mt-10 px-4 pt-12 pb-14 md:pt-16 md:pb-20 bg-linear-to-b from-accent-soft via-accent-soft/40 to-bg">
        <div className="mx-auto max-w-5xl grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full bg-panel/80 border border-accent/20 px-3 py-1 text-[14px] font-medium text-accent">
              <ShieldCheck aria-hidden className="size-4" />
              Gangnam, Seoul · cosmetic surgery reviews
            </p>
            <h1 className="font-serif text-[36px] md:text-[50px] leading-[1.08] tracking-tight text-ink">
              What patients really paid, <span className="text-accent italic">minus the paid reviews.</span>
            </h1>
            <p className="text-[18px] text-muted leading-relaxed max-w-xl">
              We translated {stats.rawReviews} Korean reviews from {stats.sources} review sites and
              checked each one. Reposts count once and sponsored posts are set aside, so every
              price here comes from a review that reads like a real patient.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#prices"
                className="inline-flex items-center gap-2 min-h-11 rounded-full bg-accent px-5 text-[16px] font-medium text-white hover:bg-ink transition-colors"
              >
                Compare prices <ArrowRight aria-hidden className="size-4" />
              </a>
              <Link
                href="/pipeline"
                className="inline-flex items-center min-h-11 rounded-full border border-line bg-panel px-5 text-[16px] font-medium text-ink hover:border-accent/50 transition-colors"
              >
                How we check reviews
              </Link>
            </div>
          </div>

          <figure className="rounded-3xl border border-line bg-panel p-6 md:p-7 shadow-[0_24px_48px_-24px_rgba(14,107,107,0.35)]">
            <figcaption className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-[22px] text-ink">Every review, sorted</span>
              <span className="text-[13px] text-dim">1 dot = 1 review</span>
            </figcaption>
            <ul className="mt-5 space-y-5">
              {groups.map((g) => (
                <li key={g.outcome}>
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-[34px] leading-none num text-ink w-12">{g.reviews.length}</span>
                    <span>
                      <span className="block text-[15px] font-medium text-ink">{OUTCOME_LABEL[g.outcome]}</span>
                      <span className="block text-[13px] text-dim">{g.note}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-15">
                    {g.reviews.map((r) => (
                      <ReviewDot key={r.id} outcome={g.outcome} title={dotTitle(r)} size={16} />
                    ))}
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 pt-4 border-t border-line text-[14px] text-muted">
              {stats.surfaceNames} different spellings of clinic names matched to{" "}
              <span className="font-medium text-ink">{stats.resolvedClinics} clinics</span>.
            </p>
          </figure>
        </div>
      </section>

      <section aria-labelledby="how-to-read" className="grid gap-4 md:grid-cols-[1fr_2fr] md:items-center">
        <h2 id="how-to-read" className="font-serif text-[24px] leading-snug text-ink">
          How to read the credibility score
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3 text-[15px]">
          <li className="rounded-2xl bg-panel border border-line p-4">
            <ShieldCheck aria-hidden className="size-5 text-good" />
            <div className="mt-2 font-semibold text-ink num">70–100</div>
            <div className="text-muted">Reads as a genuine patient: price, recovery, honest drawbacks</div>
          </li>
          <li className="rounded-2xl bg-panel border border-line p-4">
            <CircleAlert aria-hidden className="size-5 text-warn" />
            <div className="mt-2 font-semibold text-ink num">40–69</div>
            <div className="text-muted">Mixed signals, still counted</div>
          </li>
          <li className="rounded-2xl bg-panel border border-line p-4">
            <Ban aria-hidden className="size-5 text-bad" />
            <div className="mt-2 font-semibold text-ink num">Below 40</div>
            <div className="text-muted">Likely paid or sponsored, left out of prices</div>
          </li>
        </ul>
      </section>

      <ClinicExplorer clinics={explorerClinics} procedures={procedures} />
    </div>
  );
}
