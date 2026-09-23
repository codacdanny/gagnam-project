"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { krw, usd } from "@/lib/format";
import type { ReviewOutcome } from "@/lib/pipeline";
import { Band, DotLegend, Meter, Monogram, ReviewDot } from "@/components/ui";

export interface ExplorerPrice {
  procedureId: string;
  procedureEn: string;
  n: number;
  medianKrw: number;
  minKrw: number;
  maxKrw: number;
}

export interface ExplorerClinic {
  id: string;
  nameEn: string;
  canonicalName: string;
  sourceCount: number;
  medianCredibility: number;
  band: string;
  used: number;
  total: number;
  paid: number;
  reposts: number;
  reviews: { id: string; outcome: ReviewOutcome; title: string }[];
  prices: ExplorerPrice[];
  procedureIds: string[];
}

export interface ExplorerProcedure {
  id: string;
  en: string;
}

export function ClinicExplorer({ clinics, procedures }: { clinics: ExplorerClinic[]; procedures: ExplorerProcedure[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const shownProcedures = selected ? procedures.filter((p) => p.id === selected) : procedures;
  const shownClinics = selected ? clinics.filter((c) => c.procedureIds.includes(selected)) : clinics;
  const selectedName = procedures.find((p) => p.id === selected)?.en;

  return (
    <div className="space-y-14">
      <section id="prices" aria-labelledby="prices-heading" className="space-y-5 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="prices-heading" className="font-serif text-[30px] leading-tight text-ink">Compare prices</h2>
            <p className="text-[15px] text-muted mt-1">
              Typical price patients reported, from reviews that passed our checks. The thin line
              shows the lowest to highest price reported.
            </p>
          </div>
        </div>

        <div role="group" aria-label="Filter by procedure" className="flex flex-wrap gap-2">
          <FilterChip active={selected === null} onClick={() => setSelected(null)}>
            All procedures
          </FilterChip>
          {procedures.map((p) => (
            <FilterChip key={p.id} active={selected === p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}>
              {p.en}
            </FilterChip>
          ))}
        </div>

        <div className={`grid gap-4 ${selected ? "" : "md:grid-cols-2"}`}>
          {shownProcedures.map((p) => (
            <PriceChart key={p.id} procedure={p} clinics={clinics} />
          ))}
        </div>
      </section>

      <section id="clinics" aria-labelledby="clinics-heading" className="space-y-5 scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="clinics-heading" className="font-serif text-[30px] leading-tight text-ink">
              {selectedName ? `Clinics offering ${selectedName.toLowerCase()}` : "Clinics"}
            </h2>
            <p className="text-[15px] text-muted mt-1">
              {shownClinics.length} {shownClinics.length === 1 ? "clinic" : "clinics"}, ordered by
              the number of reviews used. Each dot is one review.
            </p>
          </div>
          <DotLegend />
        </div>

        {shownClinics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-panel px-6 py-10 text-center">
            <p className="text-ink font-medium">No clinic has a checked review for this procedure yet.</p>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-3 text-[15px] font-medium text-accent hover:underline"
            >
              Show all clinics
            </button>
          </div>
        ) : (
          <ul className="space-y-4">
            {shownClinics.map((c) => (
              <li key={c.id}>
                <ClinicCard clinic={c} highlight={selected} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 text-[15px] transition-colors ${
        active
          ? "bg-ink text-white border-ink"
          : "bg-panel text-muted border-line hover:border-accent/50 hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function PriceChart({ procedure, clinics }: { procedure: ExplorerProcedure; clinics: ExplorerClinic[] }) {
  const rows = clinics
    .flatMap((c) => {
      const p = c.prices.find((x) => x.procedureId === procedure.id);
      return p ? [{ clinic: c, price: p }] : [];
    })
    .sort((a, b) => a.price.medianKrw - b.price.medianKrw);
  if (!rows.length) return null;

  // Each chart has its own zero-based scale: an injectable and a rhinoplasty differ ~20x.
  const max = Math.max(...rows.map((r) => r.price.maxKrw)) * 1.04;
  const pct = (v: number) => `${(v / max) * 100}%`;
  // Drop the branch suffix to save width, unless two branches of one brand share this chart.
  const short = (name: string) => name.split(",")[0];
  const label = (name: string) =>
    rows.filter((r) => short(r.clinic.nameEn) === short(name)).length > 1 ? name : short(name);

  return (
    <figure className="rounded-2xl border border-line bg-panel p-5">
      <figcaption className="flex items-baseline justify-between gap-3 mb-4">
        <span className="font-serif text-[20px] text-ink">{procedure.en}</span>
        <span className="text-[13px] text-dim">
          {rows.length} {rows.length === 1 ? "clinic" : "clinics"}
        </span>
      </figcaption>
      <ul className="space-y-1">
        {rows.map(({ clinic, price }) => {
          const detail = `${clinic.nameEn}: typical ${krw(price.medianKrw)} (≈${usd(price.medianKrw)})${
            price.minKrw !== price.maxKrw ? `, range ${krw(price.minKrw)}–${krw(price.maxKrw)}` : ""
          }, from ${price.n} ${price.n === 1 ? "review" : "reviews"}`;
          return (
            <li key={clinic.id}>
              <Link
                href={`/clinic/${clinic.id}`}
                title={detail}
                aria-label={detail}
                className="group grid grid-cols-[minmax(0,9rem)_1fr_4.5rem] sm:grid-cols-[minmax(0,11rem)_1fr_5rem] items-center gap-3 rounded-lg px-2 py-2 -mx-2 hover:bg-panel2 transition-colors"
              >
                <span className="truncate text-[14px] text-ink group-hover:text-accent transition-colors">
                  {label(clinic.nameEn)}
                </span>
                <span className="relative h-5">
                  <span
                    aria-hidden
                    className="absolute top-1/2 h-px -translate-y-1/2 bg-dim/60"
                    style={{ left: pct(price.minKrw), width: `calc(${pct(price.maxKrw)} - ${pct(price.minKrw)})` }}
                  />
                  <span
                    aria-hidden
                    className={`absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-r-[4px] transition-colors ${
                      price.n === 1
                        ? "bg-accent/20 border border-dashed border-accent/70"
                        : "bg-accent/85 group-hover:bg-accent"
                    }`}
                    style={{ width: pct(price.medianKrw) }}
                  />
                </span>
                <span className="text-right text-[14px] font-semibold num text-ink">{usd(price.medianKrw)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {rows.some((r) => r.price.n === 1) && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-dim">
          <span aria-hidden className="inline-block h-2.5 w-5 rounded-r-[3px] bg-accent/20 border border-dashed border-accent/70" />
          Based on a single review, so treat it as one data point
        </p>
      )}
    </figure>
  );
}

function ClinicCard({ clinic: c, highlight }: { clinic: ExplorerClinic; highlight: string | null }) {
  const setAside = [
    c.paid > 0 && `${c.paid} likely paid`,
    c.reposts > 0 && `${c.reposts} ${c.reposts === 1 ? "repost" : "reposts"}`,
  ].filter(Boolean);

  return (
    <Link
      href={`/clinic/${c.id}`}
      className="group block rounded-2xl border border-line bg-panel p-5 md:p-6 shadow-[0_1px_2px_rgba(29,42,46,0.04)] hover:border-accent/40 hover:shadow-[0_8px_24px_-12px_rgba(14,107,107,0.25)] transition-[border-color,box-shadow]"
    >
      <div className="flex flex-col md:flex-row md:items-start gap-6">
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-start gap-4">
            <Monogram name={c.nameEn} />
            <div className="min-w-0">
              <h3 className="font-serif text-[22px] leading-snug text-ink group-hover:text-accent transition-colors">
                {c.nameEn}
              </h3>
              <p className="text-[14px] text-dim mt-0.5">
                <span lang="ko" className="ko">{c.canonicalName}</span>
                <span className="mx-2" aria-hidden>·</span>
                {c.sourceCount} review {c.sourceCount === 1 ? "site" : "sites"}
              </p>
            </div>
          </div>

          {c.prices.length > 0 ? (
            <dl className="grid gap-2 grid-cols-2 lg:grid-cols-3">
              {c.prices.map((p) => (
                <div
                  key={p.procedureId}
                  className={`rounded-xl px-4 py-3 ${
                    highlight === p.procedureId ? "bg-accent-soft ring-1 ring-accent/30" : "bg-panel2/70"
                  }`}
                >
                  <dt className="text-[14px] text-muted">{p.procedureEn}</dt>
                  <dd className="mt-0.5">
                    <span className="text-[20px] font-semibold num text-ink">≈{usd(p.medianKrw)}</span>
                    <span className="ml-2 text-[13px] text-dim num">{krw(p.medianKrw)}</span>
                    <div className="text-[13px] text-dim">
                      {p.n} {p.n === 1 ? "review" : "reviews"}
                    </div>
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[15px] text-muted">No reviews with a stated price passed our checks yet.</p>
          )}
        </div>

        <div className="md:w-60 shrink-0 space-y-3 md:border-l md:border-line md:pl-6">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[14px] text-muted">Credibility</span>
              <span className="font-serif text-[28px] leading-none num text-ink">{c.medianCredibility}</span>
            </div>
            <div className="mt-2">
              <Meter value={c.medianCredibility} label={`Median credibility ${c.medianCredibility} of 100`} />
            </div>
          </div>
          <Band band={c.band} />
          <div>
            <div className="flex flex-wrap gap-1" aria-label={`${c.used} of ${c.total} reviews used`}>
              {c.reviews.map((r) => (
                <ReviewDot key={r.id} outcome={r.outcome} title={r.title} />
              ))}
            </div>
            <p className="text-[14px] text-muted mt-1.5">
              <span className="font-medium text-ink">{c.used} of {c.total}</span> reviews used
              {setAside.length > 0 && <span className="text-dim"> · {setAside.join(", ")}</span>}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-[14px] font-medium text-accent">
            Read the reviews
            <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </span>
        </div>
      </div>
    </Link>
  );
}
