import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gangnam Evidence Explorer",
  description:
    "Korean clinic reviews, resolved and graded: entity resolution, cross-source de-duplication and incentivised-review detection, with every claim traced to its Korean source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-line sticky top-0 z-20 bg-bg/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between gap-4">
            <Link href="/" className="font-semibold tracking-tight text-[15px]">
              Gangnam <span className="text-accent">Evidence</span> Explorer
            </Link>
            <nav className="flex items-center gap-1 text-[13px]">
              <Link href="/" className="px-3 py-1.5 rounded-md text-muted hover:text-ink hover:bg-panel transition">
                Clinics
              </Link>
              <Link href="/pipeline" className="px-3 py-1.5 rounded-md text-muted hover:text-ink hover:bg-panel transition">
                Pipeline
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-6xl px-4 py-6 text-[12px] text-dim leading-relaxed">
            Demonstration build. The corpus is a hand-authored fixture modelled on real
            Korean review patterns, not live scraped data — the pipeline that processes it
            is real and runs deterministically at build time. Prices are as stated by
            reviewers, not quotes. USD shown at a fixed indicative rate.
          </div>
        </footer>
      </body>
    </html>
  );
}
