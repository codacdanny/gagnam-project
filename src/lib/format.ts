// Display formatters. Kept free of pipeline imports so client components can use them
// without pulling the corpus into the browser bundle.

/** Western notation, not the Korean 만 (10,000) unit: ₩4.4M, ₩450K. */
export function krw(n: number): string {
  if (n >= 1_000_000) return `₩${(n / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 2 })}M`;
  if (n >= 1_000) return `₩${Math.round(n / 1000).toLocaleString("en-US")}K`;
  return `₩${n.toLocaleString("en-US")}`;
}

/** Fixed indicative rate — stated as such wherever USD is shown. */
export const KRW_PER_USD = 1380;

export function usd(n: number): string {
  return `$${(Math.round(n / KRW_PER_USD / 10) * 10).toLocaleString("en-US")}`;
}

/** 2026-03-14 → "14 Mar 2026". UTC so server and client render the same string. */
export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  });
}
