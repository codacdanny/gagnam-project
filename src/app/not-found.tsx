import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl py-16 space-y-4">
      <p className="text-[14px] font-medium text-accent">Page not found</p>
      <h1 className="font-serif text-[36px] leading-tight text-ink">We don&apos;t have a clinic at this address.</h1>
      <p className="text-[17px] text-muted">
        The link may be out of date. Every clinic we cover is listed on the home page.
      </p>
      <Link
        href="/"
        className="inline-flex items-center min-h-11 rounded-full bg-accent px-5 text-[16px] font-medium text-white hover:bg-ink transition-colors"
      >
        See all clinics
      </Link>
    </div>
  );
}
