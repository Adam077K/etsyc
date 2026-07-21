"use client";

/**
 * /me — Buyer Profile (P2 + B13). Mirrors docs/10-page-mockups/profile.html.
 *
 * Hard ACs honoured here:
 * - Followed makers render ON FILM (small film cards) — never avatars-in-a-row.
 * - Saved products keep their maker and link back into the maker's world;
 *   layout is mixed-size, never a uniform 3-col product grid.
 * - Public taste identity is OFF by default, explicit opt-in, with a live
 *   preview of exactly what others would see when it is ON.
 * - No red badges, no streaks, no engagement bait.
 */

import Link from "next/link";
import { useState } from "react";
import { Film, type FilmAspect } from "@/components/chrome/Film";
import {
  communities,
  formatPrice,
  getMaker,
  getProduct,
  orderStages,
  orders,
  type MockProduct,
} from "@/lib/mock/db";
import { useKolSession } from "@/lib/mock/session";

type Tab = "saved" | "following" | "communities" | "purchases" | "prefs";

const TABS: { id: Tab; label: string }[] = [
  { id: "saved", label: "Saved" },
  { id: "following", label: "Following" },
  { id: "communities", label: "Communities" },
  { id: "purchases", label: "Purchases" },
  { id: "prefs", label: "Preferences" },
];

/** mixed-size cells — deliberately NOT a uniform grid (hard ban) */
const SAVED_PATTERN: { span: string; aspect: FilmAspect }[] = [
  { span: "md:col-span-7", aspect: "wide" },
  { span: "md:col-span-5", aspect: "square" },
  { span: "md:col-span-5", aspect: "portrait" },
  { span: "md:col-span-7", aspect: "wide" },
];

const chip = (pressed: boolean) =>
  `inline-flex min-h-11 items-center rounded-pill border px-4 text-caption uppercase transition-colors duration-state ease-kol ${
    pressed
      ? "border-accent bg-accent/10 text-ink"
      : "border-line bg-surface text-muted hover:text-ink"
  }`;

export default function ProfilePage() {
  const session = useKolSession();
  const [tab, setTab] = useState<Tab>("saved");
  const [tastePublic, setTastePublic] = useState(false); // OFF by default — explicit opt-in

  const savedProducts: MockProduct[] = session.saves.flatMap((id) => {
    const p = getProduct(id);
    return p ? [p] : [];
  });
  const followedMakers = session.follows.flatMap((slug) => {
    const m = getMaker(slug);
    return m ? [m] : [];
  });
  const joinedCommunities = communities.filter((c) => session.follows.includes(c.makerSlug));

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)]">
      {/* ---- account header — a person, not a dashboard ---- */}
      <header className="pt-[var(--space-8)]">
        <p className="text-caption uppercase text-muted">Your account</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-display text-ink">Rowan Ellison</h1>
            <p className="mt-1 text-body-lg text-muted">
              Member since 2026 · following {followedMakers.length}{" "}
              {followedMakers.length === 1 ? "maker" : "makers"} · {savedProducts.length}{" "}
              {savedProducts.length === 1 ? "save" : "saves"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/settings"
              className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
            >
              Settings &amp; privacy
            </Link>
            <Link
              href="/orders"
              className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
            >
              Order history
            </Link>
          </div>
        </div>
      </header>

      {/* ---- tab row — sectioned, not a card grid ---- */}
      {/* The tablist owns only tabs; "My reviews" is a route, not a tab, so it
          sits beside the tablist rather than inside it (ARIA owned-children). */}
      <div className="mt-[var(--space-6)] flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <div role="tablist" aria-label="Account sections" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={chip(tab === t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {/* My reviews lives on its own private route */}
        <Link href="/me/reviews" className={chip(false)}>
          My reviews →
        </Link>
      </div>

      {/* ================= SAVED ================= */}
      {tab === "saved" && (
        <section
          role="tabpanel"
          id="panel-saved"
          aria-labelledby="tab-saved"
          className="pt-[var(--space-5)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-h2 text-ink">Saved products</h2>
            <Link
              href="/me/collections"
              className="inline-flex min-h-11 items-center text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
            >
              Organize into boards →
            </Link>
          </div>
          <p className="mt-1 max-w-measure text-body text-muted">
            Every save keeps its maker. Tap any piece to fall back into the world it came from.
          </p>

          {savedProducts.length === 0 ? (
            <div className="mt-[var(--space-4)] rounded-lg border border-dashed border-line bg-surface p-[var(--space-6)]">
              <p className="font-display text-h3 text-ink">Nothing saved yet</p>
              <p className="mt-2 max-w-measure text-body text-muted">
                When a piece stops you mid-scroll, save it — it keeps its maker attached and
                lands here.
              </p>
              <Link
                href="/"
                className="mt-4 inline-block rounded-pill bg-accent px-6 py-2.5 text-caption uppercase text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent/90 active:scale-[0.98]"
              >
                Go watch some makers
              </Link>
            </div>
          ) : (
            <div className="mt-[var(--space-4)] grid grid-cols-1 gap-4 md:grid-cols-12">
              {savedProducts.map((p, i) => {
                const cell = SAVED_PATTERN[i % SAVED_PATTERN.length] ?? {
                  span: "md:col-span-6",
                  aspect: "wide" as FilmAspect,
                };
                const maker = getMaker(p.makerSlug);
                return (
                  <div key={p.id} className={cell.span}>
                    <Link href={`/m/${p.makerSlug}/p/${p.id}`} className="group block">
                      <Film
                        variant={p.filmClass}
                        aspect={cell.aspect}
                        craft={maker ? `${maker.name} · ${maker.craft}` : undefined}
                        title={p.title}
                      />
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-caption text-muted">
                        {formatPrice(p.priceMinor, p.currency)}
                      </span>
                      <button
                        type="button"
                        onClick={() => session.toggleSave(p.id)}
                        className="inline-flex min-h-11 items-center text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
                      >
                        Unsave
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ================= FOLLOWING — makers ON FILM, never avatar rows ================= */}
      {tab === "following" && (
        <section
          role="tabpanel"
          id="panel-following"
          aria-labelledby="tab-following"
          className="pt-[var(--space-5)]"
        >
          <h2 className="font-display text-h2 text-ink">Makers you follow</h2>
          <p className="mt-1 max-w-measure text-body text-muted">
            Not a row of avatars — the people, moving, in their workshops. Tap to open their
            world.
          </p>
          {followedMakers.length === 0 ? (
            <div className="mt-[var(--space-4)] rounded-lg border border-dashed border-line bg-surface p-[var(--space-6)]">
              <p className="font-display text-h3 text-ink">No one yet</p>
              <p className="mt-2 max-w-measure text-body text-muted">
                Following a maker means their films, releases, and kiln days find you first.
              </p>
            </div>
          ) : (
            <div className="mt-[var(--space-4)] flex gap-4 overflow-x-auto pb-2">
              {followedMakers.map((m) => (
                <div key={m.slug} className="w-44 flex-none">
                  <Link href={`/m/${m.slug}`} className="block">
                    <Film variant={m.filmClass} aspect="tall" craft={m.craft} title={m.name} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => session.toggleFollow(m.slug)}
                    className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-pill border border-line bg-surface px-3 text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
                  >
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ================= COMMUNITIES ================= */}
      {tab === "communities" && (
        <section
          role="tabpanel"
          id="panel-communities"
          aria-labelledby="tab-communities"
          className="pt-[var(--space-5)]"
        >
          <h2 className="font-display text-h2 text-ink">Communities you&rsquo;ve joined</h2>
          <p className="mt-1 max-w-measure text-body text-muted">
            Membership rides on your follows — a community is a layer of a maker&rsquo;s world,
            not a separate app.
          </p>
          {joinedCommunities.length === 0 ? (
            <div className="mt-[var(--space-4)] rounded-lg border border-dashed border-line bg-surface p-[var(--space-6)]">
              <p className="font-display text-h3 text-ink">No communities yet</p>
              <p className="mt-2 max-w-measure text-body text-muted">
                Follow a maker who runs one and it appears here.
              </p>
            </div>
          ) : (
            <div className="mt-[var(--space-4)] max-w-xl divide-y divide-line rounded-lg border border-line bg-surface shadow-subtle">
              {joinedCommunities.map((c) => {
                const m = getMaker(c.makerSlug);
                return (
                  <Link
                    key={c.makerSlug}
                    href={`/m/${c.makerSlug}/community`}
                    className="flex items-center justify-between gap-4 p-4 transition-colors duration-state ease-kol hover:bg-ground"
                  >
                    <span>
                      <b className="text-ink">{m?.name}&rsquo;s community</b>
                      <span className="mt-0.5 block text-caption text-muted">
                        {m?.craft} · {c.members} members ·{" "}
                        {c.visibility === "public" ? "public" : "private"}
                      </span>
                    </span>
                    <span className="text-caption uppercase text-muted">Open →</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ================= PURCHASES ================= */}
      {tab === "purchases" && (
        <section
          role="tabpanel"
          id="panel-purchases"
          aria-labelledby="tab-purchases"
          className="pt-[var(--space-5)]"
        >
          <h2 className="font-display text-h2 text-ink">Recent purchases</h2>
          <div className="mt-[var(--space-4)] max-w-xl divide-y divide-line rounded-lg border border-line bg-surface shadow-subtle">
            {orders.map((o) => {
              const m = getMaker(o.makerSlug);
              return (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 p-4 transition-colors duration-state ease-kol hover:bg-ground"
                >
                  <span>
                    <b className="text-ink">
                      {o.items
                        .map((it) => {
                          const p = getProduct(it.productId);
                          return `${p?.title ?? it.productId}${it.qty > 1 ? ` ×${it.qty}` : ""}`;
                        })
                        .join(", ")}
                    </b>
                    <span className="mt-0.5 block text-caption text-muted">
                      {m?.name} · placed {o.placed} · {orderStages[o.stage]}
                    </span>
                  </span>
                  <span className="text-body text-ink">{formatPrice(o.totalMinor)}</span>
                </Link>
              );
            })}
          </div>
          <Link
            href="/orders"
            className="mt-3 inline-block text-caption uppercase text-muted transition-colors duration-state ease-kol hover:text-ink"
          >
            All orders →
          </Link>
        </section>
      )}

      {/* ================= PREFERENCES + PUBLIC TASTE IDENTITY ================= */}
      {tab === "prefs" && (
        <section
          role="tabpanel"
          id="panel-prefs"
          aria-labelledby="tab-prefs"
          className="pt-[var(--space-5)]"
        >
          <h2 className="font-display text-h2 text-ink">Preferences</h2>
          <div className="mt-[var(--space-4)] grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* --- public taste identity — explicit opt-in with live preview --- */}
            <div className="rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle lg:col-span-7">
              <h3 className="font-display text-h3 text-ink">
                Public taste identity{" "}
                <span className="ml-1 rounded-pill border border-line bg-ground px-2.5 py-0.5 align-middle text-caption text-muted">
                  {tastePublic ? "On" : "Off · opt-in"}
                </span>
              </h3>
              <p className="mt-2 max-w-measure text-body text-muted">
                Off by default. If you turn this on, other people can see a small public page of
                the makers and crafts you gravitate toward. Nothing is shared until you flip the
                switch — and you choose what shows.
              </p>

              {/* live preview of exactly what others would see when ON */}
              <div className="mt-3 rounded-md border border-line bg-ground p-4">
                <p className="text-caption uppercase text-muted">
                  Preview · what others would see {tastePublic ? "(live now)" : "(if you turn it on)"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(session.prefs.vibes.length > 0
                    ? session.prefs.vibes
                    : ["Slow craft"]
                  ).map((v) => (
                    <span
                      key={v}
                      className="rounded-pill border border-accent bg-accent/10 px-3 py-1 text-caption text-ink"
                    >
                      {v}
                    </span>
                  ))}
                  {followedMakers.slice(0, 3).map((m) => (
                    <span
                      key={m.slug}
                      className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted"
                    >
                      {m.craft}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex gap-3 overflow-x-auto">
                  {(followedMakers.length > 0 ? followedMakers : []).slice(0, 3).map((m) => (
                    <div key={m.slug} className="w-28 flex-none">
                      <Film variant={m.filmClass} aspect="square" title={m.name} play={false} />
                    </div>
                  ))}
                  {followedMakers.length === 0 && (
                    <p className="text-caption text-muted">
                      Follow a maker and they&rsquo;d appear here, on film.
                    </p>
                  )}
                </div>
                <p className="mt-3 text-caption text-muted">
                  Never shown: your purchases, addresses, order history, or reviews you
                  haven&rsquo;t published.
                </p>
              </div>

              <label className="mt-4 flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={tastePublic}
                  onChange={(e) => setTastePublic(e.target.checked)}
                  aria-label="Make taste identity public"
                  className="h-6 w-6 accent-accent"
                />
                <span className="text-body text-ink">
                  Visibility: <b>{tastePublic ? "Public" : "Private"}</b>
                  {tastePublic ? " — others can see the preview above" : " → flip to go public"}
                </span>
              </label>
            </div>

            {/* --- stated taste (from onboarding) --- */}
            <div className="rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle lg:col-span-5">
              <h3 className="font-display text-h3 text-ink">What you told us</h3>
              <p className="mt-2 text-caption uppercase text-muted">Drawn to</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {session.prefs.vibes.length > 0 ? (
                  session.prefs.vibes.map((v) => (
                    <span
                      key={v}
                      className="rounded-pill border border-accent bg-accent/10 px-3 py-1 text-caption text-ink"
                    >
                      {v}
                    </span>
                  ))
                ) : (
                  <span className="text-body text-muted">
                    Nothing yet — the feed learns from what you do anyway.
                  </span>
                )}
              </div>
              <div className="mt-3 divide-y divide-line border-t border-line">
                <p className="flex items-center justify-between py-2.5 text-body">
                  <span className="text-muted">Comfortable spend</span>
                  <span className="text-ink">{session.prefs.budget ?? "Not set"}</span>
                </p>
                <p className="flex items-center justify-between py-2.5 text-body">
                  <span className="text-muted">Roughly where</span>
                  <span className="text-ink">{session.prefs.location ?? "Not set"}</span>
                </p>
                <p className="flex items-center justify-between py-2.5 text-body">
                  <span className="text-muted">Onboarding</span>
                  <span className="text-ink">{session.onboarded ? "Done" : "Skipped"}</span>
                </p>
              </div>
              <Link
                href="/welcome"
                className="mt-3 inline-block rounded-pill border border-line bg-surface px-4 py-2 text-caption uppercase text-ink transition-colors duration-state ease-kol hover:bg-ground"
              >
                Redo onboarding →
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
