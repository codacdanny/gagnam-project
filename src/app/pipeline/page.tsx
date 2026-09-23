import Link from "next/link";
import { PIPELINE, reviewById } from "@/lib/pipeline";
import { Stat, Pill } from "@/components/ui";

export default function PipelinePage() {
  const { stats, clusters, clinics, enriched } = PIPELINE;
  const flagged = enriched.filter((r) => r.credibility.band === "Likely incentivised");
  const clinicName = new Map(clinics.map((c) => [c.id, c.nameEn]));

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h1 className="text-[26px] font-semibold tracking-tight">Pipeline</h1>
        <p className="text-muted max-w-2xl leading-relaxed text-[15px]">
          Four deterministic stages, run at build time with no network calls and no model
          inference, so the same corpus always produces the same numbers. Each stage below
          shows what it actually did.
        </p>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="1. Ingest" value={String(stats.rawReviews)} sub={`reviews · ${stats.sources} sources`} />
        <Stat label="2. Resolve" value={`${stats.surfaceNames} → ${stats.resolvedClinics}`} sub="name strings → clinics" />
        <Stat label="3. Dedupe" value={`−${stats.duplicatesSuppressed}`} sub={`${stats.duplicateClusters} clusters`} />
        <Stat label="4. Grade" value={`−${stats.incentivisedFiltered}`} sub={`${stats.countedReviews} counted`} />
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Stage 2 — Entity resolution</h2>
        <p className="text-[13px] text-muted max-w-3xl leading-relaxed">
          Clinic names are stripped of entity-type suffixes (의원 / 성형외과 / 클리닉), branch
          tokens (강남점, 압구정) and whitespace; Latin-script brandings are folded through a
          curated alias lexicon, because romanising 더뷰티 yields <span className="mono">deobyuti</span>,
          not <span className="mono">THE BEAUTY</span>. Remaining strings are clustered by
          Sørensen–Dice similarity over character bigrams at a 0.82 threshold.
        </p>
        <div className="rounded-xl border border-line bg-panel divide-y divide-line">
          {clinics.map((c) => (
            <div key={c.id} className="px-4 py-3">
              <Link href={`/clinic/${c.id}`} className="text-[14px] font-medium hover:text-accent transition">
                {c.nameEn}
              </Link>
              <span className="ko ml-2 text-[12px] text-dim">{c.canonicalName}</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {c.variants.map((v) => (
                  <span key={v.raw} className="ko rounded border border-line bg-panel2 px-2 py-0.5 text-[11px] text-muted">
                    {v.raw} <span className="mono text-dim">{v.score.toFixed(2)}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Stage 3 — Cross-source de-duplication</h2>
        <p className="text-[13px] text-muted max-w-3xl leading-relaxed">
          128-permutation MinHash over 4-character shingles, compared within a resolved clinic.
          The earliest posting is kept and later repostings are suppressed. Matching runs on the
          Korean text; the English translation is shown above each for reading. Estimated Jaccard is
          shown against the exact value computed over the full shingle sets — mean absolute error
          across all pairs is{" "}
          <span className="mono text-ink">{stats.minhashMeanAbsError.toFixed(3)}</span>.
        </p>
        <div className="space-y-2">
          {clusters.map((cl) => {
            const primary = reviewById(cl.primaryId)!;
            return (
              <div key={cl.primaryId} className="rounded-xl border border-line bg-panel p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[12px]">
                  <span className="mono text-accent">{cl.primaryId}</span>
                  <Pill>{primary.sourceLabel}</Pill>
                  <span className="text-dim mono">{primary.postedAt}</span>
                  <span className="text-dim">kept</span>
                </div>
                <div className="border-l-2 border-accent/40 pl-3 space-y-1">
                  <p className="text-[13px] leading-relaxed">{primary.en}</p>
                  <p className="ko text-[12px] text-dim leading-relaxed">{primary.ko}</p>
                </div>
                {cl.duplicates.map((d) => {
                  const dup = reviewById(d.id)!;
                  return (
                    <div key={d.id} className="pt-1">
                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <span className="mono text-bad">{d.id}</span>
                        <Pill>{dup.sourceLabel}</Pill>
                        <span className="text-dim mono">{dup.postedAt}</span>
                        <span className="text-dim">suppressed</span>
                        <span className="mono text-muted">
                          minhash {d.estimated.toFixed(3)} · exact {d.exact.toFixed(3)}
                        </span>
                      </div>
                      <div className="border-l-2 border-bad/30 pl-3 mt-1 space-y-1">
                        <p className="text-[13px] text-muted leading-relaxed">{dup.en}</p>
                        <p className="ko text-[12px] text-dim leading-relaxed">{dup.ko}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Stage 4 — Incentivised-review detection</h2>
        <p className="text-[13px] text-muted max-w-3xl leading-relaxed">
          Korean cosmetic-surgery review content is heavily incentivised through 체험단
          (review-group) campaigns, 협찬 (sponsorship) and paid 원고료 posts. Disclosure
          requirements pushed much of this into boilerplate, which makes the strongest signals
          textual. Reviews scoring below 40 are excluded from every price and count on the site.
          Nothing is hidden — the reviews stay visible on the clinic page with their score shown.
        </p>
        <div className="space-y-2">
          {flagged.map((r) => (
            <div key={r.id} className="rounded-xl border border-bad/25 bg-bad/[0.03] p-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <span className="mono text-bad">{r.id}</span>
                <Pill>{r.sourceLabel}</Pill>
                <span className="text-muted">{clinicName.get(r.clinicId)}</span>
                <span className="ko text-dim">as written: {r.clinicRaw}</span>
                <span className="grow" />
                <span className="mono text-bad">score {r.credibility.score}</span>
              </div>
              <p className="text-[13px] leading-relaxed">{r.en}</p>
              <p className="ko text-[12px] text-dim leading-relaxed">{r.ko}</p>
              <div className="flex flex-wrap gap-1.5">
                {r.credibility.signals.filter((s) => s.weight < 0).map((s, i) => (
                  <span key={i} className="rounded border border-bad/25 bg-bad/5 px-1.5 py-0.5 text-[11px] text-bad">
                    <span className="mono">{s.weight}</span> {s.label}{" "}
                    <span className="ko opacity-60">“{s.evidence}”</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
