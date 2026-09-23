import { bandFor } from "@/lib/credibility";
import type { ReviewOutcome } from "@/lib/pipeline";

/** Reader-facing wording for each credibility band; the pipeline's band ids stay unchanged. */
const BAND_COPY: Record<string, { label: string; tone: string }> = {
  "Likely first-hand": { label: "Reads as a genuine patient", tone: "text-good bg-good-soft border-good/25" },
  "Mixed signals": { label: "Mixed signals", tone: "text-warn bg-warn-soft border-warn/25" },
  "Likely incentivised": { label: "Likely paid or sponsored", tone: "text-bad bg-bad-soft border-bad/25" },
};

export function Band({ band }: { band: string }) {
  const b = BAND_COPY[band] ?? BAND_COPY["Mixed signals"];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-medium whitespace-nowrap ${b.tone}`}>
      {b.label}
    </span>
  );
}

const BAR_TONE = { "Likely first-hand": "bg-good", "Mixed signals": "bg-warn", "Likely incentivised": "bg-bad" };

export function Meter({ value, label }: { value: number; label?: string }) {
  return (
    <div
      className="h-2 w-full rounded-full bg-panel2 overflow-hidden"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label ?? "Credibility score"}
    >
      <div className={`h-full rounded-full ${BAR_TONE[bandFor(value)]}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-5 py-4">
      <div className="font-serif text-3xl num text-ink">{value}</div>
      <div className="mt-1 text-[15px] font-medium text-ink">{label}</div>
      {sub && <div className="text-[13px] text-dim mt-0.5">{sub}</div>}
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-panel2 px-2.5 py-0.5 text-[13px] text-muted">
      {children}
    </span>
  );
}

/**
 * One review as a mark. Red/green alone fails deuteranopia separation (ΔE 5.7), so each
 * outcome also has its own shape: filled disc, struck-through ring, dashed ring.
 */
export function ReviewDot({ outcome, title, size = 14 }: { outcome: ReviewOutcome; title?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" className="shrink-0" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      {outcome === "used" && <circle cx="7" cy="7" r="6" className="fill-good" />}
      {outcome === "paid" && (
        <>
          <circle cx="7" cy="7" r="5.25" fill="none" strokeWidth="1.5" className="stroke-bad" />
          <line x1="3.3" y1="10.7" x2="10.7" y2="3.3" strokeWidth="1.5" className="stroke-bad" />
        </>
      )}
      {outcome === "repost" && (
        <circle cx="7" cy="7" r="5.25" fill="none" strokeWidth="1.5" strokeDasharray="2.2 1.8" className="stroke-dim" />
      )}
    </svg>
  );
}

export const OUTCOME_LABEL: Record<ReviewOutcome, string> = {
  used: "Used for prices",
  repost: "Repost, counted once",
  paid: "Likely paid, set aside",
};

export function DotLegend() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
      {(Object.keys(OUTCOME_LABEL) as ReviewOutcome[]).map((o) => (
        <li key={o} className="inline-flex items-center gap-1.5">
          <ReviewDot outcome={o} size={12} />
          {OUTCOME_LABEL[o]}
        </li>
      ))}
    </ul>
  );
}

/** Brand initials in a soft tile — gives each clinic a recognisable mark without a logo. */
export function Monogram({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const brand = name.split(/ (Plastic Surgery|Clinic|Dermatology|Hospital)|,/)[0];
  const initials = brand.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const dims = size === "lg" ? "size-16 text-[26px] rounded-2xl" : "size-12 text-[19px] rounded-xl";
  return (
    <div aria-hidden className={`${dims} shrink-0 bg-accent text-white font-serif flex items-center justify-center`}>
      {initials || name.slice(0, 1)}
    </div>
  );
}
