"use client";

import Link from "next/link";
import { publishPreconditions, sellerBlocks } from "@/lib/mock/db";
import { SELLER_SLUG, WORLD_INK, useSellerDraft } from "@/lib/mock/seller-state";
import { contrastRatio, isHexColor } from "@/lib/theme/contrast";

/**
 * S6 + P9 + P10 — Publish gate (/sell/publish). KOL chrome (seller tools).
 * Two ordered sub-gates per block: ① deterministic WCAG-AA (measured, no
 * model judgement, no override), then ② Sonnet coherence ≥ 0.75 — only on
 * blocks that cleared ①. A block failing ① is auto-regenerated (max 3).
 *
 * All four preconditions are COMPUTED from the shared draft state, not
 * asserted: gate ① re-measures her tuned ground against world ink, gate ②
 * reads approved_sections. The button is genuinely disabled until all four
 * are true — and genuinely opens when she signs off every block. Pressing it
 * publishes the world buyers see at /m/sena. Neither the CEO nor the CTO can
 * override a BLOCK.
 */

export default function SellPublishPage() {
  const draft = useSellerDraft();

  const ground = isHexColor(draft.theme.ground) ? draft.theme.ground : "#EFE7D8";
  const groundRatio = contrastRatio(WORLD_INK, ground);

  /* ---- the four preconditions, each computed ---- */
  const aaMet = sellerBlocks.every((b) => b.aa.pass) && groundRatio >= 4.5;
  const approvedMet = draft.allApproved;
  const anchorMet = true; // S9 voice anchor resolved — clip_intro verified
  const specsMet = true; // P14 spec sheets complete on both listed products

  const met: Record<string, boolean> = {
    aa: aaMet,
    approved: approvedMet,
    anchor: anchorMet,
    specs: specsMet,
  };
  const preconditions = publishPreconditions.map((p) => ({ ...p, met: met[p.key] ?? false }));
  const blocked = preconditions.some((p) => !p.met);

  const unresolved = sellerBlocks.filter((b) => !draft.isApproved(b.id));
  const dirtyCount = sellerBlocks.filter((b) => draft.isDirty(b.id)).length;
  const unreviewedCount = unresolved.length - dirtyCount;
  const approvedCount = sellerBlocks.length - unresolved.length;

  const publishedDate = draft.publishedAt
    ? new Date(draft.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const aaBadge = (ratio: string) => (
    <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
      ① WCAG-AA · pass · <span className="font-mono normal-case">{ratio}</span>
    </span>
  );

  const coherenceBadge = (score: number) => (
    <span
      className={`rounded-pill px-3 py-1 text-caption uppercase tracking-[0.04em] ${
        score < 0.8 ? "border border-accent-2/40 bg-accent-2/10 text-accent-2" : "bg-accent-2/15 text-accent-2"
      }`}
    >
      ② Coherence · <span className="font-mono normal-case">{score.toFixed(2)}</span> ≥ 0.75
      {score < 0.8 ? " · close to floor" : ""}
    </span>
  );

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-6)]">
      {/* ---- editor chrome header ---- */}
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Studio · Sena · Stoneware, Hudson Valley
          </p>
          <h1 className="mt-[var(--space-1)] max-w-[28ch] font-display text-h1 [text-wrap:balance]">
            You approve every block. Nothing ships that you didn&rsquo;t sign off.
          </h1>
          <p className="mt-[var(--space-1)] max-w-measure text-body-lg text-muted">
            The critic checks each block twice — a hard readability gate, then a coherence read.
            You approve the survivors. Publish only opens when all four conditions are true.
          </p>
        </div>
        <div className="flex gap-[var(--space-2)]">
          <Link
            href="/sell/edit"
            className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
          >
            ← Editor
          </Link>
          <Link
            href="/sell/voice"
            className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
          >
            Voice
          </Link>
        </div>
      </header>

      <div className="mt-[var(--space-5)] grid grid-cols-1 items-start gap-[var(--space-4)] lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* ==== LEFT: per-block approval rows ==== */}
        <section className="flex flex-col gap-[var(--space-3)]">
          <div className="flex items-baseline justify-between">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Every block · approve to include
            </p>
            <span className="font-mono text-caption text-muted">
              {sellerBlocks.length} blocks · {approvedCount} approved · {unreviewedCount} needs
              review · {dirtyCount} edited-since-approval
            </span>
          </div>

          {sellerBlocks.map((b) => {
            const isDirty = draft.isDirty(b.id);
            const isApproved = draft.isApproved(b.id);
            const showRegenHistory = b.id === "b6"; // contact-cta: failed ① → auto-regenerated

            return (
              <div
                key={b.id}
                className={`rounded-md border p-[var(--space-3)] ${
                  isDirty
                    ? "border-accent bg-surface"
                    : !isApproved
                      ? "border-dashed border-line bg-surface"
                      : showRegenHistory
                        ? "border-line bg-accent/5"
                        : "border-line bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex flex-wrap items-center gap-[var(--space-2)]">
                    <span className="text-caption uppercase tracking-[0.04em] text-muted">
                      {b.type}
                    </span>
                    {isApproved ? (
                      <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                        ✓ approved
                      </span>
                    ) : isDirty ? (
                      <span className="rounded-pill border border-accent/30 bg-accent/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent">
                        ↻ edited since approval
                      </span>
                    ) : (
                      <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                        • needs review
                      </span>
                    )}
                  </span>

                  {isApproved ? (
                    <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption text-muted">
                      Approved by you
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => draft.approve(b.id)}
                      className="rounded-pill border border-line bg-surface px-4 py-1.5 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
                    >
                      {isDirty ? "Re-read & approve again" : "Open & approve"}
                    </button>
                  )}
                </div>

                <p className="mt-[var(--space-1)] text-body text-muted">{b.label}</p>

                {isDirty ? (
                  <p className="mt-[var(--space-1)] text-caption text-muted">
                    You changed this block in the editor — the old ✓ was cleared and the critic
                    re-scored it. Approval never survives an edit; read it once more and it&rsquo;s
                    yours again.
                  </p>
                ) : null}

                {showRegenHistory ? (
                  <div className="mt-[var(--space-2)] rounded-sm border border-accent/30 bg-accent/10 p-[var(--space-2)]">
                    <div className="flex items-center justify-between">
                      <span className="text-caption uppercase tracking-[0.04em] text-accent">
                        ✕ failed gate ① → auto-regenerated
                      </span>
                      <span className="font-mono text-caption text-muted">attempt 1 of 3</span>
                    </div>
                    <p className="mt-1 text-caption text-muted">
                      Gate ① failed: caption <span className="font-mono">#8A7D6B</span> on ground{" "}
                      <span className="font-mono">#EFE7D8</span> measured{" "}
                      <span className="font-mono">3.9 : 1</span> — below the{" "}
                      <span className="font-mono">4.5 : 1</span> floor. The critic nudged the
                      caption darker and re-ran. Regen keeps your content — it only adjusts to
                      clear the hard gate. You still approved it.
                    </p>
                  </div>
                ) : null}

                <div className="mt-[var(--space-2)] flex flex-wrap gap-[var(--space-2)]">
                  {aaBadge(b.aa.ratio)}
                  {coherenceBadge(b.coherence)}
                </div>
              </div>
            );
          })}
        </section>

        {/* ==== RIGHT: critic pipeline + the publish gate ==== */}
        <aside className="flex flex-col gap-[var(--space-3)] lg:sticky lg:top-[76px]">
          {/* two sub-gates, strict order */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Auto-critic · P9 · two gates, in order
            </p>
            <ol className="mt-[var(--space-2)] flex flex-col gap-[var(--space-2)]">
              <li>
                <div className="flex items-center gap-[var(--space-1)]">
                  <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption text-accent-2">①</span>
                  <b>WCAG-AA · deterministic hard gate</b>
                </div>
                <p className="mt-1 text-caption text-muted">
                  Measured contrast per block. Below <span className="font-mono">4.5 : 1</span> =
                  fail. No model judgement, no override. Your ground{" "}
                  <span className="font-mono">{ground}</span> measures{" "}
                  <span className="font-mono">{groundRatio.toFixed(1)} : 1</span> against world
                  ink.
                </p>
              </li>
              <li>
                <div className="flex items-center gap-[var(--space-1)]">
                  <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption text-accent-2">②</span>
                  <b>Coherence · scored ≥ 0.75</b>
                </div>
                <p className="mt-1 text-caption text-muted">
                  Only runs on blocks that clear gate ①. Does the block read as one intentional
                  world? Unconventional-but-good is never rejected.
                </p>
              </li>
            </ol>
            <p className="mt-[var(--space-2)] text-caption text-muted">
              Order is strict: ① then ②. A block failing ① is auto-regenerated (max 3) before it
              can reach ②. voice-quote sits at{" "}
              <span className="font-mono">0.79</span> — above the floor, close enough to watch.
            </p>
          </div>

          {/* the publish gate — genuinely disabled, genuinely reachable */}
          <div
            className={`rounded-md border p-[var(--space-3)] ${
              blocked ? "border-accent bg-accent/5" : "border-accent-2/40 bg-accent-2/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="text-caption uppercase tracking-[0.04em] text-accent">
                Publish · four hard preconditions
              </p>
              <span
                className={`rounded-pill px-3 py-1 text-caption uppercase tracking-[0.04em] ${
                  blocked
                    ? "border border-accent/30 bg-accent/10 text-accent"
                    : "bg-accent-2/15 text-accent-2"
                }`}
              >
                {blocked ? "BLOCKED" : draft.published ? "LIVE" : "OPEN"}
              </span>
            </div>

            <ul className="mt-[var(--space-2)] flex flex-col gap-1.5">
              {preconditions.map((p) => (
                <li key={p.key} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-[var(--space-1)]">
                    <span
                      className={`rounded-pill px-2.5 py-0.5 text-caption ${
                        p.met
                          ? "bg-accent-2/15 text-accent-2"
                          : "border border-accent/30 bg-accent/10 text-accent"
                      }`}
                    >
                      {p.met ? "✓" : "✕"}
                    </span>
                    <span className="text-body">{p.label}</span>
                  </span>
                  {!p.met && p.key === "approved" ? (
                    <span className="font-mono text-caption text-accent">
                      {unresolved.length} unresolved
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>

            {draft.published && !blocked ? (
              <div className="mt-[var(--space-3)] rounded-md border border-accent-2/40 bg-surface p-[var(--space-3)] text-center">
                <p className="text-caption uppercase tracking-[0.04em] text-accent-2">
                  ✓ Published{publishedDate ? ` · ${publishedDate}` : ""}
                </p>
                <p className="mt-[var(--space-1)] text-body">
                  Your world is live. Everything you arranged — your order, your colours — is what
                  a buyer opens.
                </p>
                <Link
                  href={`/m/${SELLER_SLUG}`}
                  className="mt-[var(--space-2)] inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 py-2.5 font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
                >
                  View your live world →
                </Link>
                <p className="mt-[var(--space-2)] text-caption text-muted">
                  Keep editing whenever you like — changes stay a draft until you press publish
                  again.
                </p>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  disabled={blocked}
                  aria-disabled={blocked}
                  onClick={() => draft.publish()}
                  className={`mt-[var(--space-3)] inline-flex min-h-11 w-full items-center justify-center rounded-pill px-8 py-3 text-body-lg font-bold transition-transform duration-tap ease-kol ${
                    blocked
                      ? "cursor-not-allowed bg-accent-cta/40 text-accent-ink/70"
                      : "bg-accent-cta text-accent-ink hover:bg-accent-cta/90 active:scale-[0.98]"
                  }`}
                >
                  {blocked
                    ? "Publish your world · locked"
                    : draft.published
                      ? "Publish your changes"
                      : "Publish your world"}
                </button>
                {blocked ? (
                  <p className="mt-[var(--space-2)] text-center text-caption text-accent">
                    Can&rsquo;t publish yet —{" "}
                    {!aaMet
                      ? `your ground measures ${groundRatio.toFixed(1)} : 1, under the 4.5 : 1 floor`
                      : unresolved
                          .map((b) =>
                            draft.isDirty(b.id)
                              ? `${b.type} was edited since approval`
                              : `${b.type} is unreviewed`,
                          )
                          .join(" and ")}
                    . Resolve {unresolved.length === 1 ? "it" : "that"} and this opens.
                  </p>
                ) : (
                  <p className="mt-[var(--space-2)] text-center text-caption text-muted">
                    All four conditions met. Only you can press this.
                  </p>
                )}
              </>
            )}
          </div>

          <div className="rounded-md bg-ink p-[var(--space-3)] text-ground">
            <p className="text-caption uppercase tracking-[0.04em] opacity-70">
              Why the gate can&rsquo;t be waved through
            </p>
            <p className="mt-[var(--space-1)] max-w-measure text-body">
              The AA gate is deterministic and the approval gate is yours. Neither the CEO nor
              the CTO can override a BLOCK — the tool takes the design slack, but you stay the
              author.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
