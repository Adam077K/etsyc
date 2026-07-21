"use client";

import { useEffect, useState } from "react";
import { Film } from "@/components/chrome/Film";
import { interviewBeats } from "@/lib/mock/db";

/**
 * S2 — Adaptive interview (/sell/interview). KOL chrome, film-always-wins.
 * Seven FIXED beats in order + bounded smart follow-ups (max 3/beat),
 * always labelled as follow-ups — never as beats. The interviewer only
 * asks and reflects; it never writes her story. Warm register throughout:
 * a curious shopkeeper leaning on the counter, not a form.
 */

const BEAT_LABELS: Record<string, string> = {
  "Story & origin": "Story & origin",
  Craft: "Craft",
  Workshop: "Your workshop",
  Values: "What you won't compromise on",
  Brand: "The feel of your shop",
  Personal: "You, not just the work",
  "Product stories": "The pieces you love",
};

/**
 * Her transcript for the active beat. This is the literal text sent to
 * /api/ai/interview — the follow-ups on screen are generated from these
 * exact words and nothing else.
 */
const TRANSCRIPT_LINES = [
  {
    at: "3:31",
    text: "I start every pot by wedging the clay by hand — you push and fold it until the air's out and it moves like it wants to.",
  },
  {
    at: "3:48",
    text: "I can feel when it's ready, honestly, before I ever centre it on the wheel.",
  },
  {
    at: "4:12",
    text: "The ridge tumblers are the ones I'm known for — I throw them tall, then pull three grooves in with my thumb so they sit in your hand…",
  },
];

const TRANSCRIPT = TRANSCRIPT_LINES.map((l) => l.text).join(" ");

const PRIOR_ANSWERS = [
  "I left restaurant kitchens twelve years ago. The wheel was the first thing that ever slowed me down.",
];

interface FollowUp {
  because: string;
  question: string;
}

interface InterviewApiResponse {
  simulated: boolean;
  followUps: FollowUp[];
  extracted: { field: string; value: string; quote: string }[];
  droppedFacts: { field: string; value: string; quote: string }[];
  beatSatisfied: boolean;
  error?: string;
}

export default function SellInterviewPage() {
  const [mode, setMode] = useState<"film" | "voice">("film");
  const [paused, setPaused] = useState(false);

  /* ---- real follow-ups, generated from what she actually said ---- */
  const [ai, setAi] = useState<InterviewApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      try {
        const res = await fetch("/api/ai/interview", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            beat: "Craft",
            transcriptSoFar: TRANSCRIPT,
            priorAnswers: PRIOR_ANSWERS,
            followUpsAsked: 0,
          }),
        });
        const data: InterviewApiResponse = await res.json();
        if (!live) return;
        if (!res.ok) setFailed(true);
        else setAi(data);
      } catch {
        if (live) setFailed(true);
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  const followUps = ai?.followUps ?? [];
  const askedCount = followUps.length;

  const activeBeatIndex = 1; // beat 1 done, beat 2 (Craft) active

  return (
    <main className="mx-auto w-full max-w-page px-6 pb-[var(--space-16)] pt-[var(--space-8)]">
      {/* ---- opener: a conversation, framed warmly ---- */}
      <header className="flex flex-wrap items-start justify-between gap-[var(--space-4)]">
        <div>
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Your interview · Sena · Stoneware, Hudson Valley
          </p>
          <h1 className="mt-[var(--space-2)] max-w-[24ch] font-display text-h1 [text-wrap:balance]">
            Tell me how one piece is actually made.
          </h1>
          <p className="mt-[var(--space-2)] max-w-measure text-body-lg text-muted">
            Talk the way you&rsquo;d tell a friend across the bench. There are no wrong answers
            and nothing to write — I&rsquo;m just listening, and I&rsquo;ll follow what you say.
          </p>
        </div>

        {/* film / voice toggle */}
        <div>
          <p className="text-right text-caption uppercase tracking-[0.04em] text-muted">
            How you&rsquo;d like to answer
          </p>
          <div className="mt-[var(--space-1)] flex gap-[var(--space-1)]">
            <button
              type="button"
              aria-pressed={mode === "film"}
              onClick={() => setMode("film")}
              className={`rounded-pill border px-4 py-1.5 text-caption transition-colors duration-state ease-kol ${
                mode === "film"
                  ? "border-transparent bg-ink text-ground"
                  : "border-line bg-surface text-ink hover:bg-ground"
              }`}
            >
              ◉ On film
            </button>
            <button
              type="button"
              aria-pressed={mode === "voice"}
              onClick={() => setMode("voice")}
              className={`rounded-pill border px-4 py-1.5 text-caption transition-colors duration-state ease-kol ${
                mode === "voice"
                  ? "border-transparent bg-ink text-ground"
                  : "border-line bg-surface text-ink hover:bg-ground"
              }`}
            >
              Voice only
            </button>
          </div>
        </div>
      </header>

      <div className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-4)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* ==== LEFT: the recording frame + current question ==== */}
        <div className="flex flex-col gap-[var(--space-3)]">
          {/* live recording frame */}
          <div className="relative">
            <Film
              variant="v1"
              aspect="wide"
              play={false}
              craft={
                mode === "film"
                  ? "You, at the wheel · north-light window behind you"
                  : "Voice only · camera off, we're still listening"
              }
              title={`Sena — beat ${activeBeatIndex + 1} of ${interviewBeats.length}`}
            />
            <div className="absolute left-[var(--space-2)] top-[var(--space-2)] z-10 flex items-center gap-[var(--space-1)] rounded-pill bg-ink/60 px-3 py-1">
              <span
                aria-hidden
                className={`inline-block h-2 w-2 rounded-pill ${paused ? "bg-on-media/50" : "bg-accent"}`}
              />
              <span className="text-caption uppercase tracking-[0.04em] text-on-media">
                {paused ? "Paused" : "Recording"} · <span className="font-mono">4:12</span>
              </span>
            </div>
          </div>

          {/* controls: warm, not an interrogation panel */}
          <div className="flex flex-wrap gap-[var(--space-2)]">
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
            >
              {paused ? "▶ Resume" : "⏸ Pause"}
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-5 py-2 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground active:scale-[0.98]"
            >
              ↺ Re-record this answer
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-pill px-5 py-2 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
            >
              Skip this question
            </button>
            <button
              type="button"
              className="inline-flex min-h-11 items-center rounded-pill px-5 py-2 text-body text-muted transition-colors duration-state ease-kol hover:bg-ink/5 hover:text-ink"
            >
              Save &amp; come back later
            </button>
          </div>

          {/* the CURRENT question, prominent */}
          <section className="rounded-md border border-accent bg-accent/5 p-[var(--space-4)]">
            <p className="text-caption uppercase tracking-[0.04em] text-accent">
              On screen now · Beat 2 · Craft
            </p>
            <p className="mt-[var(--space-1)] font-display text-h2 [text-wrap:balance]">
              What does your hands&rsquo; work look like on an ordinary morning?
            </p>
            <p className="mt-[var(--space-2)] text-body text-muted">
              Take your time. When you&rsquo;re done, just say so — I&rsquo;ll only ask more if I
              missed something.
            </p>
          </section>

          {/* adaptive follow-ups — clearly marked, never confused with beats */}
          <section className="flex flex-col gap-[var(--space-2)]">
            <div className="flex flex-wrap items-center gap-[var(--space-2)]">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-2/30 bg-accent-2/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent-2">
                ✦ follow-up · from what you just said
              </span>
              <span className="text-caption uppercase tracking-[0.04em] text-muted">
                not fixed questions · max 3 per beat · {askedCount} asked
              </span>
              {ai?.simulated ? (
                <span className="rounded-pill border border-accent/30 bg-accent/10 px-3 py-1 text-caption uppercase tracking-[0.04em] text-accent">
                  ⚠ simulated · no model ran
                </span>
              ) : null}
            </div>

            {loading ? (
              <div className="rounded-md border border-line border-l-2 border-l-accent-2 bg-surface p-[var(--space-3)]">
                <p className="text-caption uppercase tracking-[0.04em] text-accent-2">
                  Listening to what you just said →
                </p>
                <span className="kol-skeleton mt-[var(--space-2)] inline-block h-4 w-3/4 rounded-sm" />
              </div>
            ) : null}

            {failed ? (
              <div className="rounded-md border border-accent bg-accent/5 p-[var(--space-3)]">
                <p className="text-caption uppercase tracking-[0.04em] text-accent">
                  No follow-up right now
                </p>
                <p className="mt-[var(--space-1)] text-body text-muted">
                  We couldn&rsquo;t reach the interviewer. Rather than guess at a question, we
                  won&rsquo;t ask one — keep going and we&rsquo;ll catch up.
                </p>
              </div>
            ) : null}

            {followUps.map((f) => (
              <div
                key={f.question}
                className="rounded-md border border-line border-l-2 border-l-accent-2 bg-surface p-[var(--space-3)]"
              >
                <p className="text-caption uppercase tracking-[0.04em] text-accent-2">
                  {f.because}
                </p>
                <p className="mt-[var(--space-1)] font-display text-h3">{f.question}</p>
              </div>
            ))}

            {!loading && !failed && followUps.length === 0 ? (
              <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
                <p className="text-body text-muted">
                  Nothing more to ask on this one — your craft is covered. We move on.
                </p>
              </div>
            ) : null}

            {ai !== null && ai.droppedFacts.length > 0 ? (
              <p className="text-caption text-muted">
                {ai.droppedFacts.length} detail
                {ai.droppedFacts.length === 1 ? " was" : "s were"} discarded because we
                couldn&rsquo;t trace {ai.droppedFacts.length === 1 ? "it" : "them"} back to your
                own words. Nothing gets kept that you didn&rsquo;t say.
              </p>
            ) : null}

            <p className="text-caption text-muted">
              I won&rsquo;t push past three. When your craft&rsquo;s covered, we move on —
              you&rsquo;re never stuck in a loop.
            </p>
          </section>
        </div>

        {/* ==== RIGHT: 7-beat progress rail + live transcript ==== */}
        <aside className="flex flex-col gap-[var(--space-3)]">
          {/* story progress */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <div className="flex items-baseline justify-between">
              <p className="text-caption uppercase tracking-[0.04em] text-muted">
                Your story so far
              </p>
              <span className="font-mono text-caption text-muted">
                {activeBeatIndex + 1} of {interviewBeats.length}
              </span>
            </div>
            <ol className="mt-[var(--space-2)] flex flex-col gap-1">
              {interviewBeats.map((beat, i) => {
                const done = i < activeBeatIndex;
                const active = i === activeBeatIndex;
                return (
                  <li
                    key={beat}
                    className={`flex items-center justify-between rounded-sm px-2 py-[var(--space-1)] ${
                      active ? "bg-accent/10" : ""
                    }`}
                  >
                    <span className="flex items-center gap-[var(--space-2)]">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-pill text-caption ${
                          done
                            ? "bg-accent-2/15 text-accent-2"
                            : active
                              ? "bg-accent text-accent-ink"
                              : "border border-line text-muted"
                        }`}
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className={active ? "font-semibold text-ink" : done ? "text-ink" : "text-muted"}>
                        {BEAT_LABELS[beat] ?? beat}
                      </span>
                    </span>
                    {done ? (
                      <span className="text-caption uppercase tracking-[0.04em] text-muted">done</span>
                    ) : active ? (
                      <span className="text-caption uppercase tracking-[0.04em] text-accent">now</span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
            <p className="mt-[var(--space-2)] text-caption text-muted">
              Seven beats, always in this order. The follow-ups change; the spine doesn&rsquo;t.
            </p>
          </div>

          {/* live transcript */}
          <div className="rounded-md border border-line bg-surface p-[var(--space-3)]">
            <div className="flex items-center justify-between">
              <p className="text-caption uppercase tracking-[0.04em] text-muted">Live transcript</p>
              <span className="inline-flex items-center gap-2 rounded-pill border border-line px-3 py-1 text-caption text-muted">
                <span aria-hidden className="flex items-end gap-0.5">
                  {[5, 12, 8, 14, 6].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}px` }}
                      className="w-0.5 rounded-pill bg-accent"
                    />
                  ))}
                </span>
                listening
              </span>
            </div>
            <div className="mt-[var(--space-2)] flex flex-col gap-[var(--space-2)]">
              {TRANSCRIPT_LINES.map((line, i) => (
                <p key={line.at} className="max-w-measure text-body">
                  <span className="font-mono text-caption text-muted">{line.at}</span>
                  <br />
                  &ldquo;{line.text}&rdquo;{" "}
                  {i === TRANSCRIPT_LINES.length - 1 ? (
                    <span className="kol-skeleton inline-block h-3 w-28 rounded-sm align-middle" />
                  ) : null}
                </p>
              ))}
            </div>
            <p className="mt-[var(--space-2)] text-caption text-muted">
              This is exactly what you said — nothing added. It becomes the words in your shop.
            </p>
          </div>

          {/* a note on how this feels */}
          <div className="rounded-md bg-ink p-[var(--space-3)] text-ground">
            <p className="text-caption uppercase tracking-[0.04em] opacity-70">
              A note on how this feels
            </p>
            <p className="mt-[var(--space-1)] max-w-measure text-body">
              This is built to feel like a curious shopkeeper leaning on the counter — not a
              form, not an interrogation. It asks, then it listens. It never probes more than
              three times on one thing, and you can pause, redo, skip, or leave and finish
              tomorrow. It never writes your story for you — it only asks and reflects.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
