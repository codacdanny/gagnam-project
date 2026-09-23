import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { PIPELINE, brandEn, formatDate, getClinic, krw, outcomeOf, reviewById, usd } from "@/lib/pipeline";
import { Band, DotLegend, Meter, Monogram, Pill, ReviewDot, Stat } from "@/components/ui";

export function generateStaticParams() {
  return PIPELINE.clinics.map((c) => ({ id: c.id }));
}

// Every clinic is known at build time; anything else is a 404, not an on-demand render.
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const clinic = getClinic((await params).id);
  if (!clinic) return {};
  const procs = clinic.procedures.map((p) => p.en.toLowerCase()).join(", ");
  return {
    title: `${clinic.nameEn} · Gangnam Evidence`,
    description: `Translated patient reviews and reported prices${procs ? ` for ${procs}` : ""} at ${clinic.nameEn} (${clinic.canonicalName}), with paid and reposted reviews set aside.`,
  };
}

export default async function ClinicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clinic = getClinic(id);
  if (!clinic) notFound();

  const ordered = [...clinic.reviews].sort((a, b) => {
    if (!!a.isDuplicateOf !== !!b.isDuplicateOf) return a.isDuplicateOf ? 1 : -1;
    return b.credibility.score - a.credibility.score;
  });
  const setAside = clinic.naiveReviewCount - clinic.counted.length;

  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[15px] text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft aria-hidden className="size-4" /> All clinics
        </Link>
        <div className="flex items-start gap-4 pt-2">
          <Monogram name={clinic.nameEn} size="lg" />
          <div className="min-w-0 space-y-2">
            <h1 className="font-serif text-[30px] md:text-[38px] leading-tight tracking-tight text-ink">{clinic.nameEn}</h1>
            <p className="text-[15px] text-muted">
              Korean name <span lang="ko" className="ko font-medium text-ink">{clinic.canonicalName}</span>
              <span className="mx-2 text-dim" aria-hidden>·</span>
              use this when searching or booking in Korea
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {clinic.procedures.map((p) => <Pill key={p.id}>{p.en}</Pill>)}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-panel px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5" aria-label={`${clinic.counted.length} of ${clinic.naiveReviewCount} reviews used`}>
            {ordered.map((r) => (
              <ReviewDot key={r.id} outcome={outcomeOf(r)} size={18} title={`${r.procedure?.en ?? "Other"} · ${r.sourceLabel} · credibility ${r.credibility.score}`} />
            ))}
          </div>
          <DotLegend />
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Reviews used" value={`${clinic.counted.length} of ${clinic.naiveReviewCount}`} sub={setAside ? `${setAside} set aside` : "none set aside"} />
        <Stat label="Median credibility" value={String(clinic.medianCredibility)} sub="out of 100" />
        <Stat label="Review sites" value={String(clinic.sources.length)} />
        <Stat label="Flagged as paid" value={`${Math.round(clinic.incentivisedShare * 100)}%`} sub="after removing reposts" />
      </section>

      {clinic.prices.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="font-serif text-[26px] text-ink">What patients paid</h2>
            <p className="text-[15px] text-muted mt-1">
              Taken only from reviews that passed our credibility check. These are prices patients reported, not quotes.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-panel overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="text-[13px] text-muted bg-panel2">
                <tr>
                  <th scope="col" className="text-left font-medium px-5 py-3">Procedure</th>
                  <th scope="col" className="text-right font-medium px-5 py-3">Typical price</th>
                  <th scope="col" className="text-right font-medium px-5 py-3">In Korean won</th>
                  <th scope="col" className="text-right font-medium px-5 py-3">Range reported</th>
                  <th scope="col" className="text-right font-medium px-5 py-3">Reviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {clinic.prices.map((p) => (
                  <tr key={p.procedureId}>
                    <th scope="row" className="text-left font-medium px-5 py-3.5 text-ink">{p.procedureEn}</th>
                    <td className="px-5 py-3.5 text-right num font-semibold text-ink">≈{usd(p.medianKrw)}</td>
                    <td className="px-5 py-3.5 text-right num text-muted">{krw(p.medianKrw)}</td>
                    <td className="px-5 py-3.5 text-right num text-muted">
                      {p.minKrw === p.maxKrw ? "—" : `${krw(p.minKrw)} – ${krw(p.maxKrw)}`}
                    </td>
                    <td className="px-5 py-3.5 text-right num text-muted">{p.n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-[26px] text-ink">Patient reviews</h2>
          <p className="text-[15px] text-muted mt-1">
            Translated from Korean. Open any review to see the original text and why it scored
            the way it did.
          </p>
        </div>

        <ul className="space-y-4">
          {ordered.map((r) => {
            const original = r.isDuplicateOf ? reviewById(r.isDuplicateOf) : undefined;
            return (
              <li key={r.id}>
                <article
                  className={`rounded-2xl border p-5 md:p-6 space-y-4 ${
                    r.isDuplicateOf ? "border-dashed border-line bg-panel2/50" : "border-line bg-panel"
                  }`}
                >
                  <header className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[14px]">
                    <span className="font-medium text-ink">{r.procedure?.en ?? r.procedureRaw}</span>
                    <span className="text-dim" aria-hidden>·</span>
                    <span className="text-muted">{r.sourceLabel}</span>
                    <span className="text-dim" aria-hidden>·</span>
                    <time dateTime={r.postedAt} className="text-muted">{formatDate(r.postedAt)}</time>
                    <span className="grow" />
                    {r.isDuplicateOf ? (
                      <Pill>Repost, not counted</Pill>
                    ) : (
                      <Band band={r.credibility.band} />
                    )}
                  </header>

                  {r.isDuplicateOf && original && (
                    <p className="text-[14px] text-muted">
                      The same review was posted earlier on {original.sourceLabel} on{" "}
                      {formatDate(original.postedAt)}. We count it once.
                    </p>
                  )}

                  <blockquote
                    className={`text-[17px] leading-relaxed border-l-[3px] pl-4 ${
                      r.isDuplicateOf ? "text-muted border-line" : "text-ink border-accent/40"
                    }`}
                  >
                    {r.en}
                  </blockquote>

                  {(r.statedPriceKrw !== null || r.monthsPostOp !== null) && (
                    <div className="flex flex-wrap gap-2 text-[14px]">
                      {r.statedPriceKrw !== null && (
                        <Pill>
                          Paid {krw(r.statedPriceKrw)} (≈{usd(r.statedPriceKrw)})
                        </Pill>
                      )}
                      {r.monthsPostOp !== null && (
                        <Pill>
                          Written {r.monthsPostOp} {r.monthsPostOp === 1 ? "month" : "months"} after the procedure
                        </Pill>
                      )}
                    </div>
                  )}

                  {!r.isDuplicateOf && (
                    <div className="flex items-center gap-3 max-w-md">
                      <span className="text-[14px] text-muted shrink-0">Credibility</span>
                      <Meter value={r.credibility.score} label={`Credibility ${r.credibility.score} of 100`} />
                      <span className="num text-[15px] font-semibold w-8 text-right">{r.credibility.score}</span>
                    </div>
                  )}

                  <details className="group rounded-xl bg-panel2/60 px-4 py-3 text-[15px]">
                    <summary className="cursor-pointer select-none font-medium text-accent list-none [&::-webkit-details-marker]:hidden flex items-center gap-2">
                      <Plus aria-hidden className="size-4 group-open:hidden" />
                      <Minus aria-hidden className="size-4 hidden group-open:block" />
                      Why this score, and the Korean original
                    </summary>
                    <div className="mt-3 space-y-4">
                      <ul className="space-y-1.5">
                        {r.credibility.signals.map((s, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span
                              className={`num text-[13px] font-semibold rounded-md px-1.5 py-0.5 shrink-0 w-11 text-center ${
                                s.weight < 0 ? "bg-bad-soft text-bad" : "bg-good-soft text-good"
                              }`}
                            >
                              {s.weight > 0 ? `+${s.weight}` : s.weight}
                            </span>
                            <span className="text-ink">
                              {s.label}
                              <span className="ko text-dim text-[14px] ml-2">“{s.evidence}”</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div>
                        <div className="text-[13px] font-medium text-muted mb-1">Original Korean</div>
                        <p lang="ko" className="ko text-[15px] leading-relaxed text-muted">{r.ko}</p>
                      </div>
                    </div>
                  </details>
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <details className="group rounded-2xl border border-line bg-panel px-5 py-4">
          <summary className="cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden flex items-center gap-2 font-serif text-[20px] text-ink">
            <Plus aria-hidden className="size-4 text-accent group-open:hidden" />
            <Minus aria-hidden className="size-4 text-accent hidden group-open:block" />
            How we matched this clinic&apos;s name
            <span className="font-sans text-[14px] text-dim">
              {clinic.variants.length} spellings found
            </span>
          </summary>
          <p className="mt-2 text-[15px] text-muted">
            Reviewers write clinic names in different ways. We strip out the clinic type and
            branch, then match what remains.
          </p>
          <ul className="mt-3 divide-y divide-line">
            {clinic.variants.map((v) => (
              <li key={v.raw} className="py-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span lang="ko" className="ko text-[16px] text-ink">{v.raw}</span>
                <span className="text-[14px] text-muted">
                  {v.steps.length ? v.steps.join(" · ") : "already in its simplest form"}
                  <span className="text-dim">
                    {" "}→ <span className="ko">{v.base}</span>
                    {brandEn(v.base) && ` (${brandEn(v.base)})`}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      </section>
    </div>
  );
}
