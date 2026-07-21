"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * S5 + P12 — Voiceovers (/sell/voice). KOL chrome (seller tools).
 * Hard AC: real maker voice only — no cloning, no synthesis, ever.
 * Recordings are OPTIONAL and SUGGESTED, never required to publish.
 * Per element: status · record · waveform · duration · playback ·
 * re-record · delete · editable transcript. Buyers get a tap-to-hear
 * pill in the maker's own palette. Voice is one element, not the whole.
 */

type RowStatus = "recording" | "recorded" | "suggested";

interface VoiceRow {
  id: string;
  scope: string; // "block · …" or "product · …"
  label: string;
  status: RowStatus;
  duration?: string;
  prompt?: string;
  transcript?: string;
  skippable?: boolean;
}

const INITIAL_ROWS: VoiceRow[] = [
  {
    id: "hero",
    scope: "block · hero film",
    label: "Hero film",
    status: "suggested",
    prompt: "Say hello — one line, the way you'd greet someone walking into the barn.",
  },
  {
    id: "craft-story",
    scope: "block · craft-story",
    label: "Craft story",
    status: "recorded",
    duration: "0:38",
    transcript:
      "I start every pot by wedging the clay by hand. You can't rush a material — it moves when it's ready, not when you are.",
  },
  {
    id: "ridge-tumbler",
    scope: "product · Ridge tumbler",
    label: "Ridge tumbler",
    status: "recording",
    duration: "0:14",
    prompt: "Tell buyers what makes this glaze different.",
    transcript:
      "Ash glaze isn't one colour — it breaks. Where the flame hits the rim it goes amber, where it pools it goes almost black",
  },
  {
    id: "ash-bowl",
    scope: "product · Ash bowl",
    label: "Ash bowl",
    status: "recorded",
    duration: "0:19",
    transcript: "The well is where the glaze gathers — every bowl pools a little differently.",
  },
  {
    id: "contact",
    scope: "block · contact strip",
    label: "Contact strip",
    status: "suggested",
    skippable: true,
    prompt: "Optional — how you'd like people to reach you.",
  },
];

const WAVE_TALL = [8, 20, 31, 14, 26, 9, 22, 30, 12, 18, 28, 7, 24, 16, 32, 11];
const WAVE_SHORT = [6, 14, 9, 18, 5, 12, 16, 8, 20, 10];

function Wave({ heights, tone = "muted" }: { heights: number[]; tone?: "accent" | "muted" }) {
  return (
    <span aria-hidden className="flex items-end gap-0.5">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}px` }}
          className={`w-0.5 rounded-pill ${
            tone === "accent" ? (i % 2 === 0 ? "bg-accent" : "bg-accent/50") : "bg-ink/40"
          }`}
        />
      ))}
    </span>
  );
}

export default function SellVoicePage() {
  const [rows, setRows] = useState<VoiceRow[]>(INITIAL_ROWS);
  const [transcripts, setTranscripts] = useState<Record<string, string>>(() =>
    Object.fromEntries(INITIAL_ROWS.map((r) => [r.id, r.transcript ?? ""])),
  );

  const recordedCount = rows.filter((r) => r.status === "recorded").length;
  const suggestedCount = rows.filter((r) => r.status !== "recorded").length;

  const stopRecording = (id: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: "recorded", duration: "0:22" } : r)));
  const deleteRecording = (id: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: "suggested", duration: undefined } : r)));
  const startRecording = (id: string) =>
    setRows((rs) =>
      rs.map((r) =>
        r.id === id
          ? { ...r, status: "recording", duration: "0:00" }
          : r.status === "recording"
            ? { ...r, status: "recorded", duration: r.duration ?? "0:12" }
            : r,
      ),
    );

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-6)]">
      {/* ---- editor chrome header ---- */}
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-3)]">
        <div>
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Studio · Sena · Stoneware, Hudson Valley
          </p>
          <h1 className="mt-[var(--space-1)] font-display text-h1">
            The one thing no one can fake for you.
          </h1>
          <p className="mt-[var(--space-1)] max-w-measure text-body-lg text-muted">
            Record your own voice on the parts of your world that matter to you. It&rsquo;s your
            real voice — never cloned, never synthesised. Say as much or as little as you like.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-[var(--space-2)]">
          <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
            ✓ Real-Maker voice · you
          </span>
          <Link
            href="/sell/edit"
            className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
          >
            ← Back to editor
          </Link>
          <Link
            href="/sell/publish"
            className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 py-2.5 font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
          >
            Review &amp; publish →
          </Link>
        </div>
      </header>

      {/* ---- explicit optionality banner ---- */}
      <div className="mt-[var(--space-4)] rounded-md border border-accent-2/30 bg-accent-2/10 p-[var(--space-3)]">
        <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
          <p className="max-w-measure text-body">
            <b>All optional. Always suggested, never required.</b> Record the ones that feel
            worth hearing in your voice, skip the rest. Your real voice — no cloning, ever.
          </p>
          <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
            No cloning, ever · this is you
          </span>
        </div>
      </div>

      <div className="mt-[var(--space-5)] grid grid-cols-1 items-start gap-[var(--space-4)] lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        {/* ==== LEFT: per-element recording list ==== */}
        <section className="flex flex-col gap-[var(--space-3)]">
          <div className="flex items-baseline justify-between">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Your world · element by element
            </p>
            <span className="font-mono text-caption text-muted">
              {recordedCount} recorded · {suggestedCount} suggested
            </span>
          </div>

          {rows.map((row) => {
            if (row.status === "recording") {
              return (
                <div
                  key={row.id}
                  className="rounded-md border border-accent bg-accent/5 p-[var(--space-3)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-[var(--space-2)]">
                      <span className="text-caption uppercase tracking-[0.04em] text-muted">
                        {row.scope}
                      </span>
                      <span className="rounded-pill border border-accent/30 bg-accent/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent">
                        ● recording · <span className="font-mono">{row.duration ?? "0:14"}</span>
                      </span>
                    </span>
                    <span className="text-caption uppercase tracking-[0.04em] text-muted">
                      suggested
                    </span>
                  </div>
                  {row.prompt ? (
                    <p className="mt-[var(--space-1)] max-w-measure text-body text-muted">
                      Suggested prompt · <i>&ldquo;{row.prompt}&rdquo;</i>
                    </p>
                  ) : null}
                  <div className="mt-[var(--space-2)] flex items-center gap-[var(--space-2)]">
                    <button
                      type="button"
                      onClick={() => stopRecording(row.id)}
                      className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 py-2.5 font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
                    >
                      ■ Stop
                    </button>
                    <Wave heights={WAVE_TALL} tone="accent" />
                  </div>
                  <div className="mt-[var(--space-2)]">
                    <label
                      htmlFor={`transcript-${row.id}`}
                      className="text-caption uppercase tracking-[0.04em] text-muted"
                    >
                      Transcript · editable, auto-drafted from your audio
                    </label>
                    <textarea
                      id={`transcript-${row.id}`}
                      rows={2}
                      value={transcripts[row.id] ?? ""}
                      onChange={(e) =>
                        setTranscripts((t) => ({ ...t, [row.id]: e.target.value }))
                      }
                      className="mt-[var(--space-1)] w-full rounded-md border border-line bg-surface p-[var(--space-2)] text-body text-ink"
                    />
                  </div>
                </div>
              );
            }

            if (row.status === "recorded") {
              return (
                <div key={row.id} className="rounded-md border border-line bg-surface p-[var(--space-3)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-[var(--space-2)]">
                      <span className="text-caption uppercase tracking-[0.04em] text-muted">
                        {row.scope}
                      </span>
                      <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                        ✓ recorded · <span className="font-mono">{row.duration ?? "0:20"}</span>
                      </span>
                    </span>
                    <span className="flex gap-[var(--space-1)]">
                      <button
                        type="button"
                        onClick={() => startRecording(row.id)}
                        className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
                      >
                        ↻ re-record
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRecording(row.id)}
                        className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
                      >
                        delete
                      </button>
                    </span>
                  </div>
                  <div className="mt-[var(--space-2)] flex items-center gap-[var(--space-2)]">
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
                    >
                      ▶ Play
                    </button>
                    <Wave heights={WAVE_SHORT} />
                  </div>
                  <label className="mt-[var(--space-2)] block">
                    <span className="text-caption uppercase tracking-[0.04em] text-muted">
                      Transcript · editable
                    </span>
                    <textarea
                      rows={2}
                      value={transcripts[row.id] ?? ""}
                      onChange={(e) =>
                        setTranscripts((t) => ({ ...t, [row.id]: e.target.value }))
                      }
                      className="mt-[var(--space-1)] w-full rounded-md border border-line bg-ground p-[var(--space-2)] text-body text-ink"
                    />
                  </label>
                </div>
              );
            }

            // suggested, not yet recorded
            return (
              <div
                key={row.id}
                className={`rounded-md border border-dashed border-line bg-surface p-[var(--space-3)] ${
                  row.skippable ? "opacity-75" : ""
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-[var(--space-2)]">
                    <span className="text-caption uppercase tracking-[0.04em] text-muted">
                      {row.scope}
                    </span>
                    <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                      • suggested{row.skippable ? " · optional" : ""}
                    </span>
                  </span>
                  <span className="flex items-center gap-[var(--space-1)]">
                    <button
                      type="button"
                      onClick={() => startRecording(row.id)}
                      className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-1.5 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
                    >
                      <Wave heights={[6, 12, 8, 14, 5]} tone="accent" />
                      Record
                    </button>
                    {row.skippable ? (
                      <button
                        type="button"
                        className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
                      >
                        Skip
                      </button>
                    ) : null}
                  </span>
                </div>
                <p className="mt-[var(--space-1)] max-w-measure text-body text-muted">
                  {row.prompt ? (
                    <>
                      Suggested prompt · <i>&ldquo;{row.prompt}&rdquo;</i>
                    </>
                  ) : (
                    "Skipping is fine — a silent element just shows without a voice pill."
                  )}
                </p>
              </div>
            );
          })}

          <p className="text-caption text-muted">
            Skipping any of these is fine — a silent block just shows without a voice pill.
          </p>
        </section>

        {/* ==== RIGHT: buyer preview + designer's note ==== */}
        <aside className="flex flex-col gap-[var(--space-3)] lg:sticky lg:top-[76px]">
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">How buyers hear it</p>
            <p className="mt-[var(--space-1)] max-w-measure text-body">
              On your live world, a recorded element shows a tap-to-hear pill — exactly like
              this, in your own palette:
            </p>
            {/* buyer-preview specimen — her world tones, literal hexes are preview data */}
            <div
              className="mt-[var(--space-2)] rounded-md p-[var(--space-3)]"
              style={{ background: "#efe7d8", color: "#2c2620" }}
            >
              <p className="font-semibold">Ash glaze, up close</p>
              <p className="mt-1 text-body" style={{ color: "#6b6153" }}>
                Where the flame hits it goes amber; where it pools it goes almost black.
              </p>
              <button
                type="button"
                className="mt-[var(--space-2)] inline-flex min-h-11 items-center gap-2 rounded-pill border px-4 py-2 text-caption transition-transform duration-tap ease-kol active:scale-[0.98]"
                style={{ borderColor: "#d6c9ad", color: "#6b6153" }}
              >
                <Wave heights={[6, 12, 8, 14, 5]} tone="accent" />
                Hear Sena say it · <span className="font-mono">0:22</span>
              </button>
            </div>
          </div>

          <div className="rounded-md bg-ink p-[var(--space-3)] text-ground">
            <p className="text-caption uppercase tracking-[0.04em] opacity-70">
              Designer&rsquo;s note
            </p>
            <p className="mt-[var(--space-1)] max-w-measure text-body">
              Voice is <b>one element</b> of the experience, not the whole thing. It anchors
              trust — a buyer can hear a real person — but the film, the words and the work
              still carry the world. Don&rsquo;t feel you have to narrate everything.
            </p>
          </div>

          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Why this can&rsquo;t be faked
            </p>
            <ul className="mt-[var(--space-2)] flex flex-col gap-1">
              <li className="flex items-center gap-[var(--space-1)]">
                <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption text-accent-2">✓</span>
                It&rsquo;s your real recording — no clone
              </li>
              <li className="flex items-center gap-[var(--space-1)]">
                <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption text-accent-2">✓</span>
                Optional everywhere — never a gate
              </li>
              <li className="flex items-center gap-[var(--space-1)]">
                <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption text-accent-2">✓</span>
                One resolved anchor unlocks publish (S6)
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
