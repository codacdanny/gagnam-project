import Link from "next/link";
import { PIPELINE, krw, usd } from "@/lib/pipeline";
import { Meter, Pill, Stat } from "@/components/ui";

export default function Home() {
  const { clinics, stats } = PIPELINE;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-[28px] font-semibold tracking-tight leading-tight max-w-2xl">
          Korean clinic reviews, resolved and graded.
        </h1>
        <p className="text-muted max-w-2xl leading-relaxed text-[15px]">
          {stats.rawReviews} reviews across {stats.sources} Korean sources arrive as{" "}
          {stats.surfaceNames} different clinic name strings. The pipeline resolves those to{" "}
          {stats.resolvedClinics} clinics, suppresses {stats.duplicatesSuppressed} cross-posted
          duplicates, and filters {stats.incentivisedFiltered} reviews that carry paid-promotion
          markers — before a single price is averaged.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Reviews ingested" value={String(stats.rawReviews)} sub={`${stats.sources} sources`} />
        <Stat label="Names → clinics" value={`${stats.surfaceNames} → ${stats.resolvedClinics}`} sub="entity resolution" />
        <Stat label="Duplicates removed" value={String(stats.duplicatesSuppressed)} sub={`${stats.duplicateClusters} clusters`} />
        <Stat label="Incentivised filtered" value={String(stats.incentivisedFiltered)} sub="below credibility floor" />
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">Clinics</h2>
          <span className="text-[12px] text-dim">
            ranked by count of reviews that survived de-duplication and credibility filtering
          </span>
        </div>

        <div className="space-y-2">
          {clinics.map((c) => (
            <Link
              key={c.id}
              href={`/clinic/${c.id}`}
              className="block rounded-xl border border-line bg-panel hover:bg-panel2 transition p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="ko font-medium text-[16px]">{c.canonicalName}</span>
                    <Pill>{c.variants.length} name variants</Pill>
                    <Pill>{c.sources.length} sources</Pill>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {c.procedures.map((p) => (
                      <Pill key={p.id}>{p.en}</Pill>
                    ))}
                  </div>
                  {c.prices.length > 0 && (
                    <div className="text-[13px] text-muted mono">
                      {c.prices.slice(0, 3).map((p) => (
                        <span key={p.procedureId} className="mr-4 inline-block">
                          {p.procedureEn}{" "}
                          <span className="text-ink">{krw(p.medianKrw)}</span>{" "}
                          <span className="text-dim">({usd(p.medianKrw)} · n={p.n})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-44 shrink-0 space-y-1.5">
                  <div className="flex justify-between text-[12px]">
                    <span className="text-dim">median credibility</span>
                    <span className="mono">{c.medianCredibility}</span>
                  </div>
                  <Meter value={c.medianCredibility} />
                  <div className="text-[12px] text-muted mono">
                    {c.counted.length} counted
                    <span className="text-dim"> / {c.naiveReviewCount} raw</span>
                  </div>
                  {c.incentivisedShare > 0 && (
                    <div className="text-[11px] text-bad">
                      {Math.round(c.incentivisedShare * 100)}% flagged incentivised
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
