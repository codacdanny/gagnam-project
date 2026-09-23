/** Reader-facing wording for each credibility band; the pipeline's band ids stay unchanged. */
const BAND_COPY: Record<string, { label: string; tone: string }> = {
  "Likely first-hand": { label: "Reads as a genuine patient", tone: "text-good bg-good-soft border-good/25" },
  "Mixed signals": { label: "Mixed signals", tone: "text-warn bg-warn-soft border-warn/25" },
  "Likely incentivised": { label: "Likely paid or sponsored", tone: "text-bad bg-bad-soft border-bad/25" },
};

export function Band({ band }: { band: string }) {
  const b = BAND_COPY[band] ?? BAND_COPY["Mixed signals"];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[13px] font-medium ${b.tone}`}>
      {b.label}
    </span>
  );
}

export function scoreTone(value: number) {
  return value >= 70 ? "good" : value >= 40 ? "warn" : "bad";
}

export function Meter({ value, label }: { value: number; label?: string }) {
  const tone = { good: "bg-good", warn: "bg-warn", bad: "bg-bad" }[scoreTone(value)];
  return (
    <div
      className="h-2 w-full rounded-full bg-panel2 overflow-hidden"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label ?? "Credibility score"}
    >
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
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

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-accent-soft px-2.5 py-0.5 text-[13px] font-medium text-accent">
      {children}
    </span>
  );
}
