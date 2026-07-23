"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Eye,
  Package,
  Truck,
  WarningCircle,
  Wind,
} from "@phosphor-icons/react";
import {
  resolveBag,
  bagTotals,
  gbp,
  type ResolvedLine,
} from "@/lib/fixtures/commerce";
import {
  SELLER_ORDERS,
  STAGE_META,
  STAGE_ORDER,
  type OrderStage,
  type SellerOrder,
} from "@/lib/fixtures/sell-orders";
import { rise, stagger, calm, easeOut } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ViewState = "default" | "empty" | "error";

export function SellOrders() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ViewState>("default");

  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("state");
    // Defer state into the reveal beat — no synchronous setState in the effect
    // body (avoids cascading renders), matching the studio pattern.
    const t = setTimeout(
      () => {
        if (s === "empty" || s === "error") setState(s);
        setLoading(false);
      },
      reduce ? 200 : 800,
    );
    return () => clearTimeout(t);
  }, [reduce]);

  if (loading) return <OrdersSkeleton />;
  if (state === "error") return <OrdersError onRetry={() => setState("default")} />;

  const orders =
    state === "empty"
      ? []
      : [...SELLER_ORDERS].sort(
          (a, b) => STAGE_ORDER.indexOf(a.stage) - STAGE_ORDER.indexOf(b.stage),
        );

  const onBench = orders.filter((o) => o.stage !== "shipped").length;

  return (
    <div className="mx-auto max-w-4xl px-5 pb-28 pt-24 sm:px-8 sm:pt-28">
      <motion.header
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.01 : 0.5, ease: easeOut }}
      >
        <p className="meta text-marigold">Your orders</p>
        <h1
          className="mt-4 font-display font-extrabold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)" }}
        >
          Work to do.
        </h1>
        <p className="mt-4 max-w-measure font-ui text-lg leading-relaxed text-bone/75">
          {orders.length === 0
            ? "Nothing to make today."
            : onBench > 0
              ? `${cap(count(onBench))} on the bench, and how each one is shown to the person who's waiting.`
              : "Everything's out the door — here's what you've sent lately."}
        </p>
      </motion.header>

      {orders.length === 0 ? (
        <OrdersEmpty reduce={!!reduce} />
      ) : (
        <motion.ol
          variants={stagger(0.05, 0.09)}
          initial="hidden"
          animate="visible"
          className="mt-12 space-y-5"
        >
          {orders.map((order) => (
            <motion.li key={order.id} variants={reduce ? calm : rise(18, 0.5)}>
              <OrderCard order={order} reduce={!!reduce} />
            </motion.li>
          ))}
        </motion.ol>
      )}
    </div>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
function count(n: number): string {
  const words = ["none", "one", "two", "three", "four", "five", "six"];
  return words[n] ?? String(n);
}

/* ---- A single order — work-to-do, from the maker's side ---- */

function OrderCard({ order, reduce }: { order: SellerOrder; reduce: boolean }) {
  const [stage, setStage] = useState<OrderStage>(order.stage);

  const lines = resolveBag(order.bag);
  const totals = bagTotals(lines);
  const mine = lines.filter((l) => l.product.worldSlug === order.makerSlug);
  const others = lines.filter((l) => l.product.worldSlug !== order.makerSlug);
  const multiMaker = others.length > 0;
  const shipped = stage === "shipped";

  return (
    <article
      className={cn(
        "overflow-hidden rounded-3xl border bg-ink-soft transition-colors",
        shipped ? "border-line" : "border-bone/18",
      )}
    >
      {/* Header strip: number · placed · total */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-b border-line px-5 py-3.5 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-bone/55">{order.number}</span>
          <span className="text-bone/25">·</span>
          <span className="font-ui text-xs text-bone/55">
            Placed {order.placed}
          </span>
        </div>
        <span className="font-mono text-sm text-bone/80">
          {gbp(totals.total)}
        </span>
      </div>

      <div className="p-5 sm:p-7">
        {/* Buyer + the work-to-do headline */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="meta text-bone-dim">
              For {order.buyerName} · {order.buyerPlace}
            </p>
            <h2 className="mt-2.5 font-display text-2xl font-extrabold leading-tight text-bone sm:text-[1.75rem]">
              {shipped ? doneHeadline(order) : order.todo}
            </h2>
            {!shipped && (
              <p className="mt-1.5 font-ui text-sm text-bone/60">
                Promised by{" "}
                <span className="font-medium text-bone/80">{order.promised}</span>
              </p>
            )}
          </div>
          <StageBadge stage={stage} />
        </div>

        {/* What's in the order */}
        <ul className="mt-6 space-y-2.5">
          {mine.map((line) => (
            <LineRow key={line.product.id} line={line} mine />
          ))}
          {others.map((line) => (
            <LineRow key={line.product.id} line={line} mine={false} />
          ))}
        </ul>

        {multiMaker && (
          <p className="mt-3 font-ui text-xs text-bone/50">
            You&#39;re making {mine.length} of {lines.length} pieces in this order —
            {others.map((l) => ` ${l.maker.name}`).join(",")} makes the rest.
          </p>
        )}

        {/* Stage control — the maker sets it, in her own words */}
        <div className="mt-7 border-t border-line pt-6">
          <p className="meta text-bone-dim">Set where it&#39;s at</p>
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Order status">
            {STAGE_ORDER.map((s) => {
              const active = s === stage;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStage(s)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-ui text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink-soft",
                    active
                      ? "border-marigold bg-marigold/15 text-bone"
                      : "border-bone/18 text-bone/55 hover:border-bone/40 hover:text-bone",
                  )}
                >
                  <StageIcon stage={s} active={active} />
                  {STAGE_META[s].label}
                </button>
              );
            })}
          </div>

          {/* The connection: what she typed is what the buyer reads */}
          <div className="mt-5 rounded-2xl border border-line bg-ink/60 p-4">
            <p className="flex items-center gap-1.5 meta text-marigold">
              <Eye size={13} weight="fill" />
              This is what {order.buyerName} sees
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={stage}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: reduce ? 0.01 : 0.28, ease: easeOut }}
                className="mt-2 font-serif text-lg leading-snug text-bone"
              >
                &ldquo;{STAGE_META[stage].buyerSees}&rdquo;
              </motion.p>
            </AnimatePresence>
            <p className="mt-2 font-ui text-xs text-bone/45">
              On her order page, in your voice. Change the status and this changes
              with it.
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

function doneHeadline(order: SellerOrder): string {
  return `Sent to ${order.buyerName} in ${order.buyerPlace}`;
}

function LineRow({ line, mine }: { line: ResolvedLine; mine: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3.5",
        !mine && "opacity-55",
      )}
    >
      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-line">
        <Image
          src={line.product.gallery[0]!}
          alt={line.product.name}
          fill
          sizes="48px"
          className="object-cover"
        />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-ui text-sm font-medium text-bone">
          {line.product.name}
          {line.qty > 1 && (
            <span className="text-bone/50"> · {line.qty}</span>
          )}
        </p>
        <p className="font-ui text-xs text-bone/50">
          {mine ? "Yours to make" : `Made by ${line.maker.name}`}
        </p>
      </div>
      <span className="shrink-0 font-mono text-xs text-bone/60">
        {gbp(line.lineTotal)}
      </span>
    </li>
  );
}

function StageBadge({ stage }: { stage: OrderStage }) {
  const tone =
    stage === "shipped"
      ? "border-bone/20 text-bone/60"
      : stage === "making"
        ? "border-marigold/40 bg-marigold/10 text-marigold"
        : "border-sky-bright/40 bg-sky/10 text-sky-bright";
  return (
    <span
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em]",
        tone,
      )}
    >
      <StageIcon stage={stage} active />
      {STAGE_META[stage].short}
    </span>
  );
}

function StageIcon({ stage, active }: { stage: OrderStage; active: boolean }) {
  const size = 14;
  const weight = active ? "fill" : "regular";
  if (stage === "shipped") return <Truck size={size} weight={weight} />;
  if (stage === "making") return <Package size={size} weight={weight} />;
  return <Check size={size} weight={active ? "bold" : "regular"} />;
}

/* ---- Empty state: the kiln rests ---- */

function OrdersEmpty({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0.01 : 0.5, ease: easeOut }}
      className="mt-12 rounded-3xl border border-dashed border-bone/20 bg-ink-soft/50 px-6 py-16 text-center"
    >
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-marigold/12 text-marigold">
        <Wind size={26} weight="regular" />
      </span>
      <h2 className="mt-6 font-display text-2xl font-extrabold text-bone">
        The kiln rests today.
      </h2>
      <p className="mx-auto mt-3 max-w-md font-ui text-sm leading-relaxed text-bone/60">
        No orders on the bench. When someone buys, their piece — and how you tell
        them it&#39;s coming — will land right here.
      </p>
      <div className="mt-7 flex justify-center">
        <Link
          href="/sell/home"
          className="flex items-center gap-2 rounded-full border border-bone/25 px-5 py-2.5 font-ui text-sm font-medium text-bone transition-colors hover:border-bone/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Back to your studio
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </motion.div>
  );
}

/* ---- Error state ---- */

function OrdersError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-measure flex-col items-center px-5 pb-28 pt-40 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-error/15 text-error">
        <WarningCircle size={28} weight="regular" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-extrabold text-bone">
        We couldn&#39;t load your orders.
      </h1>
      <p className="mt-3 font-ui text-sm leading-relaxed text-bone/60">
        Nothing is lost — every order is safe. Give it another moment.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-7 rounded-full bg-marigold px-6 py-3 font-ui text-sm font-semibold text-ink transition-colors hover:bg-marigold-bright focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold-bright focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        Try again
      </button>
    </div>
  );
}

/* ---- Loading skeleton ---- */

function OrdersSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-5 pb-28 pt-24 sm:px-8 sm:pt-28" aria-hidden>
      <div className="h-3 w-24 rounded bg-ink-soft" />
      <div className="shimmer-sweep mt-5 h-14 w-2/3 max-w-md rounded-2xl bg-ink-soft" />
      <div className="shimmer-sweep mt-4 h-5 w-3/4 max-w-lg rounded-lg bg-ink-soft" />
      <div className="mt-12 space-y-5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="shimmer-sweep h-56 rounded-3xl bg-ink-soft"
          />
        ))}
      </div>
    </div>
  );
}
