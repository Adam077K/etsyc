"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LiveWave, StaticWave } from "@/components/media/LiveWave";
import {
  formatClock,
  isMediaCaptureSupported,
  useMediaRecorder,
  type Recording,
} from "@/lib/media/recorder";

/**
 * S5 + P12 — Voiceovers (/sell/voice). KOL chrome (seller tools).
 * Hard AC: real maker voice only — no cloning, no synthesis, ever.
 * Recordings are OPTIONAL and SUGGESTED, never required to publish.
 * Per element: status · record · waveform · duration · playback ·
 * re-record · delete · editable transcript. Buyers get a tap-to-hear
 * pill in the maker's own palette. Voice is one element, not the whole.
 *
 * Capture is REAL: getUserMedia + MediaRecorder (see @/lib/media/recorder).
 * Waveform bars are the live input level, durations are measured off the
 * wall clock, playback plays the actual Blob. Nothing here shows a
 * recording that did not happen — a blocked mic says so and the page
 * stays usable.
 *
 * Takes are session-scoped (in-memory Blob + object URL). In the live
 * build each take is uploaded to Supabase storage on stop and the row
 * holds the returned object id instead of a blob URL.
 */

interface VoiceRow {
  id: string;
  scope: string; // "block · …" or "product · …"
  label: string;
  prompt?: string;
  skippable?: boolean;
}

const ROWS: VoiceRow[] = [
  {
    id: "hero",
    scope: "block · hero film",
    label: "Hero film",
    prompt: "Say hello — one line, the way you'd greet someone walking into the barn.",
  },
  {
    id: "craft-story",
    scope: "block · craft-story",
    label: "Craft story",
    prompt: "How do you start a pot? Talk about the material the way you'd talk to an apprentice.",
  },
  {
    id: "ridge-tumbler",
    scope: "product · Ridge tumbler",
    label: "Ridge tumbler",
    prompt: "Tell buyers what makes this glaze different.",
  },
  {
    id: "ash-bowl",
    scope: "product · Ash bowl",
    label: "Ash bowl",
    prompt: "The well, the pooling — why no two bowls come out the same.",
  },
  {
    id: "contact",
    scope: "block · contact strip",
    label: "Contact strip",
    skippable: true,
    prompt: "Optional — how you'd like people to reach you.",
  },
];

/** Playback of a real take — a single <audio> bound to the recorded Blob. */
function TakePlayer({ take }: { take: Recording }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          const el = audioRef.current;
          if (!el) return;
          if (el.paused) void el.play().catch(() => setPlaying(false));
          else el.pause();
        }}
        className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
      >
        {playing ? "❚❚ Pause" : "▶ Play"}
      </button>
      <audio
        ref={audioRef}
        src={take.url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </>
  );
}

export default function SellVoicePage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [takes, setTakes] = useState<Record<string, Recording>>({});

  // The take is harvested where it happens — the recorder hands it back on
  // settle, so nothing has to watch `status` from an effect. A failed
  // attempt settles with null and simply clears the active row.
  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const onSettled = useCallback((take: Recording | null) => {
    const id = activeIdRef.current;
    setActiveId(null);
    if (!take || !id) return;
    setTakes((prev) => {
      const previous = prev[id];
      if (previous) URL.revokeObjectURL(previous.url);
      return { ...prev, [id]: take };
    });
  }, []);

  const recorder = useMediaRecorder({ audio: true, bars: 16, onSettled });
  const { status, permission, levels, elapsedMs, error, start, stop, reset } = recorder;
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  // capability is a browser fact, read once on the client (SSR assumes yes)
  const supported = useSyncExternalStore(
    () => () => undefined,
    isMediaCaptureSupported,
    () => true,
  );

  // revoke every outstanding take on unmount
  const takesRef = useRef(takes);
  useEffect(() => {
    takesRef.current = takes;
  }, [takes]);
  useEffect(
    () => () => {
      for (const take of Object.values(takesRef.current)) URL.revokeObjectURL(take.url);
    },
    [],
  );

  const startRecording = useCallback(
    (id: string) => {
      setActiveId(id);
      void start();
    },
    [start],
  );

  const deleteRecording = useCallback((id: string) => {
    setTakes((prev) => {
      const take = prev[id];
      if (!take) return prev;
      URL.revokeObjectURL(take.url);
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const cancelRecording = useCallback(() => {
    reset();
    setActiveId(null);
  }, [reset]);

  const recordedCount = Object.keys(takes).length;
  const suggestedCount = ROWS.length - recordedCount;

  const blocked = !supported || permission === "denied" || permission === "unsupported";

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

      {/* ---- honest degradation: mic blocked or unavailable ---- */}
      {blocked ? (
        <div
          role="status"
          className="mt-[var(--space-3)] rounded-md border border-accent/30 bg-accent/10 p-[var(--space-3)]"
        >
          <p className="text-caption uppercase tracking-[0.04em] text-accent">
            Microphone unavailable
          </p>
          <p className="mt-[var(--space-1)] max-w-measure text-body">
            {!supported
              ? "This browser can't record audio. Everything else on this page still works — you can come back from Chrome, Edge, Safari or Firefox and record then."
              : (error ??
                "We couldn't reach your microphone. Allow access in your browser's site settings, then try Record again.")}{" "}
            Nothing has been recorded, and none of this blocks publishing.
          </p>
        </div>
      ) : null}

      {/* ---- a failed attempt, said plainly ---- */}
      {!blocked && status === "error" && error ? (
        <div
          role="status"
          className="mt-[var(--space-3)] rounded-md border border-accent/30 bg-accent/10 p-[var(--space-3)]"
        >
          <p className="max-w-measure text-body">{error} Nothing was saved.</p>
        </div>
      ) : null}

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

          {ROWS.map((row) => {
            const take = takes[row.id];
            const isActive = activeId === row.id;
            const isRecording = isActive && (status === "recording" || status === "requesting");

            if (isRecording) {
              const requesting = status === "requesting";
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
                        {requesting ? (
                          "waiting for mic permission…"
                        ) : (
                          <>
                            ● recording ·{" "}
                            <span className="font-mono">{formatClock(elapsedMs)}</span>
                          </>
                        )}
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
                      onClick={stop}
                      disabled={requesting}
                      className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-6 py-2.5 font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98] disabled:opacity-50"
                    >
                      ■ Stop
                    </button>
                    <button
                      type="button"
                      onClick={cancelRecording}
                      className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground"
                    >
                      cancel
                    </button>
                    {/* bars are the live input level — silence reads flat */}
                    <LiveWave levels={levels} tone="accent" />
                  </div>
                </div>
              );
            }

            if (take) {
              return (
                <div key={row.id} className="rounded-md border border-line bg-surface p-[var(--space-3)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-[var(--space-2)]">
                      <span className="text-caption uppercase tracking-[0.04em] text-muted">
                        {row.scope}
                      </span>
                      <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                        ✓ recorded ·{" "}
                        <span className="font-mono">{formatClock(take.durationMs)}</span>
                      </span>
                    </span>
                    <span className="flex gap-[var(--space-1)]">
                      <button
                        type="button"
                        onClick={() => startRecording(row.id)}
                        disabled={blocked || activeId !== null}
                        className="rounded-pill border border-line bg-surface px-3 py-1 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground disabled:opacity-50"
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
                    <TakePlayer take={take} />
                    <StaticWave heights={[6, 14, 9, 18, 5, 12, 16, 8, 20, 10]} />
                  </div>
                  <label className="mt-[var(--space-2)] block">
                    <span className="text-caption uppercase tracking-[0.04em] text-muted">
                      Transcript · editable · type what you said
                    </span>
                    <textarea
                      rows={2}
                      value={transcripts[row.id] ?? ""}
                      placeholder="Your own words, in your own spelling."
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
                      disabled={blocked || activeId !== null}
                      className="inline-flex items-center gap-2 rounded-pill border border-line px-4 py-1.5 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground disabled:opacity-50"
                    >
                      <StaticWave heights={[6, 12, 8, 14, 5]} tone="accent" />
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
          <p className="text-caption text-muted">
            Takes live in this browser tab for now — on the live build each one uploads to your
            store the moment you stop recording.
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
              <span
                className="mt-[var(--space-2)] inline-flex min-h-11 items-center gap-2 rounded-pill border px-4 py-2 text-caption"
                style={{ borderColor: "#d6c9ad", color: "#6b6153" }}
              >
                <StaticWave heights={[6, 12, 8, 14, 5]} tone="accent" />
                Hear Sena say it
              </span>
            </div>
            <p className="mt-[var(--space-2)] text-caption text-muted">
              Preview only — the pill above plays nothing until you record that element.
            </p>
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
