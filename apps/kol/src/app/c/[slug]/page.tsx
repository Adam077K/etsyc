"use client";

/**
 * /c/[slug] — Public shared board, visitor view (B17).
 * Mirrors the "View B" section of docs/10-page-mockups/collections.html.
 *
 * Anti-enumeration contract: in the real build the slug carries ≥96 bits of
 * entropy, and BOTH unknown and private boards return 404 — never 403 — so a
 * prober can't distinguish "doesn't exist" from "exists but private". The live
 * `getCollection(slug)` returns null under RLS for a missing OR private board,
 * which we map to `notFound()` all the same.
 *
 * Client component: it reads the LIVE data layer (getData → Supabase when env
 * is present, mock otherwise) inside a browser-only effect, so it must not
 * statically import the data seam (see src/app/page.tsx). An empty database has
 * no public boards, so every slug resolves to the shared 404.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Film, type FilmAspect } from "@/components/chrome/Film";
import { Skeleton } from "@/components/states/Skeleton";
import type { Collection, Maker, Product } from "@/lib/data";
import { formatPrice } from "@/lib/mock/db"; // pure formatter only

/* mixed-size cells — a shared board must never flatten into a uniform grid */
const PATTERN: { span: string; aspect: FilmAspect }[] = [
  { span: "md:col-span-7", aspect: "wide" },
  { span: "md:col-span-5", aspect: "square" },
  { span: "md:col-span-5", aspect: "portrait" },
  { span: "md:col-span-7", aspect: "wide" },
];

function boardMakerCount(board: Collection, products: Map<string, Product>): number {
  return new Set(
    board.items.map((it) =>
      it.kind === "maker" ? it.ref : (products.get(it.ref)?.makerSlug ?? it.ref),
    ),
  ).size;
}

type BoardState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "not-found" }
  | {
      status: "ready";
      board: Collection;
      makers: Map<string, Maker>;
      products: Map<string, Product>;
    };

function BoardLoading() {
  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-8)]">
      <Skeleton className="h-3 w-48" />
      <Skeleton className="mt-3 h-8 w-2/3" />
      <div className="mt-[var(--space-5)] grid grid-cols-1 gap-5 md:grid-cols-12" aria-hidden>
        {PATTERN.map((cell, i) => (
          <div key={i} className={cell.span}>
            <Skeleton className="h-48 rounded-md" />
            <Skeleton className="mt-2 h-3 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  );
}

function BoardView({ slug }: { slug: string }) {
  const [state, setState] = useState<BoardState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { getData } = await import("@/lib/data");
        const data = getData();
        const board = await data.getCollection(slug);
        if (!active) return;
        // Unknown slug → null. Private board → the SAME null under RLS (never a
        // 403): revealing that a private board exists would defeat the slug.
        if (!board || board.visibility === "private") {
          setState({ status: "not-found" });
          return;
        }
        const [makerList, productList] = await Promise.all([
          data.listMakers(),
          data.listProducts(),
        ]);
        if (!active) return;
        setState({
          status: "ready",
          board,
          makers: new Map(makerList.map((m) => [m.slug, m])),
          products: new Map(productList.map((p) => [p.id, p])),
        });
      } catch {
        if (active) setState({ status: "error" });
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (state.status === "loading") return <BoardLoading />;
  // notFound() renders the nearest not-found boundary (a 404 for the visitor).
  if (state.status === "not-found") notFound();
  if (state.status === "error") {
    return (
      <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-8)]">
        <div className="rounded-lg border border-line bg-surface px-6 py-12 text-center">
          <p className="text-caption uppercase text-muted">Couldn&rsquo;t load this board</p>
          <p className="mx-auto mt-2 max-w-measure text-body text-ink">
            Something went wrong reaching this board. Refresh the page to try again.
          </p>
        </div>
      </main>
    );
  }

  const { board, makers, products } = state;
  const makerCount = boardMakerCount(board, products);

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
              const m = makers.get(item.ref);
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

            const p = products.get(item.ref);
            if (!p) return null;
            const maker = makers.get(p.makerSlug);
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
                  <span className="text-body text-ink">
                    {formatPrice(p.priceMinor, p.currency)}
                  </span>
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

export default function PublicBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <BoardView slug={slug} />;
}
