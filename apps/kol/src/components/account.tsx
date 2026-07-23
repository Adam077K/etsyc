"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Heart,
  SignOut,
  Package,
  ArrowUpRight,
  Clock,
  Compass,
  BookmarkSimple,
} from "@phosphor-icons/react";
import {
  resolveBag,
  bagTotals,
  gbp,
  MOCK_ORDER,
  PRODUCT_DETAILS,
} from "@/lib/fixtures/commerce";
import { getMaker } from "@/lib/fixtures/makers";
import { getWorld } from "@/lib/fixtures/worlds";
import { CRAFT_ICON } from "@/lib/icons";
import { rise, calm, inView, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

// Mock signed-in visitor — matches the checkout defaults so the demo is coherent.
const VISITOR = {
  name: "Alex Rivera",
  email: MOCK_ORDER.email,
  memberSince: "Member since July 2026",
};
const initials = VISITOR.name
  .split(" ")
  .map((w) => w[0])
  .join("");

// Fallback still if a product gallery ever comes back empty (noUncheckedIndexedAccess).
const FALLBACK_IMG = "/media/clay-shelf.jpg";

// Order status in the maker's own voice — never a courier tracking number.
const ORDER_STATUS: Record<string, { stage: string; detail: string }> = {
  "odd-clay": {
    stage: "On Lena’s drying shelf",
    detail: "She’ll pack it the morning it’s ready and slip a note in the box.",
  },
  "indigo-ash": {
    stage: "In Sabine’s indigo vat",
    detail: "Nine dips deep — she’ll send word the moment the blue is right.",
  },
};

const SAVED_INIT = ["tumblers", "plates", "length"];
const FOLLOWED_INIT = [
  "odd-clay",
  "indigo-ash",
  "grain-groove",
  "marigold-loom",
  "riverstone-forge",
  "salt-kiln",
];

/**
 * Account — the signed-in mock state (concept-lock D15: KOL chrome). Human, not
 * dashboard-y: it opens on who you are and what a maker is making for you right
 * now, then the pieces you kept and the people you follow. All data is the mock
 * order from thank-you and the fixtures; save/follow toggles hold client state
 * so the interactions actually work for the pitch.
 */
export function Account() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string[]>(SAVED_INIT);
  const [followed, setFollowed] = useState<string[]>(FOLLOWED_INIT);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 560);
    return () => clearTimeout(t);
  }, []);

  const lines = resolveBag();
  const totals = bagTotals(lines);

  const savedProducts = saved
    .map((id) => PRODUCT_DETAILS[id])
    .filter((p): p is (typeof PRODUCT_DETAILS)[string] => Boolean(p));
  const followedMakers = followed
    .map((id) => getMaker(id))
    .filter((m): m is NonNullable<ReturnType<typeof getMaker>> => Boolean(m));

  return (
    <main className="min-h-screen bg-ink">
      {/* Profile band. */}
      <section className="mx-auto max-w-issue px-5 pb-10 pt-28 sm:px-8 sm:pt-32">
        <div className="flex items-start justify-between gap-4">
          <p className="meta text-bone-dim">Your account</p>
          <Link
            href="/sign-in"
            className="group flex items-center gap-2 font-ui text-sm text-bone-dim transition-colors hover:text-bone focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <SignOut size={16} weight="bold" />
            Sign out
          </Link>
        </div>

        <motion.div
          variants={reduce ? calm : rise(24, 0.7)}
          initial="hidden"
          animate="visible"
          className="mt-6 flex flex-wrap items-center gap-5"
        >
          <span
            aria-hidden
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-marigold font-display text-2xl font-bold text-ink"
          >
            {initials}
          </span>
          <div>
            <h1
              className="font-display font-extrabold leading-[0.95] text-bone"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              {VISITOR.name}
            </h1>
            <p className="mt-2 font-ui text-sm text-bone/70">
              {VISITOR.email}
              <span aria-hidden className="mx-2 text-bone/30">
                ·
              </span>
              {VISITOR.memberSince}
            </p>
          </div>
        </motion.div>
        <p className="mt-6 max-w-xl font-serif text-lg italic leading-snug text-bone/70">
          Everything you&rsquo;re following, saving, and waiting on &mdash; kept
          in one warm place.
        </p>
      </section>

      {loading ? (
        <AccountSkeleton />
      ) : (
        <div className="mx-auto max-w-issue px-5 pb-24 sm:px-8">
          {/* Being made for you. */}
          <Section
            reduce={!!reduce}
            title="Being made for you"
            action={{ label: "View order note", href: "/thank-you" }}
          >
            <div className="overflow-hidden rounded-3xl border border-line bg-ink-soft">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-6 py-4">
                <p className="meta text-bone-dim">Order {MOCK_ORDER.number}</p>
                <p className="meta text-bone-dim">Placed {MOCK_ORDER.date}</p>
              </div>
              <ul className="divide-y divide-line">
                {lines.map((line) => {
                  const status = ORDER_STATUS[line.maker.id];
                  return (
                    <li
                      key={line.product.id}
                      className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center"
                    >
                      <Link
                        href={`/m/${line.product.worldSlug}/p/${line.product.id}`}
                        className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold"
                      >
                        <Image
                          src={line.product.gallery[0] ?? FALLBACK_IMG}
                          alt={line.product.name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </Link>
                      <div className="flex-1">
                        <div className="flex justify-between gap-3">
                          <Link
                            href={`/m/${line.product.worldSlug}/p/${line.product.id}`}
                            className="font-ui text-sm font-semibold text-bone transition-colors hover:text-marigold"
                          >
                            {line.product.name}
                          </Link>
                          <span className="font-ui text-sm font-semibold text-bone">
                            {gbp(line.lineTotal)}
                          </span>
                        </div>
                        <p className="mt-1 font-ui text-xs text-bone-dim">
                          Made by {line.maker.name.split(" ").at(0) ?? line.maker.name} ·{" "}
                          {line.maker.place.split(" → ").at(-1) ?? line.maker.place}
                        </p>
                        {status && (
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-marigold/12 px-2.5 py-1 font-ui text-xs font-medium text-marigold">
                              <Clock size={13} weight="fill" />
                              {status.stage}
                            </span>
                            <p className="mt-1.5 font-serif text-sm italic leading-snug text-bone/65">
                              {status.detail}
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-baseline justify-between border-t border-line px-6 py-4">
                <span className="font-ui text-base font-semibold text-bone">Total paid</span>
                <span className="font-display text-2xl font-bold text-marigold">
                  {gbp(totals.total)}
                </span>
              </div>
              <p className="flex items-center gap-2 border-t border-line px-6 py-4 font-ui text-sm text-bone-dim">
                <Package size={17} weight="fill" className="text-bone-dim" />
                {MOCK_ORDER.deliveryEstimate}. We&rsquo;ll email you the moment each maker ships.
              </p>
            </div>
          </Section>

          {/* Saved pieces. */}
          <Section
            reduce={!!reduce}
            id="saved"
            title="Saved pieces"
            count={savedProducts.length}
          >
            {savedProducts.length === 0 ? (
              <EmptyRow
                icon={<BookmarkSimple size={28} />}
                title="Nothing kept yet."
                body="Tap the heart on any piece and it waits for you here."
              />
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {savedProducts.map((product) => {
                  const maker = getMaker(product.worldSlug);
                  return (
                    <article
                      key={product.id}
                      className="group relative w-60 shrink-0"
                    >
                      <Link
                        href={`/m/${product.worldSlug}/p/${product.id}`}
                        className="press block overflow-hidden rounded-2xl ring-1 ring-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                      >
                        <div className="relative aspect-[3/4]">
                          <Image
                            src={product.gallery[0] ?? FALLBACK_IMG}
                            alt={product.name}
                            fill
                            sizes="240px"
                            className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.05]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 p-4">
                            <span className="inline-block rounded-full bg-ink/70 px-2.5 py-1 font-ui text-xs font-semibold text-bone backdrop-blur-sm">
                              {product.price}
                            </span>
                            <h3 className="mt-2 font-display text-lg font-bold leading-tight text-bone">
                              {product.name}
                            </h3>
                            {maker && (
                              <p className="mt-1 font-ui text-xs text-bone/75">
                                {maker.studio}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                      <button
                        onClick={() =>
                          setSaved((prev) => prev.filter((id) => id !== product.id))
                        }
                        aria-label={`Remove ${product.name} from saved`}
                        className="press absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-ink/70 text-marigold backdrop-blur-sm hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                      >
                        <Heart size={19} weight="fill" />
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Makers you follow. */}
          <Section
            reduce={!!reduce}
            title="Makers you follow"
            count={followedMakers.length}
          >
            {followedMakers.length === 0 ? (
              <EmptyRow
                icon={<Compass size={28} />}
                title="You’re not following anyone yet."
                body="Follow a maker and their new work turns up in your issue first."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {followedMakers.map((maker) => {
                  const Icon = CRAFT_ICON[maker.craft];
                  const hasWorld = Boolean(getWorld(maker.id));
                  const inner = (
                    <>
                      <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-1 ring-line transition-[box-shadow] duration-500 group-hover:ring-marigold/40">
                        <Image
                          src={maker.image}
                          alt={maker.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-[transform,filter] duration-700 ease-out-expo group-hover:scale-[1.06] group-hover:saturate-[1.12]"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="truncate font-display text-lg font-bold leading-tight text-bone">
                            {maker.studio}
                          </h3>
                          {hasWorld && (
                            <ArrowUpRight
                              size={15}
                              weight="bold"
                              className="shrink-0 text-bone/40 transition-colors group-hover:text-marigold"
                            />
                          )}
                        </div>
                        <p className="mt-0.5 flex items-center gap-1.5 truncate font-ui text-xs text-bone/65">
                          <Icon size={13} weight="fill" className="shrink-0 text-marigold" />
                          {maker.discipline} · {maker.place}
                        </p>
                      </div>
                    </>
                  );
                  return (
                    <div
                      key={maker.id}
                      className="group flex items-center gap-4 rounded-2xl border border-line bg-ink-soft p-4 transition-[transform,border-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:border-marigold/40 hover:shadow-[0_22px_50px_-26px_rgba(0,0,0,0.7)]"
                    >
                      {hasWorld ? (
                        <Link
                          href={`/m/${maker.id}`}
                          className="flex min-w-0 flex-1 items-center gap-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-center gap-4">{inner}</div>
                      )}
                      <button
                        onClick={() =>
                          setFollowed((prev) => prev.filter((id) => id !== maker.id))
                        }
                        aria-label={`Unfollow ${maker.studio}`}
                        className="press flex shrink-0 items-center gap-1.5 rounded-full border border-marigold/50 bg-marigold/10 px-4 py-2 font-ui text-xs font-semibold text-marigold hover:border-marigold hover:bg-marigold/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                      >
                        <Heart size={14} weight="fill" />
                        Following
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  count,
  action,
  id,
  reduce,
  children,
}: {
  title: string;
  count?: number;
  action?: { label: string; href: string };
  id?: string;
  reduce: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      variants={reduce ? calm : rise(24, 0.8)}
      initial="hidden"
      whileInView="visible"
      viewport={inView}
      transition={{ ease: easeOut }}
      className="mt-14 scroll-mt-24 border-t border-line pt-10 first:border-t-0 first:pt-0"
    >
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <p className="meta text-bone-dim">
          {title}
          {typeof count === "number" && (
            <span className="ml-2 text-bone/40">
              {String(count).padStart(2, "0")}
            </span>
          )}
        </p>
        {action && (
          <Link
            href={action.href}
            className="font-ui text-sm text-marigold transition-colors hover:text-marigold-bright"
          >
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function EmptyRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-line px-6 py-16 text-center">
      <span className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-ink-raise text-marigold">
        {icon}
      </span>
      <h3 className="font-display text-2xl font-bold text-bone">{title}</h3>
      <p className="mt-3 max-w-sm font-ui text-sm leading-relaxed text-bone/65">
        {body}
      </p>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="mx-auto max-w-issue px-5 pb-24 sm:px-8" aria-hidden>
      <div className="shimmer-sweep h-56 rounded-3xl bg-[#3A2E26] ring-1 ring-line" />
      <div className="mt-14 flex gap-4 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="shimmer-sweep h-80 w-60 shrink-0 rounded-2xl bg-[#3A2E26] ring-1 ring-line"
          />
        ))}
      </div>
    </div>
  );
}
