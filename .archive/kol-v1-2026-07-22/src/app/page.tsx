import Link from "next/link";

/**
 * App-chrome landing stub — KOL's own UI (fixed sunbaked identity, D15a).
 * The real discovery feed is Phase 5; this page exists so the scaffold has
 * a front door and points reviewers at /preview.
 */
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-page flex-col justify-center gap-[var(--space-4)] px-[var(--space-2)] md:px-[var(--space-6)]">
      <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
        KOL · component-library shell
      </p>
      <h1 className="max-w-[16ch] font-display text-display-hero [text-wrap:balance]">
        Every shop is a maker&rsquo;s world.
      </h1>
      <p className="max-w-measure text-body-lg text-muted">
        The discovery feed lands in Phase 5. Until then, the coded block library, both theme
        paths, and all four block states live behind the preview route.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/preview"
          className="inline-flex min-h-11 items-center rounded-pill bg-accent px-6 py-2.5 font-medium text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
        >
          Open /preview
        </Link>
        <Link
          href="/preview?fixture=custom"
          className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-6 py-2.5 text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
        >
          Custom-brand world
        </Link>
      </div>
    </main>
  );
}
