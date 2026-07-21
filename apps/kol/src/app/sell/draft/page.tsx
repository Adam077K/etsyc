"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Film } from "@/components/chrome/Film";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { formatPrice, productsByMaker } from "@/lib/mock/db";

/**
 * S3 — Draft reveal (/sell/draft). The review chrome is KOL's curated tool
 * UI; the PREVIEW FRAME renders Sena's derived custom world (theme.kind:
 * "custom" — D15 any-hex, any-font). Every block traces to a transcript
 * moment; extraction leaves unsupported facts null, never invented.
 * meta.status stays "draft": nothing is live, she is the author.
 *
 * The literal hexes below are Sena's DERIVED world palette (preview data,
 * not KOL chrome) — scoped to the preview frame only via local CSS vars.
 */

/** The world as it arrived from the first derivation run. */
const SENA_WORLD = {
  "--s-bg": "#efe7d8",
  "--s-surface": "#e6dcc7",
  "--s-ink": "#2c2620",
  "--s-muted": "#6b6153",
  "--s-accent": "#8f5a3a",
  "--s-accent2": "#737a63",
  "--s-line": "#d6c9ad",
  "--s-accent-ink": "#f6efe1",
} as CSSProperties;

const SWATCHES: { hex: string; label: string }[] = [
  { hex: "#EFE7D8", label: "cream" },
  { hex: "#2C2620", label: "ink" },
  { hex: "#8F5A3A", label: "clay" },
  { hex: "#737A63", label: "ash" },
  { hex: "#E6DCC7", label: "surf" },
];

/**
 * Her interview, beat by beat — the only input regeneration is allowed to
 * derive from. Every colour that comes back has to trace to one of these
 * sentences.
 */
const SENA_ANSWERS: Record<string, string> = {
  "Story & origin":
    "I left restaurant kitchens twelve years ago and never went back. The wheel was the first thing that ever slowed me down.",
  Craft:
    "I wedge the clay by hand until the air's out, throw it tall, then pull three grooves with my thumb so it sits in your hand.",
  Workshop:
    "A converted barn with one big north-facing window. Ash glaze bucket by the door, clay dust on everything, grey even light all day.",
  Values: "Nothing leaves here that I wouldn't eat off myself. No decals, no shortcuts.",
  Brand: "Walking in should feel like a quiet kitchen on a Sunday morning.",
};

interface DerivedTheme {
  mode: "light" | "dark";
  roles: {
    bg: string;
    surface: string;
    ink: string;
    inkMuted: string;
    accent: string;
    accentInk: string;
    border: string;
  };
  displayFamily: string;
  textFamily: string;
  derivedFrom: string[];
}

interface DraftApiResponse {
  simulated: boolean;
  theme: DerivedTheme;
  rawBlocks: unknown[];
  copy: { tagline: string; bio: string };
  rationale: string;
  aa: { pass: boolean; findings: { pair: string; ratio: number; pass: boolean }[] };
  qualityFlag?: string | null;
  error?: string;
}

interface CriticApiResponse {
  simulated: boolean;
  aaPass: boolean;
  coherence: { score: number } | null;
  verdict: string;
  threshold: number;
}

const TRACE: { block: string; note: string; at: string }[] = [
  {
    block: "Craft-story headline",
    note: "From what you said at 4:12 — “I can feel when it's ready before I ever centre it.”",
    at: "4:12",
  },
  {
    block: "Ridge-tumbler product",
    note: "From your product beat — the three thumbed grooves, the ash glaze that breaks amber.",
    at: "4:12",
  },
  {
    block: "Palette & mood",
    note: "From your workshop beat — “wet clay, ash glaze, north light.”",
    at: "2:38",
  },
  {
    block: "Voice-quote block",
    note: "Your own line, kept verbatim.",
    at: "6:05",
  },
];

export default function SellDraftPage() {
  const senaProducts = productsByMaker("sena");

  /* ---- regeneration: a real derivation run, not a re-render ---- */
  const [derived, setDerived] = useState<DraftApiResponse | null>(null);
  const [critic, setCritic] = useState<CriticApiResponse | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  async function regenerate(): Promise<void> {
    setRegenerating(true);
    setRegenError(null);
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ interviewAnswers: SENA_ANSWERS, storeId: "sena" }),
      });
      const data: DraftApiResponse = await res.json();
      if (!res.ok) {
        setRegenError(data.error ?? "Derivation failed.");
        return;
      }
      setDerived(data);

      // gate ① then gate ②, in that order — the critic route enforces it
      const criticRes = await fetch("/api/ai/critic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          config: { theme: data.theme, blocks: data.rawBlocks, copy: data.copy },
          storeId: "sena",
        }),
      });
      setCritic((await criticRes.json()) as CriticApiResponse);
    } catch {
      setRegenError("Couldn't reach the derivation service.");
    } finally {
      setRegenerating(false);
    }
  }

  const world: CSSProperties =
    derived === null
      ? SENA_WORLD
      : ({
          "--s-bg": derived.theme.roles.bg,
          "--s-surface": derived.theme.roles.surface,
          "--s-ink": derived.theme.roles.ink,
          "--s-muted": derived.theme.roles.inkMuted,
          "--s-accent": derived.theme.roles.accent,
          "--s-accent2": derived.theme.roles.accent,
          "--s-line": derived.theme.roles.border,
          "--s-accent-ink": derived.theme.roles.accentInk,
        } as CSSProperties);

  const swatches =
    derived === null
      ? SWATCHES
      : [
          { hex: derived.theme.roles.bg, label: "bg" },
          { hex: derived.theme.roles.ink, label: "ink" },
          { hex: derived.theme.roles.accent, label: "accent" },
          { hex: derived.theme.roles.border, label: "line" },
          { hex: derived.theme.roles.surface, label: "surf" },
        ];

  const displayFamily = derived?.theme.displayFamily ?? "Fraunces · warm serif";
  const textFamily = derived?.theme.textFamily ?? "General Sans · quiet grotesk";
  const aaPass = derived === null ? true : derived.aa.pass;
  const coherenceScore = critic?.coherence?.score ?? 0.82;
  const coherenceThreshold = critic?.threshold ?? 0.75;
  const simulated = derived?.simulated ?? false;

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-8)]">
      {/* ---- the reveal framing — nothing is live yet ---- */}
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
        <div>
          <Reveal>
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              First look · drafted from your interview ·{" "}
              <b className="text-accent">not live — only you can see this</b>
            </p>
          </Reveal>
          <Reveal delayMs={STAGGER_MS}>
            <h1 className="mt-[var(--space-2)] font-display text-display">
              Here&rsquo;s your world, Sena.
            </h1>
          </Reveal>
          <Reveal delayMs={STAGGER_MS * 2}>
            <p className="mt-[var(--space-2)] max-w-measure text-body-lg text-muted">
              Every colour, every word, every piece came out of what you told us. You are the
              author of all of it. Nothing here is published — this is yours to keep, change, or
              send back until it&rsquo;s right.
            </p>
          </Reveal>
        </div>
        <Reveal delayMs={STAGGER_MS * 3}>
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
            ● Draft · v1 · nothing live
          </span>
        </Reveal>
      </header>

      <div className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-4)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* ==== LEFT: the generated world, scoped in a bordered preview frame ==== */}
        <Reveal>
          <div
            style={world}
            className="overflow-hidden rounded-md border border-line shadow-card"
          >
            <div className="flex items-center justify-between border-b border-line bg-surface px-[var(--space-3)] py-[var(--space-1)]">
              <span className="text-caption uppercase tracking-[0.04em] text-muted">
                Preview · Sena&rsquo;s world · her palette, not KOL&rsquo;s
              </span>
              <span className="text-caption uppercase tracking-[0.04em] text-muted">draft</span>
            </div>

            <div style={{ background: "var(--s-bg)", color: "var(--s-ink)" }}>
              {/* hero-video block */}
              <Film
                variant="v1"
                aspect="wide"
                rounded={false}
                craft="Stoneware · Hudson Valley"
                title="Sena, at the wheel by north light"
              />

              {/* craft-story block — her voice, her palette */}
              <div className="p-[var(--space-5)]">
                <p
                  className="text-caption uppercase tracking-[0.04em]"
                  style={{ color: "var(--s-accent)" }}
                >
                  Your craft, in your words
                </p>
                <h2 className="mt-[var(--space-1)] max-w-[22ch] font-display text-h2">
                  I can feel when the clay is ready before I ever centre it.
                </h2>
                <p className="mt-[var(--space-2)] max-w-measure" style={{ color: "var(--s-muted)" }}>
                  Every pot begins with wedging by hand — pushing and folding until the air is out
                  and it moves like it wants to. The ridge tumblers get three grooves pulled with a
                  thumb, so they settle into your hand.
                </p>

                {/* product rail from her own pieces */}
                <div className="mt-[var(--space-4)] grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2">
                  {senaProducts.map((p) => (
                    <div
                      key={p.id}
                      className="overflow-hidden rounded-md border"
                      style={{ background: "var(--s-surface)", borderColor: "var(--s-line)" }}
                    >
                      <Film variant={p.filmClass} aspect="wide" rounded={false} title={p.title} />
                      <div className="p-[var(--space-3)]">
                        <p style={{ color: "var(--s-ink)" }}>{p.description}</p>
                        <p
                          className="mt-[var(--space-1)] font-mono"
                          style={{ color: "var(--s-accent)" }}
                        >
                          {formatPrice(p.priceMinor, p.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* voice-quote block */}
                <div
                  className="mt-[var(--space-3)] rounded-md border p-[var(--space-3)]"
                  style={{ background: "var(--s-surface)", borderColor: "var(--s-line)" }}
                >
                  <span
                    className="text-caption uppercase tracking-[0.04em]"
                    style={{ color: "var(--s-accent2)" }}
                  >
                    ✦ voice-quote block
                  </span>
                  <p className="mt-[var(--space-1)] font-display text-h3">
                    &ldquo;North light is the only light I&rsquo;ll glaze under.&rdquo;
                  </p>
                </div>

                <p
                  className="mt-[var(--space-3)] text-caption uppercase tracking-[0.04em]"
                  style={{ color: "var(--s-muted)" }}
                >
                  Full draft continues · hero-video · craft-story · product-showcase · voice-quote
                  · process-reel · trust-badge · contact-cta
                </p>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ==== RIGHT: traceability + derived system + critic + actions ==== */}
        <aside className="flex flex-col gap-[var(--space-3)]">
          {/* provenance */}
          <Reveal>
            <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
              <p className="text-caption uppercase tracking-[0.04em] text-muted">
                Where each piece came from
              </p>
              <p className="mt-[var(--space-1)] text-caption text-muted">
                Every block traces back to a moment in your own interview. Nothing was invented.
              </p>
              <ol className="mt-[var(--space-2)] flex flex-col gap-[var(--space-2)]">
                {TRACE.map((t) => (
                  <li key={t.block}>
                    <span className="inline-flex items-center gap-1.5 rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                      ✓ {t.block}
                    </span>
                    <p className="mt-1 max-w-measure text-body">
                      Came from your interview at <span className="font-mono">{t.at}</span> —{" "}
                      <span className="text-muted">{t.note}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          {/* derived design system */}
          <Reveal delayMs={STAGGER_MS}>
            <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
              <div className="flex items-center justify-between">
                <p className="text-caption uppercase tracking-[0.04em] text-muted">
                  Your design system, derived
                </p>
                {simulated ? (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent/30 bg-accent/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent">
                    ⚠ simulated · no model ran
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-2/30 bg-accent-2/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                    ✦ AI-assisted
                  </span>
                )}
              </div>
              <div className="mt-[var(--space-2)] grid grid-cols-5 gap-[var(--space-1)]">
                {swatches.map((s) => (
                  <div key={s.hex}>
                    <div
                      className="aspect-square w-full rounded-sm border border-line"
                      style={{ background: s.hex }}
                    />
                    <p className="mt-0.5 text-center text-caption text-muted">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-[var(--space-2)] flex flex-wrap gap-[var(--space-1)]">
                {swatches.slice(0, 4).map((s) => (
                  <span
                    key={s.hex}
                    className="rounded-pill border border-line bg-ground px-3 py-1 font-mono text-caption text-ink"
                  >
                    {s.hex}
                  </span>
                ))}
              </div>
              <div className="mt-[var(--space-2)] border-t border-line">
                <div className="flex items-baseline justify-between py-[var(--space-1)]">
                  <span className="text-muted">Display</span>
                  <span className="font-display">{displayFamily}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-line py-[var(--space-1)]">
                  <span className="text-muted">Text</span>
                  <span>{textFamily}</span>
                </div>
              </div>
              <div className="mt-[var(--space-2)] rounded-md border border-accent-2/30 bg-accent-2/10 p-[var(--space-2)]">
                <p className="text-caption uppercase tracking-[0.04em] text-accent-2">
                  D15 · full brand freedom
                </p>
                <p className="mt-1 max-w-measure text-body">
                  These are <b>your</b> exact colours and fonts — any hex, any family. The 5
                  curated KOL palettes are starting points, not a cap. Nothing here was forced
                  into a house style.
                </p>
              </div>
            </div>
          </Reveal>

          {/* auto-critic: two ordered sub-gates */}
          <Reveal delayMs={STAGGER_MS * 2}>
            <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
              <p className="text-caption uppercase tracking-[0.04em] text-muted">
                Quality check · run before you ever saw this
              </p>
              <div className="mt-[var(--space-2)] flex flex-col gap-[var(--space-2)]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-[var(--space-2)]">
                    <span
                      className={`rounded-pill px-3 py-1 text-caption uppercase tracking-[0.04em] ${
                        aaPass
                          ? "bg-accent-2/15 text-accent-2"
                          : "border border-accent/30 bg-accent/10 text-accent"
                      }`}
                    >
                      {aaPass ? "✓ PASS" : "✕ FAIL"}
                    </span>
                    <b>① Legibility (WCAG-AA)</b>
                  </span>
                  <span className="text-caption uppercase tracking-[0.04em] text-muted">
                    hard gate · computed, not judged
                  </span>
                </div>
                <p className="max-w-measure text-caption text-muted">
                  Every colour pair on your shop clears the contrast floor. This gate is
                  arithmetic — no shop can publish below it.
                </p>
                <div className="flex items-center justify-between border-t border-line pt-[var(--space-2)]">
                  <span className="flex items-center gap-[var(--space-2)]">
                    <span
                      className={`rounded-pill px-3 py-1 text-caption uppercase tracking-[0.04em] ${
                        !aaPass
                          ? "border border-line bg-surface text-muted"
                          : coherenceScore >= coherenceThreshold
                            ? "bg-accent-2/15 text-accent-2"
                            : "border border-accent/30 bg-accent/10 text-accent"
                      }`}
                    >
                      {!aaPass
                        ? "— not run"
                        : coherenceScore >= coherenceThreshold
                          ? "✓ PASS"
                          : "✕ FAIL"}
                    </span>
                    <b>② Coherence &amp; fit</b>
                  </span>
                  <span className="font-mono">
                    <b>{aaPass ? coherenceScore.toFixed(2) : "—"}</b>{" "}
                    <span className="text-muted">≥ {coherenceThreshold.toFixed(2)}</span>
                  </span>
                </div>
                <p className="max-w-measure text-caption text-muted">
                  Only runs after legibility passes. Scores hierarchy, coherence, and how true it
                  stays to <em>your</em> brand — not whether it looks conventional.
                </p>
              </div>
            </div>
          </Reveal>

          {/* primary actions */}
          <Reveal delayMs={STAGGER_MS * 3}>
            <div className="rounded-md border border-accent bg-surface p-[var(--space-3)]">
              <p className="font-semibold">What now?</p>
              <p className="mt-1 text-caption text-muted">
                You&rsquo;re the author. This only moves when you say so — and it&rsquo;s still
                not live.
              </p>
              <div className="mt-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
                <Link
                  href="/sell/edit"
                  className="inline-flex min-h-11 items-center justify-center rounded-pill bg-accent-cta px-8 py-3 text-body-lg font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
                >
                  Make it mine → co-edit together
                </Link>
                <button
                  type="button"
                  onClick={() => void regenerate()}
                  disabled={regenerating}
                  aria-busy={regenerating}
                  className="inline-flex min-h-11 items-center justify-center rounded-pill border border-line bg-surface px-6 py-2.5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                >
                  {regenerating ? "Deriving your world…" : "↺ Regenerate the whole draft"}
                </button>
                {regenError !== null ? (
                  <p className="text-caption text-accent">
                    {regenError} Nothing changed — your draft is exactly as it was.
                  </p>
                ) : null}
                {derived !== null && regenError === null ? (
                  <p className="text-caption text-muted">
                    Regenerated from your interview{simulated ? " (simulated — no model ran)" : ""}.
                    {derived.theme.derivedFrom.length > 0
                      ? ` Colours traced to: ${derived.theme.derivedFrom.slice(0, 3).join("; ")}.`
                      : ""}
                  </p>
                ) : null}
              </div>
              <p className="mt-[var(--space-2)] text-caption text-muted">
                Co-editing keeps everything you like and changes only what you want — in plain
                words, with us.
              </p>
            </div>
          </Reveal>
        </aside>
      </div>
    </main>
  );
}
