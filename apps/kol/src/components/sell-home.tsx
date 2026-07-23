"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BookmarkSimple,
  ChatCircle,
  PaintBrushBroad,
  Package,
  Play,
  Plus,
  UsersThree,
  VideoCamera,
  WarningCircle,
} from "@phosphor-icons/react";
import { COVER_MAKER } from "@/lib/fixtures/makers";
import {
  HQ_MAKER,
  HQ_PULSE,
  SELLER_ORDERS,
  type SellerOrder,
} from "@/lib/fixtures/sell-orders";
import { MakerFilm } from "./maker-film";
import { Magnetic } from "./magnetic";
import { rise, stagger, calm, easeOut } from "@/lib/motion";
import { cap, cn } from "@/lib/utils";

type HomeState = "default" | "empty" | "error";

export function SellHome() {
  const reduce = useReducedMotion();
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<HomeState>("default");
  const [greeting, setGreeting] = useState("Hello");

  // Compose the day on arrival — a short, honest loading beat. Time-of-day
  // greeting + any ?state= override are read post-mount to avoid a hydration
  // mismatch on the statically-prerendered page (mirrors the studio pattern).
  useEffect(() => {
    const h = new Date().getHours();
    const g = h < 12 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
    // ?state=empty|error is a DEMO-ONLY affordance for this screens-only pass;
    // a wired build drives these from real data, not the query string.
    const s = new URLSearchParams(window.location.search).get("state");
    // Defer all state into the reveal beat — no synchronous setState in the
    // effect body (avoids cascading renders), matching the studio pattern.
    const t = setTimeout(
      () => {
        setGreeting(g);
        if (s === "empty" || s === "error") setState(s);
        setLoading(false);
      },
      reduce ? 200 : 900,
    );
    return () => clearTimeout(t);
  }, [reduce]);

  if (loading) return <HomeSkeleton />;
  if (state === "error") return <HomeError onRetry={() => setState("default")} />;

  const awaiting = SELLER_ORDERS.filter((o) => o.stage !== "shipped");
  const soonest = awaiting[0];

  return (
    <div className="mx-auto max-w-issue px-5 pb-28 pt-24 sm:px-8 sm:pt-28">
      {/* Greeting — the day leads. */}
      <motion.header
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0.01 : 0.5, ease: easeOut }}
      >
        <p className="meta text-marigold">Your studio · KOL</p>
        <h1
          className="mt-4 font-display font-extrabold leading-[0.95] text-bone"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4.25rem)" }}
        >
          {greeting}, {HQ_MAKER.name}.
        </h1>
        <p className="mt-4 max-w-measure font-ui text-lg leading-relaxed text-bone/75">
          {state === "empty"
            ? "Your world just went live. The issue reshuffles overnight — the first faces arrive in the morning."
            : awaiting.length > 0
              ? `${cap(count(awaiting.length))} ${awaiting.length === 1 ? "piece is" : "pieces are"} waiting to be made, and ${HQ_PULSE.metThisWeek} new people met you this week.`
              : `The bench is clear, and ${HQ_PULSE.metThisWeek} new people met you this week.`}
        </p>
      </motion.header>

      {/* The world-preview film — the maker's own brand leads the frame (the one
          D15 exception on KOL chrome: her world's cover, as a thumbnail). */}
      <WorldPreview reduce={!!reduce} />

      {state === "empty" ? (
        <EmptyPulse reduce={!!reduce} />
      ) : (
        <>
          <Pulse reduce={!!reduce} />
          <NeedsYou reduce={!!reduce} awaiting={awaiting} soonest={soonest} />
        </>
      )}

      <QuickActions reduce={!!reduce} />
    </div>
  );
}

function count(n: number): string {
  const words = ["no", "one", "two", "three", "four", "five", "six"];
  return words[n] ?? String(n);
}

/* ---- World preview: the cover film, live seal, address ---- */

function WorldPreview({ reduce }: { reduce: boolean }) {
  return (
    <motion.section
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0.01 : 0.6, ease: easeOut }}
      className="mt-10 overflow-hidden rounded-3xl ring-1 ring-line"
      aria-label="Your live world"
    >
      <div className="relative aspect-[16/10] sm:aspect-[16/7]">
        <MakerFilm
          videoSrc={COVER_MAKER.filmSrc}
          poster={COVER_MAKER.image}
          alt={`${HQ_MAKER.studio} — your live world`}
          reduce={reduce}
          sizes="(max-width: 96rem) 100vw, 96rem"
          priority
        />
        {/* Bottom scrim so the address + kicker clear AA over film. */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-transparent" />

        {/* LIVE seal — matches the publish celebration seal. */}
        <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full border border-bone/70 bg-ink/40 px-3 py-1 backdrop-blur-sm sm:right-6 sm:top-6">
          <span
            className={cn(
              "h-2 w-2 rounded-full bg-marigold",
              !reduce && "animate-pulse",
            )}
          />
          <span className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-bone">
            Live
          </span>
        </span>

        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
          <div className="min-w-0">
            <p className="meta text-bone/80">Your world is live at</p>
            <p className="mt-1.5 font-mono text-lg text-bone sm:text-2xl">
              {HQ_MAKER.handle}
            </p>
          </div>
          <Magnetic>
            <Link
              href={HQ_MAKER.worldHref}
              className="flex shrink-0 items-center gap-2 rounded-full bg-bone px-5 py-2.5 font-ui text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bone focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Visit your world
              <ArrowUpRight size={17} weight="bold" />
            </Link>
          </Magnetic>
        </div>
      </div>
    </motion.section>
  );
}

/* ---- The week: human numbers, editorial voice, one sparkline ---- */

function Pulse({ reduce }: { reduce: boolean }) {
  return (
    <section className="mt-16" aria-label="Your week">
      <p className="meta text-bone-dim">This week in your world</p>

      <motion.div
        variants={stagger(0.05, 0.09)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]"
      >
        {/* Lead stat carries the single sparkline. */}
        <motion.div
          variants={reduce ? calm : rise(16, 0.5)}
          className="flex flex-col justify-between rounded-3xl border border-line bg-ink-soft p-6 sm:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-5xl font-extrabold leading-none text-bone sm:text-6xl">
                {HQ_PULSE.metThisWeek}
              </p>
              <p className="mt-3 flex items-center gap-2 font-ui text-sm text-bone/70">
                <UsersThree size={16} weight="fill" className="text-marigold" />
                people met your world
              </p>
            </div>
            <Sparkline data={HQ_PULSE.visits} reduce={reduce} />
          </div>
          <p className="mt-6 font-ui text-sm leading-relaxed text-bone/55">
            Up from a quiet start on Monday — the issue put you in front of
            more rooms as the week went on.
          </p>
        </motion.div>

        <StatLine
          reduce={reduce}
          value={HQ_PULSE.watchedFilm}
          icon={<Play size={16} weight="fill" className="text-marigold" />}
          label="watched your film to the end"
          voice="They stayed for the whole minute — that's the part that turns into trust."
        />
        <StatLine
          reduce={reduce}
          value={HQ_PULSE.savedYou}
          icon={<BookmarkSimple size={16} weight="fill" className="text-marigold" />}
          label="saved you for later"
          voice="Quietly kept, to come back to when the shelf has space."
        />
      </motion.div>
    </section>
  );
}

function StatLine({
  reduce,
  value,
  icon,
  label,
  voice,
}: {
  reduce: boolean;
  value: number;
  icon: React.ReactNode;
  label: string;
  voice: string;
}) {
  return (
    <motion.div
      variants={reduce ? calm : rise(16, 0.5)}
      className="flex flex-col justify-between rounded-3xl border border-line bg-ink-soft p-6 sm:p-7"
    >
      <div>
        <p className="font-display text-5xl font-extrabold leading-none text-bone sm:text-6xl">
          {value}
        </p>
        <p className="mt-3 flex items-center gap-2 font-ui text-sm text-bone/70">
          {icon}
          {label}
        </p>
      </div>
      <p className="mt-6 font-ui text-sm leading-relaxed text-bone/55">{voice}</p>
    </motion.div>
  );
}

/* A single elegant sparkline — the only dataviz on the page (no chart-junk). */
function Sparkline({ data, reduce }: { data: readonly number[]; reduce: boolean }) {
  const fillId = useId();
  const w = 96;
  const h = 44;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return [x, y] as const;
  });
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `0,${h} ${line} ${w},${h}`;
  const [lx, ly] = pts[pts.length - 1]!;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className="shrink-0 overflow-visible"
      role="img"
      aria-label={`Visits rose to ${max} across the last seven days`}
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E4922C" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#E4922C" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${fillId})`} />
      <motion.polyline
        points={line}
        fill="none"
        stroke="#E4922C"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? undefined : { pathLength: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: easeOut }}
      />
      <circle cx={lx} cy={ly} r={3} fill="#F2A93B" />
    </svg>
  );
}

/* ---- What needs you — editorial rows, never a data table ---- */

function NeedsYou({
  reduce,
  awaiting,
  soonest,
}: {
  reduce: boolean;
  awaiting: SellerOrder[];
  soonest?: SellerOrder;
}) {
  return (
    <section className="mt-16" aria-label="What needs you">
      <p className="meta text-bone-dim">What needs you</p>
      <motion.ul
        variants={stagger(0.04, 0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-6 space-y-3"
      >
        <NeedRow
          reduce={reduce}
          href="/sell/orders"
          icon={<Package size={22} weight="regular" />}
          title={
            awaiting.length > 0
              ? `${cap(count(awaiting.length))} ${awaiting.length === 1 ? "piece" : "pieces"} to make`
              : "Nothing on the bench"
          }
          body={
            soonest
              ? `${soonest.buyerName}'s order is promised first — by ${soonest.promised}.`
              : "You're all caught up. The kiln can rest."
          }
        />
        <NeedRow
          reduce={reduce}
          href="/sell/messages"
          icon={<ChatCircle size={22} weight="regular" />}
          title={`${cap(count(HQ_PULSE.questions))} ${HQ_PULSE.questions === 1 ? "question" : "questions"} waiting`}
          body="From buyers who want to hear it from you before they buy."
        />
      </motion.ul>
    </section>
  );
}

function NeedRow({
  reduce,
  href,
  icon,
  title,
  body,
}: {
  reduce: boolean;
  href: string;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <motion.li variants={reduce ? calm : rise(14, 0.5)}>
      <Link
        href={href}
        className="group flex items-center gap-4 rounded-2xl border border-line bg-ink-soft px-5 py-4 transition-colors hover:border-bone/25 hover:bg-ink-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-marigold/12 text-marigold">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-ui text-base font-semibold text-bone">{title}</p>
          <p className="mt-0.5 font-ui text-sm text-bone/60">{body}</p>
        </div>
        <ArrowRight
          size={18}
          weight="bold"
          className="shrink-0 text-bone/40 transition-all group-hover:translate-x-1 group-hover:text-marigold"
        />
      </Link>
    </motion.li>
  );
}

/* ---- Quick actions ---- */

function QuickActions({ reduce }: { reduce: boolean }) {
  const actions = [
    {
      href: "/sell/studio",
      icon: <PaintBrushBroad size={20} weight="regular" />,
      label: "Edit your world",
      note: "Reopen the studio",
    },
    {
      href: "/sell/clips",
      icon: <VideoCamera size={20} weight="regular" />,
      label: "Re-record a clip",
      note: "Refilm a moment",
    },
    {
      href: "/sell/studio?section=shop",
      icon: <Plus size={20} weight="bold" />,
      label: "Add a piece",
      note: "List something new",
    },
  ];
  return (
    <section className="mt-16" aria-label="Quick actions">
      <p className="meta text-bone-dim">Quick actions</p>
      <motion.div
        variants={stagger(0.04, 0.08)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-60px" }}
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        {actions.map((a) => (
          <motion.div key={a.href} variants={reduce ? calm : rise(14, 0.5)}>
            <Link
              href={a.href}
              className="group flex h-full items-center gap-3.5 rounded-2xl border border-line bg-ink-soft px-5 py-4 transition-colors hover:border-marigold/40 hover:bg-ink-raise focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-bone/15 text-bone transition-colors group-hover:border-marigold/50 group-hover:text-marigold">
                {a.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-ui text-sm font-semibold text-bone">
                  {a.label}
                </span>
                <span className="block font-ui text-xs text-bone/55">{a.note}</span>
              </span>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ---- Empty state: a fresh maker with no week yet ---- */

function EmptyPulse({ reduce }: { reduce: boolean }) {
  return (
    <motion.section
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0.01 : 0.5, ease: easeOut }}
      className="mt-14 rounded-3xl border border-dashed border-bone/20 bg-ink-soft/50 px-6 py-14 text-center"
    >
      <p className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-marigold/12 text-marigold">
        <UsersThree size={26} weight="regular" />
      </p>
      <h2 className="mt-6 font-display text-2xl font-extrabold text-bone">
        No faces yet — and that&#39;s exactly right.
      </h2>
      <p className="mx-auto mt-3 max-w-md font-ui text-sm leading-relaxed text-bone/60">
        The issue reshuffles overnight and puts new makers in front of buyers by
        morning. Your numbers will start filling this page tomorrow.
      </p>
      <div className="mt-7 flex justify-center">
        <Link
          href="/sell/studio"
          className="flex items-center gap-2 rounded-full border border-bone/25 px-5 py-2.5 font-ui text-sm font-medium text-bone transition-colors hover:border-bone/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          Polish your world while you wait
          <ArrowRight size={16} weight="bold" />
        </Link>
      </div>
    </motion.section>
  );
}

/* ---- Error state ---- */

function HomeError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto flex max-w-measure flex-col items-center px-5 pb-28 pt-40 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full bg-error/15 text-error">
        <WarningCircle size={28} weight="regular" />
      </span>
      <h1 className="mt-6 font-display text-3xl font-extrabold text-bone">
        We couldn&#39;t load your studio.
      </h1>
      <p className="mt-3 font-ui text-sm leading-relaxed text-bone/60">
        Your world is safe and still live — this is only the dashboard. Give it
        another moment.
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

/* ---- Loading skeleton: warm shimmer, no spinner ---- */

function HomeSkeleton() {
  return (
    <div
      className="mx-auto max-w-issue px-5 pb-28 pt-24 sm:px-8 sm:pt-28"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Loading your studio…</span>
      <div aria-hidden>
        <div className="h-3 w-28 rounded bg-ink-soft" />
        <div className="shimmer-sweep mt-5 h-14 w-3/4 max-w-xl rounded-2xl bg-ink-soft" />
        <div className="shimmer-sweep mt-4 h-5 w-2/3 max-w-md rounded-lg bg-ink-soft" />
        <div className="shimmer-sweep mt-10 aspect-[16/10] w-full rounded-3xl bg-ink-soft sm:aspect-[16/7]" />
        <div className="mt-16 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer-sweep h-44 rounded-3xl bg-ink-soft" />
          ))}
        </div>
        <div className="mt-16 space-y-3">
          {[0, 1].map((i) => (
            <div key={i} className="shimmer-sweep h-20 rounded-2xl bg-ink-soft" />
          ))}
        </div>
      </div>
    </div>
  );
}
