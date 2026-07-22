"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Film } from "@/components/chrome/Film";
import { blockRegistry } from "@/components/blocks/registry";
import { sellerBlocks, type SellerBlockRow } from "@/lib/mock/db";
import { SELLER_SLUG, WORLD_INK, useSellerDraft } from "@/lib/mock/seller-state";
import { contrastRatio, isHexColor } from "@/lib/theme/contrast";

/**
 * S4 — Co-edit (/sell/edit). KOL chrome (seller tools). Three panes:
 * the 11 constrained block primitives (no blank canvas — that's the
 * point), the live canvas in HER world, and the inspector with full
 * D15 brand freedom (any hex, own fonts). The AA gate is deterministic
 * and load-bearing: < 4.5:1 blocks publish. Editing anything removes
 * the block from approved_sections and re-runs the critic — surfaced
 * here as the inline "re-review needed" marker. She stays the author.
 *
 * Every mutation here writes the SHARED store override, not local state:
 * the order and the theme she lands on are what /m/sena renders and what
 * /sell/publish gates. That loop is the product.
 */

const VARIANTS = ["Full-bleed", "Text-left", "Quote-lead", "Two-column"] as const;
const FONT_PAIRINGS = [
  "statement-grotesk",
  "warm-serif",
  "modern-mono-grotesk",
  "character-maximal",
] as const;
const MOTION_PRESETS = ["hushed", "fluid", "liquid", "dimensional"] as const;
const RADII = ["sharp", "soft", "round"] as const;
const DENSITIES = ["airy", "standard", "dense"] as const;

const SENA_SWATCHES = ["#EFE7D8", "#E6DCC7", "#2C2620", "#8F5A3A", "#737A63"] as const;
const ACCENT_SWATCHES = ["#8F5A3A", "#B0663C", "#737A63", "#2C2620", "#C8582F"] as const;

export default function SellEditPage() {
  // the 11 constrained primitives, straight from the D4 registry seam
  const blockTypes = useMemo(() => Object.keys(blockRegistry), []);

  const draft = useSellerDraft();
  const [selectedId, setSelectedId] = useState<string>(sellerBlocks[0]?.id ?? "b1");

  // variant + density stay per-session inspector controls (they aren't part
  // of the published StoreOverride yet) — but editing them still dirties the
  // block, because approval never survives an edit.
  const [variant, setVariant] = useState<string>("Text-left");
  const [density, setDensity] = useState<string>("standard");

  const blocks = useMemo(
    () =>
      draft.order
        .map((id) => sellerBlocks.find((b) => b.id === id))
        .filter((b): b is SellerBlockRow => Boolean(b)),
    [draft.order],
  );
  const selected = blocks.find((b) => b.id === selectedId) ?? blocks[0];

  const groundHex = draft.theme.ground;
  const accentHex = draft.theme.accent;
  const ratio = contrastRatio(WORLD_INK, isHexColor(groundHex) ? groundHex : "#EFE7D8");
  const aaPass = ratio >= 4.5;

  /** any inspector edit clears the selected block's approval */
  const touch = () => {
    if (selected) draft.touch(selected.id);
  };

  /** theme edits are world-wide, so they dirty the block she's looking at */
  const setTheme = (patch: Parameters<typeof draft.setTheme>[0]) => {
    draft.setTheme(patch);
    touch();
  };

  const move = (id: string, dir: -1 | 1) => {
    const prev = draft.order;
    const i = prev.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= prev.length) return;
    const next = [...prev];
    const a = next[i];
    const b = next[j];
    if (a === undefined || b === undefined) return;
    next[i] = b;
    next[j] = a;
    draft.setOrder(next);
  };

  const statusChip = (b: SellerBlockRow) => {
    if (draft.isDirty(b.id))
      return (
        <span className="rounded-pill border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-caption uppercase tracking-[0.04em] text-accent">
          ↻ re-review needed
        </span>
      );
    if (draft.isApproved(b.id))
      return (
        <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption uppercase tracking-[0.04em] text-accent-2">
          ✓ approved
        </span>
      );
    return (
      <span className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption uppercase tracking-[0.04em] text-muted">
        • needs review
      </span>
    );
  };

  const chip = (active: boolean) =>
    `rounded-pill border px-3 py-1 text-caption transition-colors duration-state ease-kol ${
      active
        ? "border-transparent bg-ink text-ground"
        : "border-line bg-surface text-ink hover:bg-ground"
    }`;

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-6)]">
      {/* ---- editor chrome header ---- */}
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Studio · Sena · Stoneware, Hudson Valley
          </p>
          <h1 className="mt-[var(--space-1)] font-display text-h1">
            You arrange it. The tool just holds the frame.
          </h1>
          <p className="mt-[var(--space-1)] max-w-measure text-body-lg text-muted">
            Move the blocks you want, in the order you want. Every colour, word and clip is
            yours — the system only checks that a buyer can actually read it.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
            {draft.published ? "• Published · edits save as draft" : "• Draft · saved as you go"}
          </span>
          <Link
            href={`/m/${SELLER_SLUG}`}
            className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
          >
            Preview your world →
          </Link>
          <Link
            href="/sell/voice"
            className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
          >
            Add voice
          </Link>
          <Link
            href="/sell/publish"
            className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 py-2.5 font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
          >
            Review &amp; publish →
          </Link>
        </div>
      </header>

      {/* ---- three-pane editor ---- */}
      <div className="mt-[var(--space-5)] grid grid-cols-1 items-start gap-[var(--space-3)] lg:grid-cols-[minmax(200px,0.85fr)_minmax(0,2.1fr)_minmax(280px,1fr)]">
        {/* ==== LEFT: block palette — the 11 registry primitives ==== */}
        <aside className="rounded-md border border-line bg-surface p-[var(--space-3)] lg:sticky lg:top-[76px]">
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Block palette · drag in
          </p>
          <p className="mt-1 text-caption text-muted">
            {blockTypes.length} constrained blocks. You can&rsquo;t make a blank canvas —
            that&rsquo;s the point.
          </p>
          <ul className="mt-[var(--space-2)] flex flex-col gap-1">
            {blockTypes.map((t) => (
              <li
                key={t}
                draggable
                className="flex cursor-grab items-center gap-2 rounded-sm border border-line bg-ground px-3 py-1.5 text-body active:cursor-grabbing"
              >
                <span className="font-mono text-muted" aria-hidden>
                  ⠿
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-[var(--space-2)] rounded-sm border border-dashed border-line p-[var(--space-3)] text-center text-caption text-muted">
            <span className="font-mono">＋</span>
            <br />
            Drop a block anywhere in the canvas
          </div>
        </aside>

        {/* ==== CENTRE: live canvas — stacked mini-sections in her world ==== */}
        <section>
          <div className="mb-[var(--space-2)] flex items-center justify-between">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Live canvas · Sena&rsquo;s world
            </p>
            <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-muted">
              Desktop
            </span>
          </div>

          <div
            className="overflow-hidden rounded-md border border-line shadow-card"
            style={{
              background: isHexColor(groundHex) ? groundHex : "#EFE7D8",
              color: WORLD_INK,
            }}
          >
            {blocks.map((b, i) => {
              const isSelected = selected?.id === b.id;
              return (
                <div
                  key={b.id}
                  className={isSelected ? "bg-accent/10 outline outline-2 -outline-offset-2 outline-accent" : ""}
                >
                  {/* block toolbar row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-[var(--space-2)] py-[var(--space-1)]">
                    <button
                      type="button"
                      onClick={() => setSelectedId(b.id)}
                      className="flex items-center gap-2 text-left"
                    >
                      <span className="font-mono text-muted" aria-hidden>
                        ⠿
                      </span>
                      <span
                        className={`text-caption uppercase tracking-[0.04em] ${
                          isSelected ? "text-accent" : "text-muted"
                        }`}
                      >
                        {b.type}
                        {isSelected ? " · selected" : ""}
                      </span>
                      {statusChip(b)}
                    </button>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label={`Move ${b.type} up`}
                        onClick={() => move(b.id, -1)}
                        disabled={i === 0}
                        className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground disabled:opacity-40"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${b.type} down`}
                        onClick={() => move(b.id, 1)}
                        disabled={i === blocks.length - 1}
                        className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground disabled:opacity-40"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
                      >
                        ⇄ swap
                      </button>
                    </span>
                  </div>

                  {/* mini-section preview — click selects; the toolbar button is
                      the keyboard-accessible selector for the same block */}
                  <div
                    onClick={() => setSelectedId(b.id)}
                    className="w-full cursor-pointer p-[var(--space-3)] text-left"
                  >
                    {b.type === "hero-video" || b.type === "process-reel" ? (
                      <Film variant="v1" aspect="wide" title={b.label} craft="Stoneware · Hudson Valley" />
                    ) : b.type === "product-showcase" ? (
                      <div className="grid grid-cols-[1.4fr_1fr] gap-[var(--space-2)]">
                        <Film variant="v1" aspect="wide" title="Ridge tumbler — ash glaze" />
                        <Film variant="v1" aspect="wide" title="Ash bowl — wide" />
                      </div>
                    ) : b.type === "voice-quote" ? (
                      <blockquote className="max-w-measure font-display text-h2">{b.label}</blockquote>
                    ) : b.type === "contact-cta" ? (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line p-[var(--space-3)]">
                        <p className="font-display text-h3">Follow the kiln, or just say hello.</p>
                        <span
                          className="rounded-pill px-5 py-2 text-caption uppercase tracking-[0.04em]"
                          style={{
                            background: isHexColor(accentHex) ? accentHex : "#8F5A3A",
                            color: "#FFFFFF",
                          }}
                        >
                          {b.label}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p className="text-caption uppercase tracking-[0.04em] opacity-70">
                          Your craft, in your words
                        </p>
                        <h2 className="mt-[var(--space-1)] max-w-[24ch] font-display text-h2">
                          {b.label}
                        </h2>
                        <p className="mt-[var(--space-2)] max-w-measure opacity-80">
                          I dig the wild clay in autumn, wedge it through winter, and throw it when
                          it&rsquo;s finally still. Nothing here is faster than the material lets
                          it be.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-[var(--space-2)] text-center text-caption text-muted">
            This is exactly what a buyer sees —{" "}
            <Link href={`/m/${SELLER_SLUG}`} className="underline underline-offset-2 hover:text-ink">
              open your world
            </Link>{" "}
            to check. Editing any block clears its ✓ and sends it back through the critic.
          </p>
        </section>

        {/* ==== RIGHT: inspector for the selected block ==== */}
        <aside className="flex flex-col gap-[var(--space-3)] lg:sticky lg:top-[76px]">
          <div className="rounded-md border border-accent bg-surface p-[var(--space-3)]">
            <div className="flex items-center justify-between">
              <p className="text-caption uppercase tracking-[0.04em] text-accent">
                Inspector · {selected?.type ?? "—"}
              </p>
              {selected && draft.isDirty(selected.id) ? (
                <span className="rounded-pill border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-caption uppercase tracking-[0.04em] text-accent">
                  ↻ re-review
                </span>
              ) : null}
            </div>
            <p className="mt-[var(--space-1)] text-caption text-muted">
              {selected && draft.isDirty(selected.id)
                ? "You edited this block. It left approved_sections the moment you touched it — the auto-critic re-runs before publish."
                : "Change anything here — the moment you do, this block leaves approved_sections and the critic re-runs. You stay the author."}
            </p>
          </div>

          {/* variant + density */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <label className="block">
              <span className="text-caption uppercase tracking-[0.04em] text-muted">Variant</span>
              <select
                value={variant}
                onChange={(e) => {
                  setVariant(e.target.value);
                  touch();
                }}
                className="mt-[var(--space-1)] w-full rounded-sm border border-line bg-ground px-3 py-2 text-body text-ink"
              >
                {VARIANTS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <div className="mt-[var(--space-3)] flex items-center justify-between gap-2">
              <span className="text-body">Density</span>
              <span className="flex gap-1">
                {DENSITIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={density === d}
                    onClick={() => {
                      setDensity(d);
                      touch();
                    }}
                    className={chip(density === d)}
                  >
                    {d}
                  </button>
                ))}
              </span>
            </div>
          </div>

          {/* bound media */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">Bound media</p>
            <div className="mt-[var(--space-2)] flex items-center gap-[var(--space-2)]">
              <Film variant="v1" aspect="square" play={false} rounded className="w-16 shrink-0" />
              <div>
                <b>No clip linked yet</b>
                <p className="text-caption text-muted">
                  <span className="font-mono">—</span> · no footage yet · film a piece and it
                  binds here
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={touch}
              className="mt-[var(--space-2)] w-full rounded-pill px-4 py-2 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
            >
              Choose a clip from your reels
            </button>
          </div>

          {/* theme — full brand freedom (D15) */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Theme · your brand, any hex
            </p>

            <div className="mt-[var(--space-2)]">
              <div className="flex items-baseline justify-between">
                <span className="text-body">Ground</span>
                <span className="text-caption text-muted">tap a swatch to apply</span>
              </div>
              <div className="mt-[var(--space-1)] flex flex-wrap gap-[var(--space-1)]">
                {SENA_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    aria-label={`Set ground to ${hex}`}
                    onClick={() => setTheme({ ground: hex })}
                    className={`h-7 w-7 rounded-sm border ${
                      groundHex.toUpperCase() === hex ? "border-accent" : "border-line"
                    }`}
                    style={{ background: hex }}
                  />
                ))}
              </div>
              <label className="mt-[var(--space-2)] flex items-center justify-between gap-[var(--space-2)]">
                <span className="text-body">Ground · any hex</span>
                <span className="flex items-center gap-[var(--space-1)]">
                  <input
                    type="color"
                    value={isHexColor(groundHex) ? groundHex : "#EFE7D8"}
                    onChange={(e) => setTheme({ ground: e.target.value.toUpperCase() })}
                    aria-label="Pick any ground colour"
                    className="h-7 w-9 cursor-pointer rounded-sm border border-line bg-transparent"
                  />
                  <input
                    value={groundHex}
                    onChange={(e) => setTheme({ ground: e.target.value.toUpperCase() })}
                    aria-label="Ground hex value"
                    className="w-24 rounded-sm border border-line bg-ground px-2 py-1 font-mono text-caption text-ink"
                  />
                </span>
              </label>
            </div>

            <div className="mt-[var(--space-3)]">
              <div className="flex items-baseline justify-between">
                <span className="text-body">Accent</span>
                <span className="text-caption text-muted">buttons, links, waveform</span>
              </div>
              <div className="mt-[var(--space-1)] flex flex-wrap gap-[var(--space-1)]">
                {ACCENT_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    title={hex}
                    aria-label={`Set accent to ${hex}`}
                    onClick={() => setTheme({ accent: hex })}
                    className={`h-7 w-7 rounded-sm border ${
                      accentHex.toUpperCase() === hex ? "border-accent" : "border-line"
                    }`}
                    style={{ background: hex }}
                  />
                ))}
              </div>
              <label className="mt-[var(--space-2)] flex items-center justify-between gap-[var(--space-2)]">
                <span className="text-body">Accent · any hex</span>
                <span className="flex items-center gap-[var(--space-1)]">
                  <input
                    type="color"
                    value={isHexColor(accentHex) ? accentHex : "#8F5A3A"}
                    onChange={(e) => setTheme({ accent: e.target.value.toUpperCase() })}
                    aria-label="Pick any accent colour"
                    className="h-7 w-9 cursor-pointer rounded-sm border border-line bg-transparent"
                  />
                  <input
                    value={accentHex}
                    onChange={(e) => setTheme({ accent: e.target.value.toUpperCase() })}
                    aria-label="Accent hex value"
                    className="w-24 rounded-sm border border-line bg-ground px-2 py-1 font-mono text-caption text-ink"
                  />
                </span>
              </label>
            </div>

            {/* live AA contrast check — measured, not styled away */}
            <div
              className={`mt-[var(--space-2)] rounded-md border p-[var(--space-2)] ${
                aaPass ? "border-accent-2/30 bg-accent-2/10" : "border-accent/40 bg-accent/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`rounded-pill px-3 py-1 text-caption uppercase tracking-[0.04em] ${
                    aaPass ? "bg-accent-2/15 text-accent-2" : "bg-accent/15 text-accent"
                  }`}
                >
                  {aaPass ? "✓ AA passes" : "✕ AA fails — publish blocked"}
                </span>
                <span className="font-mono">{ratio.toFixed(1)} : 1</span>
              </div>
              <p className="mt-[var(--space-1)] text-caption text-muted">
                ink <span className="font-mono">{WORLD_INK}</span> on ground{" "}
                <span className="font-mono">{groundHex}</span> · checked live as you type. Fall
                below <span className="font-mono">4.5 : 1</span> and publish is blocked, not
                styled away.
              </p>
            </div>

            <div className="mt-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
              <label className="flex items-center justify-between gap-2">
                <span className="text-body">Font pairing</span>
                <select
                  value={draft.theme.pairing}
                  onChange={(e) => setTheme({ pairing: e.target.value })}
                  className="rounded-sm border border-line bg-ground px-3 py-1.5 text-caption text-ink"
                >
                  {FONT_PAIRINGS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between gap-2">
                <span className="text-body">Motion preset</span>
                <select
                  value={draft.theme.motion}
                  onChange={(e) => setTheme({ motion: e.target.value })}
                  className="rounded-sm border border-line bg-ground px-3 py-1.5 text-caption text-ink"
                >
                  {MOTION_PRESETS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </label>
              <div className="flex items-center justify-between gap-2">
                <span className="text-body">Radius identity</span>
                <span className="flex gap-1">
                  {RADII.map((r) => (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={draft.theme.radius === r}
                      onClick={() => setTheme({ radius: r })}
                      className={chip(draft.theme.radius === r)}
                    >
                      {r}
                    </button>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
