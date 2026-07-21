"use client";

/**
 * Co-Create (B14) — /m/[maker]/create. Guided co-creation riding on
 * P15 threads: brief → conversation → drafts → approve → make. A
 * conversation between two people, never a configurator. Approval is
 * EXPLICIT and versioned — bound to v3, not "latest" — and pricing,
 * deposit split, and timeline are visible before any money moves.
 */

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, getMaker, getProduct } from "@/lib/mock/db";
import { Film } from "@/components/chrome/Film";

const STEPS = ["Brief", "Conversation", "Drafts & revisions", "Approve", "Make"] as const;

const REVISIONS: Record<number, { label: string; note: string }> = {
  1: {
    label: "first dye pass",
    note: "First full-size panel test — pattern spacing set, indigo still one dip shy.",
  },
  2: {
    label: "darker border",
    note: "Border pulled from the deep dip. It reads heavy against the panels — see the film.",
  },
  3: {
    label: "border kept light",
    note: "Border kept light, corners deepened. The quilt breathes and the corners anchor it — this is the one I'd sew.",
  },
};

function VoicePill({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex min-h-11 items-center gap-3 self-start rounded-pill border border-line bg-ground px-4 py-2 transition-colors duration-state ease-kol hover:bg-surface"
    >
      <span aria-hidden className="flex items-center gap-[3px]">
        {[6, 12, 8, 14, 5, 11, 7].map((h, i) => (
          <span key={i} className="w-[3px] rounded-pill bg-accent" style={{ height: `${h}px` }} />
        ))}
      </span>
      <span className="text-caption uppercase tracking-[0.04em] text-ink">{label}</span>
    </button>
  );
}

export default function CoCreatePage({ params }: { params: Promise<{ maker: string }> }) {
  const { maker: slug } = use(params);
  const [rev, setRev] = useState<number>(3);
  const [approved, setApproved] = useState(false);

  const maker = getMaker(slug);
  if (!maker) notFound();

  const quilt = getProduct("commission-quilt");
  const totalMinor = quilt?.priceMinor ?? 88000;
  const depositMinor = Math.round(totalMinor * 0.4);
  const balanceMinor = totalMinor - depositMinor;
  const currentStep = approved ? 3 : 2; // 0-indexed into STEPS

  const currentRevision = REVISIONS[rev] ?? REVISIONS[3];

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-24">
      {/* opener — two people, not a configurator */}
      <header className="flex flex-wrap items-start justify-between gap-6 py-10">
        <div className="max-w-[56ch]">
          <p className="text-caption uppercase tracking-[0.08em] text-muted">
            Co-creation · with {maker.name} · {maker.craft}, {maker.location}
          </p>
          <h1 className="mt-2 font-display text-display text-ink [text-wrap:balance]">
            Make something that could only be yours.
          </h1>
          <p className="mt-3 max-w-measure text-body-lg text-muted">
            This isn&rsquo;t a set of dropdowns. It&rsquo;s a conversation with the person
            whose hands will make it — a brief, some back-and-forth, drafts you approve,
            then the making.
          </p>
        </div>
        <div className="w-[clamp(180px,22vw,240px)] flex-none">
          <Film variant={maker.filmClass} aspect="portrait">
            <p className="text-caption uppercase opacity-85">Your maker</p>
            <p className="font-display text-h3 font-bold">{maker.name}, at work</p>
          </Film>
        </div>
      </header>

      {/* stepper */}
      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Co-creation steps">
        {STEPS.map((label, i) => {
          const done = i < currentStep;
          const current = i === currentStep;
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className={`rounded-pill border px-3 py-1 text-caption uppercase tracking-[0.04em] ${
                current
                  ? "border-transparent bg-accent text-accent-ink"
                  : done
                    ? "border-line bg-surface text-ink"
                    : "border-line bg-surface text-muted opacity-60"
              }`}
            >
              {i + 1} · {label}
              {done ? " ✓" : ""}
            </li>
          );
        })}
      </ol>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        {/* LEFT — collapsed done steps + the live step */}
        <div className="flex flex-col gap-4">
          {/* step 1 — brief, collapsed but still visible */}
          <details className="overflow-hidden rounded-md border border-line bg-surface shadow-subtle">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
              <span className="flex flex-wrap items-center gap-3">
                <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                  ✓ Step 1 · Brief
                </span>
                <b className="text-body text-ink">An anniversary quilt, sea-dark</b>
              </span>
              <span className="text-caption uppercase tracking-[0.04em] text-muted">Open</span>
            </summary>
            <div className="border-t border-line">
              {[
                ["Recipient", "Us — a quilt for the bed we finally bought"],
                ["Occasion", "Tenth anniversary · no hard deadline"],
                ["Meaning", "The sea at night — deep indigo, almost black at the edges"],
                ["Preferences", "Around 220 × 240 cm, hand-quilted, indigo family only"],
              ].map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex items-baseline justify-between gap-4 px-4 py-3 ${
                    i > 0 ? "border-t border-line" : ""
                  }`}
                >
                  <span className="flex-none text-body text-muted">{k}</span>
                  <span className="text-right text-body text-ink">{v}</span>
                </div>
              ))}
            </div>
          </details>

          {/* step 2 — conversation, collapsed */}
          <details className="overflow-hidden rounded-md border border-line bg-surface shadow-subtle">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
              <span className="flex flex-wrap items-center gap-3">
                <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                  ✓ Step 2 · Conversation
                </span>
                <b className="text-body text-ink">Settled on panel layout</b>
              </span>
              <Link
                href="/inbox/t-quilt"
                className="inline-flex min-h-11 items-center text-caption uppercase tracking-[0.04em] text-muted transition-colors duration-state ease-kol hover:text-ink"
              >
                Open thread
              </Link>
            </summary>
            <div className="flex flex-col gap-3 border-t border-line p-4">
              <p className="max-w-measure text-body text-muted">
                &ldquo;Sea at night wants nine dips, not seven — the extra two are where the
                black lives. Want the panels to keep a little cloud, or go fully dark?&rdquo;
              </p>
              <VoicePill label={`Hear ${maker.name} ask it · 0:22`} />
            </div>
          </details>

          {/* step 3 — EXPANDED: drafts + revision history */}
          <section className="rounded-md border border-accent bg-surface p-5 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-pill bg-accent px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-ink">
                  {approved ? "Step 3 · Done ✓" : "Step 3 · Now"}
                </span>
                <h2 className="font-display text-h3 text-ink">Shared drafts</h2>
              </div>
              <span className="text-caption text-muted">3 revisions</span>
            </div>

            {/* revision chips */}
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Revisions">
              {[1, 2, 3].map((v) => {
                const current = v === rev;
                const meta = REVISIONS[v];
                return (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={current}
                    onClick={() => setRev(v)}
                    className={`inline-flex min-h-11 items-center rounded-pill border px-3 text-caption uppercase tracking-[0.04em] transition-colors duration-state ease-kol ${
                      current
                        ? "border-transparent bg-accent text-accent-ink"
                        : "border-line bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    v{v} · {meta?.label ?? ""}
                    {v === 3 ? " ← current" : ""}
                  </button>
                );
              })}
            </div>

            {/* side by side: draft film + maker's voice */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Film variant={maker.filmClass} aspect="square">
                  <p className="text-caption uppercase opacity-85">
                    Draft v{rev} · filmed on the table
                  </p>
                  <p className="font-display text-h3 font-bold">
                    {rev === 3 ? "The quilt, corner to corner" : `Panel test, v${rev}`}
                  </p>
                </Film>
                <p className="mt-2 text-caption text-muted">
                  Tap to watch {maker.name} walk the cloth under the light
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <span className="self-start rounded-pill border border-line bg-ground px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                  {maker.name}&rsquo;s note on v{rev}
                </span>
                <p className="max-w-measure text-body text-ink">
                  &ldquo;{currentRevision?.note ?? ""}&rdquo;
                </p>
                <VoicePill label="Hear the note · 0:41" />
                <div className="rounded-md border border-line bg-ground p-4">
                  <p className="text-caption uppercase tracking-[0.04em] text-accent">
                    Your reply to v2 → became v3
                  </p>
                  <p className="mt-1 max-w-measure text-body text-ink">
                    &ldquo;The second panel feels right. Could the border pull from the same
                    dark dip?&rdquo;
                  </p>
                </div>
              </div>
            </div>

            {/* approval — explicit, versioned, advances the stepper */}
            {approved ? (
              <div className="mt-5 rounded-md border border-line bg-ground p-5">
                <span className="rounded-pill bg-accent px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-ink">
                  Step 4 · Approved
                </span>
                <p className="mt-3 text-body-lg font-semibold text-ink">
                  v3 approved — {maker.name} opens the vat.
                </p>
                <div className="mt-3 max-w-[44ch]">
                  <div className="flex items-baseline justify-between border-t border-line py-2">
                    <span className="text-body text-muted">Deposit due now (40%)</span>
                    <span className="font-mono text-body text-ink">
                      {formatPrice(depositMinor)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-line py-2">
                    <span className="text-body text-muted">Balance on ship</span>
                    <span className="font-mono text-body text-muted">
                      {formatPrice(balanceMinor)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-line py-2">
                    <span className="text-body text-muted">Production</span>
                    <span className="text-body text-ink">~8 weeks after approval</span>
                  </div>
                </div>
                <p className="mt-3 max-w-measure text-caption text-muted">
                  Step 5 begins on {maker.name}&rsquo;s bench. You&rsquo;ll see every stage in
                  this thread — dye days filmed, no surprises.
                </p>
              </div>
            ) : (
              <div className="mt-5 rounded-md border border-line bg-ground p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-body font-semibold text-ink">
                      Approve <span className="font-mono">v3</span> to make?
                    </p>
                    <p className="mt-1 max-w-[42ch] text-caption text-muted">
                      Approval is explicit and tied to this exact revision. Nothing is made —
                      and no deposit moves — until you approve.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="min-h-11 rounded-pill border border-line bg-surface px-5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
                    >
                      Request another revision
                    </button>
                    <button
                      type="button"
                      onClick={() => setApproved(true)}
                      className="min-h-11 rounded-pill bg-accent-cta px-6 text-body-lg font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
                    >
                      Approve v3 &amp; begin making
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT — transparent pricing, deposit, timeline */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-md border border-line bg-surface p-5 shadow-subtle">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Transparent pricing
            </p>
            <div className="mt-2">
              <div className="flex items-baseline justify-between border-b border-line py-2">
                <span className="text-body text-ink">
                  {quilt?.title ?? "Commissioned piece"}
                </span>
                <span className="font-mono text-body text-ink">{formatPrice(totalMinor)}</span>
              </div>
              <div className="flex items-baseline justify-between py-2">
                <b className="text-body text-ink">Total</b>
                <b className="font-mono text-body text-ink">{formatPrice(totalMinor)}</b>
              </div>
            </div>
            <p className="mt-2 text-caption text-muted">
              No platform mark-up hidden in the piece price. {maker.name} set this number.
            </p>
          </div>

          <div className="rounded-md border border-line bg-surface p-5 shadow-subtle">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">Deposit</p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-body text-ink">Due on approval (40%)</span>
              <span className="font-mono text-body text-ink">{formatPrice(depositMinor)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-body text-muted">Balance on ship</span>
              <span className="font-mono text-body text-muted">{formatPrice(balanceMinor)}</span>
            </div>
            <p className="mt-2 text-caption text-muted">
              The deposit covers linen and dye days. It only moves when you press Approve.
            </p>
          </div>

          <div className="rounded-md border border-line bg-surface p-5 shadow-subtle">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Production timeline
            </p>
            <div className="mt-2 flex flex-col gap-2">
              {[
                ["Dye the panels", "~3 weeks"],
                ["Hand-quilt", "~4 weeks"],
                ["Cure, film, ship", "~1 week"],
              ].map(([stage, span]) => (
                <div key={stage} className="flex items-baseline justify-between">
                  <span className="text-body text-ink">{stage}</span>
                  <span className="text-body text-muted">{span}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-line pt-3 text-caption text-muted">
              ~8 weeks after approval, start to door. {maker.name} films the stages as she
              goes — the thread carries each one.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
