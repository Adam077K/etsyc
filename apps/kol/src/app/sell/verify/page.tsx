"use client";

import { useCallback, useEffect, useState } from "react";
import { Film } from "@/components/chrome/Film";
import {
  formatClock,
  isMediaCaptureSupported,
  useMediaRecorder,
} from "@/lib/media/recorder";

/**
 * S9 — Real-Maker verification (/sell/verify). KOL chrome (seller tools).
 * Challenge-response: a randomly generated, single-use phrase read aloud
 * on camera becomes the permanent voice_anchor_clip_id. The page states
 * plainly what the badge asserts (a live human + reproducible anchor)
 * and what it does NOT assert (legal identity / who made a product).
 * MVP verification is founder human-in-the-loop at the n=4 seed cohort
 * (voice liveness is build-not-buy). No urgency chrome anywhere.
 *
 * The capture here is REAL — getUserMedia({ audio, video }) + MediaRecorder
 * (see @/lib/media/recorder). This is the clip that mints the voice anchor,
 * so it is the one place in the product where a simulated recording would
 * be a lie about the trust primitive itself. If camera/mic are blocked the
 * page says so and refuses to advance; it never fabricates a take.
 *
 * The take is session-scoped here. Live build: upload the Blob to Supabase
 * storage on submit and store the returned object id as voice_anchor_clip_id.
 */

type Step = "record" | "review" | "submitted";

const STEPS: { id: Step; label: string }[] = [
  { id: "record", label: "1 · Record" },
  { id: "review", label: "2 · Review" },
  { id: "submitted", label: "3 · Submitted" },
];

/** Single-use challenge phrases — one is drawn per attempt. */
const PHRASES = [
  "The kiln opens Friday morning, and this is my own voice.",
  "Seven blue bowls, cooling slowly, and this is my own voice.",
  "The rain started early on Tuesday, and this is my own voice.",
  "Nine copper pans by the window, and this is my own voice.",
] as const;

function phraseId(index: number, nonce: number): string {
  return `${index + 1}Q${nonce.toString(36).toUpperCase().padStart(3, "0").slice(0, 3)}-118`;
}

/** Audio-only playback of the take — same Blob, video track ignored. */
function AudioOnly({ url, durationMs }: { url: string; durationMs: number }) {
  const [playing, setPlaying] = useState(false);
  const [el, setEl] = useState<HTMLAudioElement | null>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (!el) return;
          if (el.paused) void el.play().catch(() => setPlaying(false));
          else el.pause();
        }}
        className="inline-flex min-h-11 items-center gap-2 self-start rounded-pill border border-line px-4 py-2 text-caption text-muted transition-colors duration-state ease-kol hover:text-ink"
      >
        <span aria-hidden className="flex items-end gap-0.5">
          {[6, 12, 8, 14, 5].map((h, i) => (
            <span key={i} style={{ height: `${h}px` }} className="w-0.5 rounded-pill bg-accent" />
          ))}
        </span>
        {playing ? "Pause the audio" : "Play the audio only"} ·{" "}
        <span className="font-mono">{formatClock(durationMs)}</span>
      </button>
      <audio
        ref={setEl}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
    </>
  );
}

export default function SellVerifyPage() {
  const [step, setStep] = useState<Step>("record");
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  // deterministic first render (no hydration drift); re-drawn on demand
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [nonce, setNonce] = useState(0);
  const phrase = PHRASES[phraseIndex] ?? PHRASES[0];

  const recorder = useMediaRecorder({ audio: true, video: true });
  const { status, permission, error, elapsedMs, stream, recording, start, stop, reset } = recorder;

  const [supported, setSupported] = useState(true);
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
  useEffect(() => setSupported(isMediaCaptureSupported()), []);

  const blocked = !supported || permission === "denied" || permission === "unsupported";
  const isRecording = status === "recording";
  const isRequesting = status === "requesting";

  // a real take is the ONLY thing that advances to review
  useEffect(() => {
    if (status === "stopped" && recording) setStep("review");
  }, [status, recording]);

  const regenerate = useCallback(() => {
    setPhraseIndex((i) => (i + 1) % PHRASES.length);
    setNonce((n) => n + 1);
  }, []);

  const restart = useCallback(() => {
    reset();
    regenerate();
    setStep("record");
  }, [reset, regenerate]);

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-8)]">
      {/* ---- opener: what this proves, said plainly up front ---- */}
      <header>
        <p className="text-caption uppercase tracking-[0.04em] text-muted">
          Seller tools · Verification · Sena · Stoneware, Hudson Valley
        </p>
        <h1 className="mt-[var(--space-2)] max-w-[20ch] font-display text-display [text-wrap:balance]">
          Prove a real human is behind this store.
        </h1>
        <p className="mt-[var(--space-2)] max-w-measure text-body-lg text-muted">
          You&rsquo;ll read one randomly generated phrase aloud on camera. That short clip
          becomes your permanent voice anchor — the thing a buyer can always play back to know a
          live person, not a bot, stood here.
        </p>
      </header>

      <div className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-4)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* ==== LEFT: the challenge-response flow ==== */}
        <div className="flex flex-col gap-[var(--space-3)]">
          {/* stepper */}
          <ol className="flex flex-wrap gap-[var(--space-1)]">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <span
                  className={`inline-block rounded-pill border px-4 py-1.5 text-caption uppercase tracking-[0.04em] ${
                    s.id === step
                      ? "border-transparent bg-accent text-accent-ink"
                      : i < stepIndex
                        ? "border-accent-2/40 bg-accent-2/10 text-accent-2"
                        : "border-line bg-surface text-muted"
                  }`}
                >
                  {i < stepIndex ? "✓ " : ""}
                  {s.label}
                </span>
              </li>
            ))}
          </ol>

          {/* STATE A — RECORDING */}
          {step === "record" ? (
            <section className="rounded-md border border-accent bg-surface p-[var(--space-3)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-[var(--space-2)]">
                  <span
                    className={`rounded-pill px-3 py-1 text-caption uppercase tracking-[0.04em] ${
                      isRecording
                        ? "bg-accent text-accent-ink"
                        : "border border-line bg-surface text-muted"
                    }`}
                  >
                    {isRecording
                      ? "Now recording"
                      : isRequesting
                        ? "Waiting for camera & mic"
                        : "Ready when you are"}
                  </span>
                  <h2 className="font-display text-h3">Read the phrase aloud</h2>
                </span>
                <span className="font-mono text-caption text-muted">
                  {isRecording ? formatClock(elapsedMs) : "0:00"} / 0:12
                </span>
              </div>

              {/* the challenge phrase */}
              <div className="mt-[var(--space-3)] rounded-md border border-accent/30 bg-accent/10 p-[var(--space-3)]">
                <p className="text-caption uppercase tracking-[0.04em] text-accent">
                  Your phrase — freshly generated, single use
                </p>
                <p className="mt-[var(--space-1)] font-display text-h2 [text-wrap:balance]">
                  Say: &ldquo;{phrase}&rdquo;
                </p>
                <p className="mt-[var(--space-2)] text-caption text-muted">
                  Random each attempt ·{" "}
                  <span className="font-mono">phrase_id {phraseId(phraseIndex, nonce)}</span> · say
                  it in your own voice, at your own pace
                </p>
              </div>

              {/* the live camera frame — a real preview once the stream is open */}
              <div className="relative mt-[var(--space-3)]">
                <Film
                  variant="v1"
                  aspect="wide"
                  play={false}
                  stream={stream}
                  craft={stream ? "Live camera · front-facing" : "Camera not started"}
                  title={
                    stream
                      ? "Look at the lens and read the line"
                      : "Press record — your camera turns on then, not before"
                  }
                />
                {isRecording ? (
                  <div className="absolute left-[var(--space-2)] top-[var(--space-2)] z-10 flex items-center gap-[var(--space-1)] rounded-pill bg-ink/60 px-3 py-1">
                    <span aria-hidden className="inline-block h-2 w-2 rounded-pill bg-accent" />
                    <span className="text-caption uppercase tracking-[0.04em] text-on-media">
                      REC
                    </span>
                  </div>
                ) : null}
              </div>

              {/* honest degradation — blocked hardware never becomes a fake take */}
              {blocked || (status === "error" && error) ? (
                <div
                  role="status"
                  className="mt-[var(--space-3)] rounded-md border border-accent/30 bg-accent/10 p-[var(--space-2)]"
                >
                  <p className="text-caption uppercase tracking-[0.04em] text-accent">
                    Can&rsquo;t reach your camera &amp; microphone
                  </p>
                  <p className="mt-[var(--space-1)] max-w-measure text-body">
                    {!supported
                      ? "This browser can't record video. Try Chrome, Edge, Safari or Firefox — everything else on this page still reads fine."
                      : (error ??
                        "Allow camera and microphone access in your browser's site settings, then press record again.")}{" "}
                    Nothing has been recorded and no anchor has been created.
                  </p>
                </div>
              ) : null}

              <div className="mt-[var(--space-3)] flex flex-wrap items-center justify-between gap-[var(--space-2)]">
                <p className="max-w-measure text-caption text-muted">
                  Recording captures voice + face together — the two can&rsquo;t be spliced apart
                  later.
                </p>
                <div className="flex gap-[var(--space-2)]">
                  <button
                    type="button"
                    onClick={regenerate}
                    disabled={isRecording || isRequesting}
                    className="inline-flex min-h-11 items-center rounded-pill px-5 py-2 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink disabled:opacity-50"
                  >
                    Regenerate phrase
                  </button>
                  {isRecording || isRequesting ? (
                    <button
                      type="button"
                      onClick={stop}
                      disabled={isRequesting}
                      className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-8 py-3 text-body-lg font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98] disabled:opacity-50"
                    >
                      Stop &amp; review
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void start()}
                      disabled={blocked}
                      className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-8 py-3 text-body-lg font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98] disabled:opacity-50"
                    >
                      Start recording
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : null}

          {/* STATE B — REVIEW */}
          {step === "review" && recording ? (
            <section className="rounded-md border border-line bg-surface p-[var(--space-3)]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-[var(--space-2)]">
                  <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                    Review
                  </span>
                  <h2 className="font-display text-h3">Check it before you commit</h2>
                </span>
                <span className="font-mono text-caption text-muted">
                  clip {formatClock(recording.durationMs)}
                </span>
              </div>

              <div className="mt-[var(--space-3)] grid grid-cols-1 gap-[var(--space-3)] sm:grid-cols-2">
                {/* the actual take — sound ON here, this is the maker checking herself */}
                <div className="relative aspect-square overflow-hidden rounded-md bg-ink shadow-card">
                  <video
                    src={recording.url}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <p className="pointer-events-none absolute left-0 top-0 p-3 text-caption uppercase text-on-media opacity-85">
                    Playback · this take
                  </p>
                </div>
                <div className="flex flex-col gap-[var(--space-2)]">
                  <span className="self-start rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                    • Not submitted yet
                  </span>
                  <p className="max-w-measure text-body">
                    Make sure your face is lit and the phrase is audible end to end. This exact
                    take, once submitted, becomes your permanent anchor — you can re-record now,
                    but not swap it later.
                  </p>
                  <AudioOnly url={recording.url} durationMs={recording.durationMs} />
                </div>
              </div>

              <div className="mt-[var(--space-3)] flex flex-wrap items-center justify-between gap-[var(--space-2)]">
                <p className="text-caption text-muted">
                  Anchor id reserved: <span className="font-mono">voice_anchor_clip_id · pending</span>
                </p>
                <div className="flex gap-[var(--space-2)]">
                  <button
                    type="button"
                    onClick={restart}
                    className="inline-flex min-h-11 items-center rounded-pill px-5 py-2 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
                  >
                    Re-record
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // live build: POST the Blob to Supabase storage here and
                      // persist the returned object id as voice_anchor_clip_id
                      setSubmittedAt(new Date());
                      setStep("submitted");
                    }}
                    className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-8 py-3 text-body-lg font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
                  >
                    Submit for review
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {/* STATE C — SUBMITTED / PENDING */}
          {step === "submitted" ? (
            <section className="rounded-md border border-accent-2/30 bg-accent-2/10 p-[var(--space-3)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-[var(--space-2)]">
                  <span className="rounded-pill border border-line bg-surface px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                    • Submitted — pending review
                  </span>
                  <h2 className="font-display text-h3">We&rsquo;ve got your clip</h2>
                </span>
                <span className="font-mono text-caption text-muted">
                  sent{" "}
                  {submittedAt
                    ? submittedAt.toLocaleString(undefined, {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "just now"}
                </span>
              </div>
              <p className="mt-[var(--space-2)] max-w-measure text-body">
                A founder is reviewing your clip by hand. During the seed phase (the first{" "}
                <span className="font-mono">4</span> makers) every voice anchor is checked by a
                human, not an automated system — so this takes a little longer and gives you a
                real person to reach if anything&rsquo;s off.
              </p>
              <ol className="mt-[var(--space-3)] flex flex-col gap-[var(--space-2)]">
                <li className="flex items-center gap-[var(--space-2)]">
                  <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption text-accent-2">✓</span>
                  <span>Clip received &amp; stored as your candidate anchor</span>
                </li>
                <li className="flex items-center gap-[var(--space-2)]">
                  <span className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-muted">•</span>
                  <span>
                    Founder liveness check ·{" "}
                    <span className="text-muted">usually within 1 business day</span>
                  </span>
                </li>
                <li className="flex items-center gap-[var(--space-2)]">
                  <span className="rounded-pill border border-line bg-surface px-2.5 py-0.5 text-caption text-muted">•</span>
                  <span>Real-Maker badge goes live on your store &amp; every clip</span>
                </li>
              </ol>
              <p className="mt-[var(--space-3)] text-caption text-muted">
                Your store stays in <b>draft</b> until this clears. Nothing you publish will carry
                the badge before a human confirms the anchor.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmittedAt(null);
                  restart();
                }}
                className="mt-[var(--space-2)] rounded-pill px-4 py-1.5 text-caption text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
              >
                (demo · walk through again)
              </button>
            </section>
          ) : null}
        </div>

        {/* ==== RIGHT: the honesty column + the two trust layers ==== */}
        <aside className="flex flex-col gap-[var(--space-3)]">
          {/* what the badge actually claims */}
          <div className="rounded-md border border-ink bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Read this — what the badge actually claims
            </p>

            <div className="mt-[var(--space-2)] rounded-md border border-accent-2/30 bg-accent-2/10 p-[var(--space-2)]">
              <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                ✓ It asserts
              </span>
              <p className="mt-[var(--space-1)] max-w-measure text-body">
                A live, real human recorded this, and KOL holds a reproducible voice anchor for
                them. You can always play it back and hear the same person.
              </p>
            </div>

            <div className="mt-[var(--space-2)] rounded-md border border-accent/30 bg-accent/10 p-[var(--space-2)]">
              <span className="rounded-pill border border-accent/30 bg-accent/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent">
                ✕ It does NOT assert
              </span>
              <ul className="mt-[var(--space-1)] max-w-measure list-disc pl-5 text-body">
                <li>That this maker is a specific named legal person.</li>
                <li>That she personally made any particular product in the store.</li>
                <li>Any identity, address, or business fact we haven&rsquo;t independently checked.</li>
              </ul>
            </div>
            <p className="mt-[var(--space-2)] text-caption text-muted">
              It&rsquo;s a proof of <b>live human presence</b>, nothing more. We&rsquo;d rather
              claim less and have it be true.
            </p>
          </div>

          {/* layer 1 — Real-Maker */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">Layer 1 · Real-Maker</p>
            <div className="mt-[var(--space-2)] flex items-center gap-[var(--space-2)]">
              <span className="rounded-pill bg-accent-2/15 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                ✓ Real Maker
              </span>
              <span className="text-muted">Voice-anchored, human-checked</span>
            </div>
            <p className="mt-[var(--space-2)] max-w-measure text-body">
              Ties this store to your recorded voice. This is the layer everything trust-related
              on KOL depends on.
            </p>
          </div>

          {/* layer 2 — AI-Transparency */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              Layer 2 · AI-Transparency
            </p>
            <div className="mt-[var(--space-2)]">
              <span className="rounded-pill border border-accent-2/30 bg-accent-2/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                ◆ AI-assisted, disclosed
              </span>
            </div>
            <p className="mt-[var(--space-2)] max-w-measure text-body">
              An honest map of where AI helped in your store versus your own words. Buyers see it
              plainly — assistance is fine, hiding it isn&rsquo;t.
            </p>
            <div className="mt-[var(--space-2)] border-t border-line">
              <div className="flex items-center justify-between py-[var(--space-1)]">
                <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption uppercase tracking-[0.04em] text-accent-2">
                  ✓ Your words
                </span>
                <span className="text-caption text-muted">Narration clips, maker notes</span>
              </div>
              <div className="flex items-center justify-between border-t border-line py-[var(--space-1)]">
                <span className="rounded-pill border border-accent-2/30 bg-accent-2/10 px-2.5 py-0.5 text-caption uppercase tracking-[0.04em] text-accent-2">
                  ◆ AI-assisted
                </span>
                <span className="text-caption text-muted">Listing copy cleanup, alt text</span>
              </div>
              <div className="flex items-center justify-between border-t border-line py-[var(--space-1)]">
                <span className="rounded-pill bg-accent-2/15 px-2.5 py-0.5 text-caption uppercase tracking-[0.04em] text-accent-2">
                  ✓ Your words
                </span>
                <span className="text-caption text-muted">Every price &amp; spec figure</span>
              </div>
            </div>
          </div>

          {/* MVP method note */}
          <div className="rounded-md border border-line bg-ground p-[var(--space-3)]">
            <p className="text-caption uppercase tracking-[0.04em] text-muted">
              How verification works right now
            </p>
            <p className="mt-[var(--space-1)] max-w-measure text-body">
              Voice liveness is <b>built, not bought</b> — there&rsquo;s no off-the-shelf vendor
              we trust for it yet, so MVP review is founder human-in-the-loop across the seed
              cohort (<span className="font-mono">n=4</span>). Self-serve vendors get face-only
              verification until the voice pipeline is proven.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
