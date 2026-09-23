import type { Metadata } from "next";
import Link from "next/link";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { KRW_PER_USD } from "@/lib/pipeline";
import "./globals.css";

const body = Source_Sans_3({ subsets: ["latin"], variable: "--font-body" });
const display = Source_Serif_4({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Gangnam Evidence Explorer",
  description:
    "Compare Gangnam cosmetic-surgery clinics using translated Korean patient reviews, with paid and duplicate reviews set aside and every claim linked to its source.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>
        <header className="border-b border-line sticky top-0 z-20 bg-panel/90 backdrop-blur">
          <div className="mx-auto max-w-5xl px-4 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="font-serif text-[19px] font-semibold tracking-tight text-ink whitespace-nowrap">
              Gangnam <span className="text-accent">Evidence</span>
            </Link>
            <nav className="flex items-center gap-1 text-[15px]">
              <Link href="/" className="px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-panel2 transition-colors">
                Clinics
              </Link>
              <Link href="/pipeline" className="px-3 py-2 rounded-lg text-muted hover:text-ink hover:bg-panel2 transition-colors">
                <span className="sm:hidden">Method</span>
                <span className="hidden sm:inline">How we check reviews</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
        <footer className="border-t border-line mt-16 bg-panel">
          <div className="mx-auto max-w-5xl px-4 py-8 grid gap-4 md:grid-cols-2 text-[14px] text-muted leading-relaxed">
            <p>
              <span className="font-medium text-ink">This is not medical advice.</span> Reviews
              describe individual experiences. Discuss risks, recovery and the surgeon&apos;s
              credentials with a qualified doctor before booking.
            </p>
            <p>
              Demonstration build: the reviews are a hand-written sample modelled on real
              Korean review patterns, not live data. Prices are what reviewers said they
              paid, not quotes. USD is approximate at ₩{KRW_PER_USD.toLocaleString("en-US")} = $1.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
