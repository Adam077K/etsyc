"use client";

/**
 * /m/[maker] — the maker world (B3 world-unfold + B4 store-scroll).
 *
 * Surface split (D15): the slim strip up top is KOL chrome (app palette,
 * never themed); everything below it belongs to the maker. For makers with
 * a store-config fixture the world renders through renderStore, which
 * applies the world's own theme at its root. The only thing layered on top
 * is the MAKER'S OWN draft override from /sell/edit — her block order and
 * her tuned hexes, merged onto that same world root. KOL never re-themes a
 * world; she does. Makers without a fixture (hasWorld: false) get an honest
 * composed page from db data, not a fake world.
 *
 * Client page pattern: React 19 `use(params)` unwraps the Next 16 params
 * Promise so session state (follow) and the unfold entrance live in one file.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cloneElement,
  isValidElement,
  use,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { Film } from "@/components/chrome/Film";
import { useHeroStage } from "@/components/chrome/HeroPlayer";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Skeleton, SkeletonLines } from "@/components/states/Skeleton";
import { getData, type Maker, type Product } from "@/lib/data";
import { formatPrice, sellerBlocks } from "@/lib/mock/db";
import { useKolSession } from "@/lib/mock/session";
import { SELLER_SLUG } from "@/lib/mock/seller-state";
import { useKolStore, type StoreOverride } from "@/lib/mock/store";
import { renderStore } from "@/lib/renderer/render-store";
import type { StoreBlock, StoreConfig } from "@/lib/store-config/types";
import { isHexColor, readableInk } from "@/lib/theme/contrast";
import { cn } from "@/lib/utils";

/** What the live fetch resolves to — the maker, her published world, her shelf. */
interface WorldData {
  /** The slug this snapshot answered — a mismatch with the route reads as loading. */
  slug: string;
  maker: Maker | null;
  config: StoreConfig | null;
  rail: Product[];
}

export default function MakerWorldPage({
  params,
}: {
  params: Promise<{ maker: string }>;
}) {
  const { maker: slug } = use(params);
  // WORLD_OPEN: the persistent film docks top-right and keeps playing — it is
  // the same node that grew on the feed, so the clock never resets. Declared
  // before any early return so the hook order stays unconditional; the slug is
  // known synchronously, so the stage never waits on the fetch.
  useHeroStage("world", slug);

  // The maker's own draft state — what she arranged in /sell/edit is what a
  // buyer opens here. This is the seller's editor draft (a synchronous client
  // store), distinct from the LIVE published data fetched below. Hooks stay
  // above every early return.
  const override = useKolStore().overrideFor(slug);

  const [data, setData] = useState<WorldData | null>(null);

  useEffect(() => {
    let active = true;
    const source = getData();
    void (async () => {
      const maker = await source.getMaker(slug);
      if (!maker) {
        if (active) setData({ slug, maker: null, config: null, rail: [] });
        return;
      }
      // A maker exists; her published world and shelf load together.
      const [config, rail] = await Promise.all([
        source.getStoreConfig(slug),
        source.productsByMaker(slug),
      ]);
      if (active) setData({ slug, maker, config, rail });
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  // A snapshot for a different slug (route just changed) reads as loading.
  if (!data || data.slug !== slug) return <WorldSkeleton />;
  if (!data.maker) notFound();

  // The seller's editor draft can reorder her own world's blocks; the LIVE
  // published config is the base. An untouched order is a no-op.
  const worldConfig =
    data.config && slug === SELLER_SLUG && override.order
      ? reorderBlocks(data.config, override.order)
      : data.config;

  const maker = data.maker;
  // The world renders only when a published store-config came back. A maker
  // with no world yet gets the honest stub — never a crash, never a fake world.
  const hasWorld = worldConfig !== null;

  return (
    <div className="min-h-screen">
      <MakerStrip
        maker={maker}
        showWorldLinks={hasWorld}
        override={hasWorld ? override : null}
      />
      {hasWorld && worldConfig ? (
        <WorldUnfold>
          <ThemedWorld config={worldConfig} theme={override.theme} linkBase={`/m/${slug}`} />
        </WorldUnfold>
      ) : (
        <StubWorld maker={maker} rail={data.rail} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading — KOL chrome skeleton while the live world resolves.        */
/* ------------------------------------------------------------------ */

function WorldSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-page items-center gap-x-3 px-[var(--space-2)] py-3 md:px-[var(--space-6)]">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="ml-auto h-11 w-28 rounded-pill" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-page px-[var(--space-2)] py-[var(--space-8)] md:px-[var(--space-6)]">
        <Skeleton className="aspect-[16/9] w-full rounded-md" />
        <div className="mt-[var(--space-6)] max-w-measure">
          <Skeleton className="h-9 w-2/3" />
          <div className="mt-3">
            <SkeletonLines lines={3} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Seller → buyer seam: her draft override, applied at render time.    */
/* The imported fixtures are cloned, never mutated — with no override  */
/* the pristine world renders exactly as before.                       */
/* ------------------------------------------------------------------ */

/**
 * The editor exposes six of the world's blocks and orders them by id; the
 * config carries every block, including ones it doesn't expose (atmosphere,
 * trust-badge). What travels is her PERMUTATION — how far she moved things
 * from where the editor handed them to her — applied to the config's own
 * controlled blocks, in the slots they already occupy. An untouched order is
 * therefore a no-op: nothing she never moved gets displaced, and blocks the
 * editor doesn't expose keep their place.
 */
function reorderBlocks(config: StoreConfig, order: string[]): StoreConfig {
  const defaultOrder = sellerBlocks.map((b) => b.id);
  const permutation = order
    .map((id) => defaultOrder.indexOf(id))
    .filter((index) => index >= 0);
  // an order that doesn't describe the seed exactly is not a permutation we
  // can trust — leave her world exactly as the fixture renders it
  if (permutation.length !== defaultOrder.length) return config;

  const sellerTypes = new Set(sellerBlocks.map((b) => b.type));
  const base = [...config.blocks].sort((a, b) => a.order - b.order);

  const slots: number[] = [];
  const controlled: StoreBlock[] = [];
  base.forEach((block, i) => {
    if (sellerTypes.has(block.type)) {
      slots.push(i);
      controlled.push(block);
    }
  });
  if (controlled.length !== permutation.length) return config;

  const next = [...base];
  slots.forEach((slot, i) => {
    const from = permutation[i];
    const block = from === undefined ? undefined : controlled[from];
    if (block) next[slot] = block;
  });

  return { ...config, blocks: next.map((block, i) => ({ ...block, order: i })) };
}

/** Her tuned hexes, as the same CSS variables every block already consumes. */
function themeVarsFrom(theme: StoreOverride["theme"]): CSSProperties | null {
  if (!theme) return null;
  const vars: Record<string, string> = {};

  if (theme.ground && isHexColor(theme.ground)) {
    vars["--ground"] = theme.ground;
    vars["--scrim"] =
      `linear-gradient(to top, color-mix(in oklab, ${theme.ground} 45%, black) 0%, transparent 55%)`;
  }
  if (theme.accent && isHexColor(theme.accent)) {
    vars["--accent"] = theme.accent;
    vars["--accent-2"] = theme.accent;
    vars["--accent-3"] = theme.accent;
    vars["--accent-cta"] = theme.accent;
    // her hue, but the type on it stays readable — AA is arithmetic, not taste
    vars["--accent-ink"] = readableInk(theme.accent);
  }

  return Object.keys(vars).length > 0 ? (vars as CSSProperties) : null;
}

/**
 * renderStore themes the world at its own root, so the override is merged
 * onto that exact element — never onto a wrapper the KOL chrome shares.
 */
function ThemedWorld({
  config,
  theme,
  linkBase,
}: {
  config: StoreConfig;
  theme: StoreOverride["theme"];
  linkBase: string;
}) {
  // linkBase makes the world's products clickable — the WORLD_BROWSE →
  // PRODUCT_PAGE step. /preview omits it so the block matrix stays inert.
  const world = renderStore(config, { state: "success", linkBase });
  const vars = themeVarsFrom(theme);
  if (!vars || !isValidElement<{ style?: CSSProperties }>(world)) return world;
  return cloneElement(world, { style: { ...(world.props.style ?? {}), ...vars } });
}

/* ------------------------------------------------------------------ */
/* KOL chrome strip — app palette, sits ABOVE the themed world root.   */
/* ------------------------------------------------------------------ */

function MakerStrip({
  maker,
  showWorldLinks,
  override,
}: {
  maker: Maker;
  showWorldLinks: boolean;
  override: StoreOverride | null;
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
          {override ? <PublishChip override={override} /> : null}
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

/**
 * Honest publish state, in KOL chrome — never inside the themed world.
 * Draft until she presses publish at /sell/publish; nothing pretends
 * otherwise.
 */
function PublishChip({ override }: { override: StoreOverride }) {
  if (!override.published) {
    return (
      <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
        • Draft — not yet published
      </span>
    );
  }
  const date = override.publishedAt
    ? new Date(override.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;
  return (
    <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption uppercase tracking-[0.04em] text-ink">
      ✓ Published{date ? ` ${date}` : ""}
    </span>
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

function StubWorld({ maker, rail }: { maker: Maker; rail: Product[] }) {
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

function ContactStrip({ maker }: { maker: Maker }) {
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

function inventoryShort(product: Product): string {
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

function leadShort(product: Product): string {
  if (product.inventory.status === "made-to-order") {
    return product.inventory.leadWeeks !== undefined
      ? `${product.inventory.leadWeeks}-wk`
      : "made to order";
  }
  if (product.inventory.status === "sold-out") return "sold out";
  return "ships soon";
}
