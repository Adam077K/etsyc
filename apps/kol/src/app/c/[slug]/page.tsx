/**
 * /c/[slug] — Public shared board, visitor view (B17).
 * Mirrors the "View B" section of docs/10-page-mockups/collections.html.
 *
 * Anti-enumeration contract: in the real build the slug carries ≥96 bits of
 * entropy, and BOTH unknown and private boards return 404 — never 403 — so a
 * prober can't distinguish "doesn't exist" from "exists but private".
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { Film, type FilmAspect } from "@/components/chrome/Film";
import {
  collections,
  formatPrice,
  getMaker,
  getProduct,
  type MockCollection,
} from "@/lib/mock/db";

/* mixed-size cells — a shared board must never flatten into a uniform grid */
const PATTERN: { span: string; aspect: FilmAspect }[] = [
  { span: "md:col-span-7", aspect: "wide" },
  { span: "md:col-span-5", aspect: "square" },
  { span: "md:col-span-5", aspect: "portrait" },
  { span: "md:col-span-7", aspect: "wide" },
];

function boardMakerCount(board: MockCollection): number {
  return new Set(
    board.items.map((it) =>
      it.kind === "maker" ? it.ref : (getProduct(it.ref)?.makerSlug ?? it.ref),
    ),
  ).size;
}

export default async function PublicBoardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const board = collections.find((c) => c.slug === slug);

  // Unknown slug → 404. Private board → the SAME 404 (not 403): revealing
  // that a private board exists would defeat the high-entropy slug.
  if (!board || board.visibility === "private") notFound();

  const makerCount = boardMakerCount(board);

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)]">
      <header className="pt-[var(--space-8)]">
        <p className="text-caption uppercase text-muted">
          Public board · curated by a KOL buyer
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-display text-ink">{board.title}</h1>
            <p className="mt-1 text-body-lg text-muted">
              {board.items.length} items · {makerCount} {makerCount === 1 ? "maker" : "makers"} —
              every one opens a maker&rsquo;s world
            </p>
          </div>
        </div>
      </header>

      {/* visitor sees maker-attributed cards; makers on film; mixed sizes */}
      <section aria-label="Board items" className="pt-[var(--space-5)]">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {board.items.map((item, i) => {
            const cell = PATTERN[i % PATTERN.length] ?? {
              span: "md:col-span-6",
              aspect: "wide" as FilmAspect,
            };

            if (item.kind === "maker") {
              const m = getMaker(item.ref);
              if (!m) return null;
              return (
                <div key={`${item.kind}-${item.ref}`} className={cell.span}>
                  {/* a saved MAKER renders on film and opens their world */}
                  <Link href={`/m/${m.slug}`} className="block">
                    <Film
                      variant={m.filmClass}
                      aspect={cell.aspect}
                      craft={`${m.craft} · tap to open their world`}
                      title={m.name}
                    />
                  </Link>
                  <p className="mt-2 text-caption text-muted">
                    {m.craftLine} · {m.location}
                  </p>
                </div>
              );
            }

            const p = getProduct(item.ref);
            if (!p) return null;
            const maker = getMaker(p.makerSlug);
            return (
              <div key={`${item.kind}-${item.ref}`} className={cell.span}>
                <Link href={`/m/${p.makerSlug}/p/${p.id}`} className="block">
                  <Film
                    variant={p.filmClass}
                    aspect={cell.aspect}
                    craft={maker ? `${maker.name} · ${maker.craft}` : undefined}
                    title={p.title}
                  />
                </Link>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <span className="text-caption text-muted">
                    {item.note ? `“${item.note}”` : `by ${maker?.name ?? p.makerSlug}`}
                  </span>
                  <span className="text-body text-ink">{formatPrice(p.priceMinor, p.currency)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* footer CTA — the shared board is the invitation */}
      <section className="mt-[var(--space-10)] rounded-lg bg-block-a p-[var(--space-6)] text-on-block-a md:p-[var(--space-8)]">
        <p className="text-body-lg">
          New here? These are real makers you can hear and follow.
        </p>
        <Link
          href="/welcome"
          className="mt-4 inline-block rounded-pill bg-accent px-6 py-2.5 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
        >
          Start your own board on KOL
        </Link>
      </section>
    </main>
  );
}
