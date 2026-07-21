"use client";

/**
 * /me/collections — Boards index, owner view (B17).
 * Mirrors docs/10-page-mockups/collections.html.
 *
 * Highest flattening risk in the product: a board is, by nature, a grid of
 * saved things stripped of their maker. We refuse that — every thumb is
 * maker-attributed and on film, and the layout is mixed-size (no uniform
 * product grid anywhere on this page).
 */

import Link from "next/link";
import { useState } from "react";
import { Film, type FilmVariant } from "@/components/chrome/Film";
import { collections, getMaker, getProduct, type MockCollection } from "@/lib/mock/db";
import { useKolSession } from "@/lib/mock/session";

type Visibility = "public" | "private";

/** resolve a board item to its film treatment — the maker never drops off */
function itemFilm(item: MockCollection["items"][number]): {
  variant: FilmVariant;
  craft: string;
  name: string;
} {
  if (item.kind === "product") {
    const p = getProduct(item.ref);
    const m = p ? getMaker(p.makerSlug) : undefined;
    return {
      variant: p?.filmClass ?? "v1",
      craft: m ? `${m.name} · ${m.craft}` : "",
      name: p?.title ?? item.ref,
    };
  }
  const m = getMaker(item.ref);
  return { variant: m?.filmClass ?? "v1", craft: m?.craft ?? "", name: m?.name ?? item.ref };
}

function makerCount(c: MockCollection): number {
  const slugs = new Set(
    c.items.map((it) =>
      it.kind === "maker" ? it.ref : (getProduct(it.ref)?.makerSlug ?? it.ref),
    ),
  );
  return slugs.size;
}

/* deliberately mixed spans — two boards, two different widths */
const BOARD_SPANS = ["md:col-span-7", "md:col-span-5"];

export default function CollectionsPage() {
  const session = useKolSession();
  const [visibility, setVisibility] = useState<Record<string, Visibility>>(() =>
    Object.fromEntries(collections.map((c) => [c.slug, c.visibility])),
  );
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const savedMakers = session.follows.flatMap((slug) => {
    const m = getMaker(slug);
    return m ? [m] : [];
  });

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/c/${slug}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopiedSlug(slug);
        window.setTimeout(() => setCopiedSlug((s) => (s === slug ? null : s)), 2000);
      }
    } catch {
      /* clipboard unavailable — the link stays visible to copy by hand */
    }
  };

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)]">
      {/* ---- header + the anti-flattening designer's note, made visible ---- */}
      <header className="pt-[var(--space-8)]">
        <p className="text-caption uppercase text-muted">Saved · Collections</p>
        <h1 className="mt-2 max-w-measure font-display text-display text-ink">
          Boards that keep the maker.
        </h1>
        <div className="mt-[var(--space-4)] rounded-lg bg-block-a p-[var(--space-6)] text-on-block-a md:px-[var(--space-8)]">
          <p className="text-caption uppercase opacity-80">
            Designer&rsquo;s note · the highest flattening risk in the product
          </p>
          <p className="mt-2 max-w-measure text-body-lg">
            A board is, by nature, a grid of saved things stripped of their maker. We refuse
            that here. Every item is a <b>maker-attributed card</b> that opens the maker&rsquo;s
            world. Saved <b>makers</b> appear on film, moving — never an avatar tile. The layout
            is deliberately mixed-size: <b>there is no uniform product grid anywhere on this
            page.</b>
          </p>
        </div>
      </header>

      {/* ---- owner's boards index ---- */}
      <section aria-label="Your boards" className="pt-[var(--space-8)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-h1 text-ink">
            Your boards{" "}
            <span className="text-caption normal-case tracking-normal text-muted">
              — only you can see this page
            </span>
          </h2>
          {/* decorative in this prototype — creation is a live-build concern */}
          <button
            type="button"
            className="inline-flex min-h-11 items-center rounded-pill bg-accent px-5 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
          >
            ＋ New board
          </button>
        </div>

        <div className="mt-[var(--space-4)] grid grid-cols-1 gap-5 md:grid-cols-12">
          {collections.map((board, i) => {
            const vis = visibility[board.slug] ?? board.visibility;
            const isPublic = vis === "public";
            const thumbs = board.items.slice(0, 2).map(itemFilm);
            return (
              <div
                key={board.slug}
                className={`overflow-hidden rounded-lg border border-line bg-surface shadow-card ${
                  BOARD_SPANS[i % BOARD_SPANS.length] ?? "md:col-span-6"
                }`}
              >
                {/* two small film thumbs — maker-attributed, on film */}
                <div className="flex gap-0.5">
                  {thumbs.map((t, j) => (
                    <div key={j} className="min-w-0 flex-1">
                      <Film
                        variant={t.variant}
                        aspect="square"
                        craft={t.craft}
                        title={t.name}
                        play={false}
                        rounded={false}
                        className="shadow-none"
                      />
                    </div>
                  ))}
                </div>

                <div className="p-[var(--space-3)]">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-h3 text-ink">{board.title}</h3>
                    <span
                      className={`rounded-pill border px-2.5 py-0.5 text-caption ${
                        isPublic
                          ? "border-accent bg-accent/10 text-ink"
                          : "border-line bg-ground text-muted"
                      }`}
                    >
                      {isPublic ? "Public" : "Private"}
                    </span>
                  </div>
                  <p className="mt-1 text-caption text-muted">
                    {board.items.length} items · {makerCount(board)}{" "}
                    {makerCount(board) === 1 ? "maker" : "makers"}
                  </p>

                  {/* visibility toggle — client state */}
                  <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) =>
                        setVisibility((v) => ({
                          ...v,
                          [board.slug]: e.target.checked ? "public" : "private",
                        }))
                      }
                      aria-label={`Make “${board.title}” public`}
                      className="h-6 w-6 accent-accent"
                    />
                    <span className="text-caption text-muted">Private ↔ Public</span>
                  </label>

                  {/* share affordance — public boards only */}
                  {isPublic && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-line bg-ground p-2.5">
                      <code className="min-w-0 flex-1 truncate font-mono text-caption text-muted">
                        /c/{board.slug}
                      </code>
                      <button
                        type="button"
                        onClick={() => void copyLink(board.slug)}
                        className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-3 text-caption uppercase text-ink transition-colors duration-state ease-kol hover:bg-ground"
                      >
                        {copiedSlug === board.slug ? "Copied ✓" : "Copy link"}
                      </button>
                      <Link
                        href={`/c/${board.slug}`}
                        className="inline-flex min-h-11 items-center text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
                      >
                        View as visitor →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- first-run empty state — designed specimen, shown in situ ---- */}
      <section aria-label="First-run empty state" className="pt-[var(--space-8)]">
        <p className="text-caption uppercase text-muted">
          First-run state — designed specimen (this is what a brand-new buyer sees)
        </p>
        <div className="mt-2 rounded-lg border border-dashed border-line bg-surface p-[var(--space-6)]">
          <h3 className="font-display text-h2 text-ink">Keep the makers you love together.</h3>
          <p className="mt-2 max-w-measure text-body text-muted">
            You haven&rsquo;t made a board yet. Start one from the makers and pieces
            you&rsquo;ve already saved — group them by a gift, a project, or the people you
            want to commission someday.
          </p>
          <p className="mt-4 text-caption uppercase text-muted">Ready to drop in — from your saves</p>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
            {(savedMakers.length > 0 ? savedMakers : []).slice(0, 3).map((m) => (
              <div key={m.slug} className="w-36 flex-none">
                <Film variant={m.filmClass} aspect="portrait" title={m.name} play={false} />
              </div>
            ))}
            {savedMakers.length === 0 && (
              <p className="text-body text-muted">
                Follow a maker or two and they line up here, on film, ready to board.
              </p>
            )}
          </div>
          {/* decorative — same live-build concern as “New board” above */}
          <button
            type="button"
            className="mt-4 inline-flex min-h-11 items-center rounded-pill bg-accent px-6 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
          >
            Create your first board
          </button>
        </div>
      </section>
    </main>
  );
}
