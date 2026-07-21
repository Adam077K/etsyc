"use client";

/**
 * /m/[maker] — the maker world (B3 world-unfold + B4 store-scroll).
 *
 * Surface split (D15): the slim strip up top is KOL chrome (app palette,
 * never themed); everything below it belongs to the maker. For makers with
 * a store-config fixture the world renders through renderStore, which
 * applies the world's own theme at its root — this page never re-themes it.
 * Makers without a fixture (hasWorld: false) get an honest composed page
 * from db data, not a fake world.
 *
 * Client page pattern: React 19 `use(params)` unwraps the Next 16 params
 * Promise so session state (follow) and the unfold entrance live in one file.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Film } from "@/components/chrome/Film";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import {
  formatPrice,
  getMaker,
  productsByMaker,
  type MockMaker,
  type MockProduct,
} from "@/lib/mock/db";
import { useKolSession } from "@/lib/mock/session";
import { renderStore } from "@/lib/renderer/render-store";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { senaStore } from "@/lib/store-config/fixtures/sena";
import { cn } from "@/lib/utils";

export default function MakerWorldPage({
  params,
}: {
  params: Promise<{ maker: string }>;
}) {
  const { maker: slug } = use(params);
  const maker = getMaker(slug);
  if (!maker) notFound();

  const worldConfig =
    maker.slug === "sena" ? senaStore : maker.slug === "noor" ? customStore : null;

  return (
    <div className="min-h-screen">
      <MakerStrip maker={maker} showWorldLinks={maker.hasWorld} />
      {maker.hasWorld && worldConfig ? (
        <WorldUnfold>{renderStore(worldConfig, { state: "success" })}</WorldUnfold>
      ) : (
        <StubWorld maker={maker} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* KOL chrome strip — app palette, sits ABOVE the themed world root.   */
/* ------------------------------------------------------------------ */

function MakerStrip({
  maker,
  showWorldLinks,
}: {
  maker: MockMaker;
  showWorldLinks: boolean;
}) {
  const session = useKolSession();
  const following = session.isFollowing(maker.slug);

  return (
    <div className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-page flex-wrap items-center gap-x-[var(--space-3)] gap-y-2 px-[var(--space-2)] py-3 md:px-[var(--space-6)]">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <p className="font-display text-h3 text-ink">{maker.name}</p>
          <p className="text-caption uppercase tracking-[0.08em] text-muted">
            {maker.craft} · {maker.location}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {showWorldLinks ? (
            <>
              <PillLink href={`/m/${maker.slug}/community`}>Community</PillLink>
              <PillLink href={`/m/${maker.slug}/create`}>Co-create</PillLink>
              <PillLink href={`/m/${maker.slug}/live`}>Live</PillLink>
            </>
          ) : null}
          <button
            type="button"
            aria-pressed={following}
            onClick={() => session.toggleFollow(maker.slug)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-pill border px-5 text-body transition-colors duration-state ease-kol active:scale-[0.98]",
              following
                ? "border-transparent bg-ink text-ground"
                : "border-line bg-surface text-ink hover:bg-ground",
            )}
          >
            {following ? "Following" : "Follow"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PillLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-caption uppercase tracking-[0.04em] text-muted transition-colors duration-state ease-kol hover:text-ink"
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* World unfold — one world-level entrance (≤ --dur-unfold, cinematic  */
/* ease). Media-leads-text staggering lives inside the blocks; reduced */
/* motion is flattened by the global CSS override, no JS needed.       */
/* ------------------------------------------------------------------ */

function WorldUnfold({ children }: { children: React.ReactNode }) {
  const [unfolded, setUnfolded] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setUnfolded(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={cn(
        "transition-[opacity,transform] duration-unfold ease-cinematic",
        unfolded ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Stub world — honest composed page for makers still filming their    */
/* world (tomas, mira, elias). Built from db data only; no fake blocks.*/
/* ------------------------------------------------------------------ */

function StubWorld({ maker }: { maker: MockMaker }) {
  const rail = productsByMaker(maker.slug);

  return (
    <main className="pb-[var(--space-16)]">
      {/* hero — full-bleed film in the maker's own footage class */}
      <Reveal>
        <Film
          variant={maker.filmClass}
          aspect="wide"
          rounded={false}
          craft={`${maker.craft} · ${maker.location}`}
          title={maker.craftLine}
        />
      </Reveal>

      {/* craft story — media leads (hero above, delay 0), copy follows */}
      <section className="mx-auto w-full max-w-page px-[var(--space-2)] py-[var(--space-10)] md:px-[var(--space-6)]">
        <div className="grid items-start gap-[var(--space-8)] md:grid-cols-2">
          <Reveal delayMs={STAGGER_MS}>
            <h1 className="font-display text-display">{maker.name}</h1>
            <p className="mt-2 text-caption uppercase tracking-[0.08em] text-muted">
              {maker.craftLine}
            </p>
            <div className="mt-[var(--space-3)]">
              {maker.verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1 text-caption text-ink">
                  ✓ Real Maker · verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted">
                  Real-Maker verification pending — filmed proof under review
                </span>
              )}
            </div>
            <p className="mt-[var(--space-3)] max-w-measure text-body-lg">{maker.bio}</p>
            <p className="mt-[var(--space-2)] max-w-measure text-body text-muted">
              {maker.name}&rsquo;s full world is still being filmed. Follow to be there when it
              unfolds.
            </p>
          </Reveal>
          <Reveal delayMs={0}>
            <Film
              variant={maker.filmClass}
              aspect="portrait"
              craft={`In the workshop · ${maker.location}`}
            />
          </Reveal>
        </div>
      </section>

      {/* product rail — horizontal scroll, only if anything is listed */}
      {rail.length > 0 ? (
        <section className="mx-auto w-full max-w-page px-[var(--space-2)] pb-[var(--space-10)] md:px-[var(--space-6)]">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-h2">The shelf, today</h2>
            <span className="text-caption uppercase tracking-[0.08em] text-muted">Scroll →</span>
          </div>
          <div className="mt-[var(--space-3)] flex gap-[var(--space-3)] overflow-x-auto pb-2">
            {rail.map((product, i) => (
              <Link
                key={product.id}
                href={`/m/${maker.slug}/p/${product.id}`}
                className="w-64 shrink-0"
              >
                <Reveal delayMs={i * STAGGER_MS}>
                  <Film
                    variant={product.filmClass}
                    aspect="tall"
                    play={false}
                    craft={inventoryShort(product)}
                    title={product.title}
                  />
                  <div className="mt-2 flex items-baseline justify-between gap-2">
                    <span className="font-mono text-body text-ink">
                      {formatPrice(product.priceMinor, product.currency)}
                    </span>
                    <span className="text-caption text-muted">{leadShort(product)}</span>
                  </div>
                </Reveal>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* contact / follow strip */}
      <ContactStrip maker={maker} />
    </main>
  );
}

function ContactStrip({ maker }: { maker: MockMaker }) {
  const session = useKolSession();
  const following = session.isFollowing(maker.slug);

  return (
    <Reveal as="section" className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-page flex-col items-center gap-[var(--space-4)] px-[var(--space-2)] py-[var(--space-10)] text-center md:px-[var(--space-6)]">
        <h2 className="max-w-[20ch] font-display text-display [text-wrap:balance]">
          Stay close to {maker.name}.
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            aria-pressed={following}
            onClick={() => session.toggleFollow(maker.slug)}
            className={cn(
              "inline-flex min-h-12 items-center rounded-pill px-7 text-body-lg transition-colors duration-state ease-kol active:scale-[0.98]",
              following
                ? "bg-ink text-ground"
                : "bg-accent-cta text-accent-ink hover:bg-accent-cta/90",
            )}
          >
            {following ? "Following" : `Follow ${maker.name}`}
          </button>
          <Link
            href="/inbox"
            className="inline-flex min-h-12 items-center rounded-pill border border-line bg-surface px-7 text-body-lg text-ink transition-colors duration-state ease-kol hover:bg-ground"
          >
            Message {maker.name}
          </Link>
        </div>
        <p className="text-caption text-muted">
          {maker.followers} people follow {maker.name} on KOL.
        </p>
      </div>
    </Reveal>
  );
}

/* ------------------------------------------------------------------ */

function inventoryShort(product: MockProduct): string {
  switch (product.inventory.status) {
    case "in-stock":
      return product.inventory.qty !== undefined
        ? `In stock · ${product.inventory.qty}`
        : "In stock";
    case "made-to-order":
      return "Made to order";
    case "sold-out":
      return "Sold out";
  }
}

function leadShort(product: MockProduct): string {
  if (product.inventory.status === "made-to-order") {
    return product.inventory.leadWeeks !== undefined
      ? `${product.inventory.leadWeeks}-wk`
      : "made to order";
  }
  if (product.inventory.status === "sold-out") return "sold out";
  return "ships soon";
}
