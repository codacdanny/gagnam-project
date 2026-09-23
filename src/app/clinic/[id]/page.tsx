import Link from "next/link";
import { notFound } from "next/navigation";
import { PIPELINE, brandEn, getClinic, krw, usd } from "@/lib/pipeline";
import { Band, Meter, Pill, Stat } from "@/components/ui";

export function generateStaticParams() {
  return PIPELINE.clinics.map((c) => ({ id: c.id }));
}

export default async function ClinicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const clinic = getClinic(id);
  if (!clinic) notFound();

  const ordered = [...clinic.reviews].sort((a, b) => {
    if (!!a.isDuplicateOf !== !!b.isDuplicateOf) return a.isDuplicateOf ? 1 : -1;
    return b.credibility.score - a.credibility.score;
  });

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-[13px] text-dim hover:text-ink transition">
          ← All clinics
        </Link>
        <h1 className="text-[26px] font-semibold tracking-tight mt-2">{clinic.nameEn}</h1>
        <div className="text-[13px] text-dim mt-1">
          Korean name <span className="ko text-muted">{clinic.canonicalName}</span>
          <span className="mx-2">·</span>
          use this when searching or booking locally
        </div>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Counted reviews" value={String(clinic.counted.length)} sub={`of ${clinic.naiveReviewCount} ingested`} />
        <Stat label="Median credibility" value={String(clinic.medianCredibility)} sub="0–100" />
        <Stat label="Sources" value={String(clinic.sources.length)} />
        <Stat label="Flagged incentivised" value={`${Math.round(clinic.incentivisedShare * 100)}%`} />
      </section>

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">Name variants resolved to this clinic</h2>
        <div className="rounded-xl border border-line bg-panel divide-y divide-line">
          {clinic.variants.map((v) => (
            <div key={v.raw} className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <span className="ko text-[14px]">{v.raw}</span>
              <div className="flex items-center gap-3 text-[12px]">
                <span className="text-dim">
                  {v.steps.length ? v.steps.join(" · ") : "canonical form"}
                </span>
                <span className="mono text-muted">
                  base <span className="ko text-ink">{v.base}</span>
                  {brandEn(v.base) && <span className="text-dim"> ({brandEn(v.base)})</span>}
                </span>
                <span className="mono text-accent w-12 text-right">{v.score.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {clinic.prices.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[15px] font-semibold">
            Reported prices{" "}
            <span className="font-normal text-dim text-[13px]">
              — from counted reviews only; what patients said they paid, not a quote
            </span>
          </h2>
          <div className="rounded-xl border border-line bg-panel overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="text-[11px] uppercase tracking-wider text-dim bg-panel2">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Procedure</th>
                  <th className="text-right font-medium px-4 py-2">Reports</th>
                  <th className="text-right font-medium px-4 py-2">Median (USD approx.)</th>
                  <th className="text-right font-medium px-4 py-2">Median (KRW)</th>
                  <th className="text-right font-medium px-4 py-2">Range (KRW)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {clinic.prices.map((p) => (
                  <tr key={p.procedureId}>
                    <td className="px-4 py-2.5">{p.procedureEn}</td>
                    <td className="px-4 py-2.5 text-right mono text-muted">{p.n}</td>
                    <td className="px-4 py-2.5 text-right mono">≈{usd(p.medianKrw)}</td>
                    <td className="px-4 py-2.5 text-right mono text-muted">{krw(p.medianKrw)}</td>
                    <td className="px-4 py-2.5 text-right mono text-muted">
                      {p.minKrw === p.maxKrw ? "—" : `${krw(p.minKrw)}–${krw(p.maxKrw)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-[15px] font-semibold">
          Evidence{" "}
          <span className="font-normal text-dim text-[13px]">
            — every English translation shown beside the Korean original it came from
          </span>
        </h2>

        <div className="space-y-3">
          {ordered.map((r) => (
            <article
              key={r.id}
              className={`rounded-xl border bg-panel p-4 space-y-3 ${
                r.isDuplicateOf ? "border-line/60 opacity-55" : "border-line"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <Pill>{r.sourceLabel}</Pill>
                <Pill>{r.procedure?.en ?? r.procedureRaw}</Pill>
                <span className="text-dim mono">{r.postedAt}</span>
                <span className="text-dim mono">{r.authorHandle}</span>
                <span className="grow" />
                {r.isDuplicateOf ? (
                  <span className="text-[11px] text-dim">
                    suppressed — near-duplicate of{" "}
                    <span className="mono">{r.isDuplicateOf}</span>
                  </span>
                ) : (
                  <Band band={r.credibility.band} />
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <p className="text-[13.5px] leading-relaxed">{r.en}</p>
                <p className="ko text-[13px] leading-relaxed text-muted border-l-2 border-line pl-3">
                  {r.ko}
                </p>
              </div>

              <div className="pt-1 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] uppercase tracking-wider text-dim shrink-0">
                    credibility
                  </span>
                  <Meter value={r.credibility.score} />
                  <span className="mono text-[12px] w-7 text-right">{r.credibility.score}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {r.credibility.signals.map((s, i) => (
                    <span
                      key={i}
                      className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-0.5 text-[11px] ${
                        s.weight < 0
                          ? "border-bad/25 bg-bad/5 text-bad"
                          : "border-accent/25 bg-accent/5 text-accent"
                      }`}
                      title={`matched: ${s.evidence}`}
                    >
                      <span className="mono">{s.weight > 0 ? `+${s.weight}` : s.weight}</span>
                      {s.label}
                      <span className="ko opacity-60">“{s.evidence}”</span>
                    </span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
