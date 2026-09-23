import Link from "next/link";
import { PIPELINE, formatDate, reviewById } from "@/lib/pipeline";
import { Pill } from "@/components/ui";

function Step({ n, title, summary, children }: { n: number; title: string; summary: string; children?: React.ReactNode }) {
  return (
    <section className="grid md:grid-cols-[3rem_1fr] gap-4" aria-labelledby={`step-${n}`}>
      <div
        aria-hidden
        className="size-10 rounded-full bg-accent-soft text-accent font-serif text-[20px] flex items-center justify-center"
      >
        {n}
      </div>
      <div className="space-y-4 min-w-0">
        <div>
          <h2 id={`step-${n}`} className="font-serif text-[26px] text-ink">{title}</h2>
          <p className="text-[17px] text-muted mt-1 max-w-3xl">{summary}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function Technical({ children }: { children: React.ReactNode }) {
  return (
    <details className="rounded-xl bg-panel2/60 px-4 py-3 text-[15px] text-muted max-w-3xl">
      <summary className="cursor-pointer select-none font-medium text-accent">Technical detail</summary>
      <div className="mt-2 leading-relaxed">{children}</div>
    </details>
  );
}

export default function PipelinePage() {
  const { stats, clusters, clinics, enriched } = PIPELINE;
  const flagged = enriched.filter((r) => r.credibility.band === "Likely incentivised");
  const clinicName = new Map(clinics.map((c) => [c.id, c.nameEn]));

  return (
    <div className="space-y-14">
      <section className="space-y-4 max-w-3xl">
        <p className="text-[14px] font-medium text-accent">Methodology</p>
        <h1 className="font-serif text-[32px] md:text-[40px] leading-[1.15] tracking-tight text-ink">
          How we check reviews
        </h1>
        <p className="text-[18px] text-muted leading-relaxed">
          Much of Korea&apos;s cosmetic-surgery review content is paid for by clinics. Translating
          it into confident English without checking would make adverts look like patient
          experience. So every review goes through four steps before any price is calculated,
          and each step is shown below with its results.
        </p>
        <p className="text-[15px] text-dim">
          The checks are rules, not AI guesses: the same reviews always give the same results.
        </p>
      </section>

      <Step
        n={1}
        title="Collect reviews"
        summary={`We gathered ${stats.rawReviews} reviews from ${stats.sources} Korean sites: Naver Blog, Naver Cafe, Babitalk and Gangnam Unni. Each is translated into English, with the Korean original kept alongside.`}
      />

      <Step
        n={2}
        title="Work out which clinic each review is about"
        summary={`Reviewers spell clinic names ${stats.surfaceNames} different ways — with or without “plastic surgery”, a branch name, or English branding. We matched them to ${stats.resolvedClinics} clinics.`}
      >
        <ul className="rounded-2xl border border-line bg-panel divide-y divide-line">
          {clinics.map((c) => (
            <li key={c.id} className="px-5 py-4">
              <Link href={`/clinic/${c.id}`} className="font-medium text-ink hover:text-accent transition-colors">
                {c.nameEn}
              </Link>
              <div className="mt-2 flex flex-wrap gap-2">
                {c.variants.map((v) => (
                  <span key={v.raw} lang="ko" className="ko rounded-full bg-panel2 px-3 py-0.5 text-[14px] text-muted">
                    {v.raw}
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
        <Technical>
          Names are stripped of clinic-type words (의원 / 성형외과 / 클리닉), branch names
          (강남점, 압구정) and spacing. English brandings are mapped through a hand-kept list,
          because romanising 더뷰티 gives “deobyuti”, not “THE BEAUTY”. What remains is compared
          by Sørensen–Dice similarity over character pairs, with a match threshold of 0.82.
        </Technical>
      </Step>

      <Step
        n={3}
        title="Remove reposted copies"
        summary={`The same review is often posted to several sites with small edits. Counting it twice would make one patient look like two. We found ${stats.duplicatesSuppressed} reposts and kept only the earliest version of each.`}
      >
        <ul className="space-y-4">
          {clusters.map((cl) => {
            const primary = reviewById(cl.primaryId)!;
            return (
              <li key={cl.primaryId} className="rounded-2xl border border-line bg-panel p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-[14px]">
                    <Pill>Kept</Pill>
                    <span className="text-muted">{primary.sourceLabel} · {formatDate(primary.postedAt)}</span>
                    <span className="text-dim">· {clinicName.get(primary.clinicId)}</span>
                  </div>
                  <blockquote className="border-l-[3px] border-accent/40 pl-4 text-ink">{primary.en}</blockquote>
                </div>
                {cl.duplicates.map((d) => {
                  const dup = reviewById(d.id)!;
                  return (
                    <div key={d.id} className="space-y-2 pl-4 md:pl-8">
                      <div className="flex flex-wrap items-center gap-2 text-[14px]">
                        <span className="rounded-full bg-bad-soft text-bad px-2.5 py-0.5 text-[13px] font-medium">Removed as repost</span>
                        <span className="text-muted">{dup.sourceLabel} · {formatDate(dup.postedAt)}</span>
                        <span className="text-dim num">· {Math.round(d.exact * 100)}% text overlap</span>
                      </div>
                      <blockquote className="border-l-[3px] border-line pl-4 text-muted">{dup.en}</blockquote>
                    </div>
                  );
                })}
              </li>
            );
          })}
        </ul>
        <Technical>
          Matching runs on the Korean text, not the translation, using 128-permutation MinHash
          over 4-character shingles, and only between reviews of the same clinic. The estimate
          is checked against exact Jaccard similarity; mean absolute error across all pairs is{" "}
          <span className="num text-ink">{stats.minhashMeanAbsError.toFixed(3)}</span>. Known
          reposts score 0.37–1.00 and unrelated reviews at most 0.019, so the 0.30 cut-off sits
          well inside the gap.
        </Technical>
      </Step>

      <Step
        n={4}
        title="Set aside reviews that look paid for"
        summary={`Korean clinics commonly run “review group” campaigns (체험단), sponsor posts (협찬) or pay writing fees (원고료). We score every review for these signs. ${stats.incentivisedFiltered} scored below 40 and are left out of all prices and counts — but they stay visible, with the reason.`}
      >
        <ul className="space-y-4">
          {flagged.map((r) => (
            <li key={r.id} className="rounded-2xl border border-bad/20 bg-panel p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[14px]">
                <span className="font-medium text-ink">{clinicName.get(r.clinicId)}</span>
                <span className="text-muted">· {r.sourceLabel}</span>
                <span className="grow" />
                <span className="rounded-full bg-bad-soft text-bad px-2.5 py-0.5 text-[13px] font-medium num">
                  Credibility {r.credibility.score} / 100
                </span>
              </div>
              <blockquote className="border-l-[3px] border-bad/30 pl-4 text-ink">{r.en}</blockquote>
              <div>
                <div className="text-[13px] font-medium text-muted mb-1.5">Why it was flagged</div>
                <ul className="flex flex-wrap gap-2">
                  {r.credibility.signals.filter((s) => s.weight < 0).map((s, i) => (
                    <li key={i} className="rounded-lg bg-bad-soft px-2.5 py-1 text-[14px] text-bad">
                      {s.label}
                    </li>
                  ))}
                </ul>
              </div>
              <details className="text-[14px]">
                <summary className="cursor-pointer select-none text-accent font-medium">Original Korean</summary>
                <p lang="ko" className="ko mt-2 text-muted leading-relaxed">{r.ko}</p>
              </details>
            </li>
          ))}
        </ul>
        <Technical>
          Scores start at 60. Disclosure language (원고료 / 협찬 / 체험단 / 무료로 제공받아) and
          marketing tells (booking handles, links, absolute claims, urgency, repeating the
          clinic&apos;s name) lower it. Details a real patient tends to include — a stated
          price, a recovery timeline, an admitted drawback — raise it. Every signal records the
          exact Korean words that triggered it.
        </Technical>
      </Step>
    </div>
  );
}
