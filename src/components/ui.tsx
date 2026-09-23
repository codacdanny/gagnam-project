export function Band({ band }: { band: string }) {
  const tone =
    band === "Likely first-hand" ? "text-accent border-accent/30 bg-accent/10"
    : band === "Mixed signals" ? "text-warn border-warn/30 bg-warn/10"
    : "text-bad border-bad/30 bg-bad/10";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {band}
    </span>
  );
}

export function Meter({ value }: { value: number }) {
  const tone = value >= 70 ? "bg-accent" : value >= 40 ? "bg-warn" : "bg-bad";
  return (
    <div className="h-1.5 w-full rounded-full bg-line overflow-hidden">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-dim">{label}</div>
      <div className="mt-1 text-2xl font-semibold mono tracking-tight">{value}</div>
      {sub && <div className="text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-panel2 px-2 py-0.5 text-[11px] text-muted">
      {children}
    </span>
  );
}
