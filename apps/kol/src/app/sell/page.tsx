import Link from "next/link";
import { Film } from "@/components/chrome/Film";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";

/**
 * S1 — Sell explainer (/sell). KOL chrome (curated tool UI — D15 shop
 * freedom does NOT apply here). The emotional on-ramp: film leads, six
 * honest steps, the four real fears answered plainly, ONE primary CTA
 * into the interview. Guardrail: never "AI does it for you" — every
 * touchpoint is WITH the maker; she stays the author.
 */

const STEPS: { n: string; time: string; title: string; body: string }[] = [
  {
    n: "01",
    time: "15–20 min",
    title: "The interview",
    body: "A warm conversation on film or by voice. Seven things about you and your craft. You do the talking; nothing to fill in.",
  },
  {
    n: "02",
    time: "a few minutes",
    title: "We draft your world",
    body: "From your own words we build the whole shop — your colours, your words, your pieces. Grab a coffee, or come back later.",
  },
  {
    n: "03",
    time: "20–30 min",
    title: "You co-edit it",
    body: "Change any line, any colour, any piece — in plain language, together. Not a settings panel. A back-and-forth.",
  },
  {
    n: "04",
    time: "~10 min",
    title: "Your voice on top",
    body: "Record a short voiceover for the pieces you want to speak to. Your real voice — buyers hear you before they see a price.",
  },
  {
    n: "05",
    time: "your pace",
    title: "You approve, section by section",
    body: "Go through it at your own speed. Send anything back as many times as you like. Nothing is live yet.",
  },
  {
    n: "06",
    time: "instant",
    title: "Publish",
    body: "You press the button — only you. Your shop goes live with your name on it, ready for the first person to walk in.",
  },
];

const FEARS: { q: string; a: string; body: string; span: string }[] = [
  {
    q: "Do I need to design anything?",
    a: "No. Not one colour, not one layout.",
    body: "You never open a design tool or a colour picker. From what you say, we derive a look that's yours — and you nudge it in words if you want to. The design slack is ours to carry. The taste is yours.",
    span: "md:col-span-3",
  },
  {
    q: "Will it sound like me?",
    a: "Yes — it's your words and your voice.",
    body: "The writing is pulled from what you actually said, never invented. And your recorded voice sits on top. If we can't hear it from you, we leave it out rather than make it up.",
    span: "md:col-span-2",
  },
  {
    q: "How long does this take?",
    a: "About an afternoon — and you can stop anytime.",
    body: "Roughly 15–20 minutes talking, a short break while we draft, then co-editing and approving at whatever pace feels right. Come back tomorrow if you'd rather. Your progress waits for you.",
    span: "md:col-span-2",
  },
  {
    q: "What if I hate it?",
    a: "Then it doesn't go live. Simple as that.",
    body: "You approve every section yourself. Nothing publishes until you say so, and you can send any part back for another pass as many times as you need. There is no version of this where you're stuck with something you don't love.",
    span: "md:col-span-3",
  },
];

export default function SellExplainerPage() {
  return (
    <main className="pb-[var(--space-16)]">
      {/* ---- opener: the film leads, not a pitch deck ---- */}
      <header className="mx-auto w-full max-w-page px-6 pt-[var(--space-8)]">
        <Reveal>
          <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
            Sell on KOL · for makers, not web designers
          </p>
        </Reveal>
        <Reveal delayMs={STAGGER_MS}>
          <h1 className="mt-[var(--space-2)] max-w-[18ch] font-display text-display [text-wrap:balance]">
            You talk. Your whole shop gets made with you.
          </h1>
        </Reveal>
        <Reveal delayMs={STAGGER_MS * 2}>
          <p className="mt-[var(--space-2)] max-w-measure text-body-lg text-muted">
            No templates to fight, no design software to learn, no marketing to write. You answer
            a few questions the way you&rsquo;d tell a friend — and we take the design and
            marketing slack off your bench. You stay the author of every word.
          </p>
        </Reveal>
      </header>

      {/* ---- the explainer film, full and unhurried ---- */}
      <section className="mx-auto w-full max-w-page px-6 pb-[var(--space-8)] pt-[var(--space-6)]">
        <Reveal delayMs={STAGGER_MS * 3}>
          <Film
            variant="v1"
            aspect="wide"
            craft="Watch first · 2 min · sound optional"
            title="How a shop gets made on KOL — start to finish"
            className="rounded-lg"
          />
        </Reveal>
        <div className="mt-[var(--space-2)] flex flex-wrap items-center justify-between gap-2">
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Captions on · no autoplay audio · nothing here asks you to design anything
          </p>
          <button
            type="button"
            className="rounded-pill px-4 py-1.5 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ink/5"
          >
            Turn on captions
          </button>
        </div>
      </section>

      {/* ---- the path: six steps, honest times, a rail not a card grid ---- */}
      <section className="bg-ink py-[var(--space-10)] text-ground">
        <div className="mx-auto w-full max-w-page px-6">
          <p className="text-caption uppercase tracking-[0.04em] opacity-75">
            The whole path, nothing hidden
          </p>
          <h2 className="mt-[var(--space-2)] max-w-[20ch] font-display text-h1">
            Six steps. About an afternoon. You approve every one.
          </h2>

          <ol className="mt-[var(--space-6)] flex snap-x gap-[var(--space-2)] overflow-x-auto pb-2">
            {STEPS.map((s, i) => {
              const isPublish = s.n === "06";
              return (
                <Reveal
                  as="li"
                  key={s.n}
                  delayMs={i * STAGGER_MS}
                  className="shrink-0 snap-start basis-[clamp(220px,22vw,270px)]"
                >
                  <div
                    className={`h-full rounded-md border p-[var(--space-3)] ${
                      isPublish
                        ? "border-transparent bg-accent text-accent-ink"
                        : "border-ground/25 bg-ground/10 text-ground"
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-mono opacity-60">{s.n}</span>
                      <span className="text-caption uppercase tracking-[0.04em] opacity-80">
                        {s.time}
                      </span>
                    </div>
                    <h3 className="mt-[var(--space-2)] font-display text-h3">{s.title}</h3>
                    <p className="mt-[var(--space-1)] text-body opacity-90">{s.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </ol>
          <p className="mt-[var(--space-3)] text-caption uppercase tracking-[0.04em] opacity-70">
            Times are honest, not hurried. You can pause after any step and pick it back up
            whenever you like.
          </p>
        </div>
      </section>

      {/* ---- the real fears, answered plainly — mixed sizes, not a grid of sameness ---- */}
      <section className="mx-auto w-full max-w-page px-6 py-[var(--space-10)]">
        <Reveal>
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Straight answers to what you&rsquo;re actually wondering
          </p>
        </Reveal>
        <Reveal delayMs={STAGGER_MS}>
          <h2 className="mt-[var(--space-2)] max-w-[28ch] font-display text-h1 [text-wrap:balance]">
            You&rsquo;re an artist. Not a web designer, not a marketer. Good — that&rsquo;s the
            whole point.
          </h2>
        </Reveal>

        <div className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-3)] md:grid-cols-5">
          {FEARS.map((f, i) => (
            <Reveal key={f.q} delayMs={i * STAGGER_MS} className={f.span}>
              <div className="h-full rounded-md border border-line bg-surface p-[var(--space-4)] shadow-subtle">
                <p className="text-caption uppercase tracking-[0.04em] text-accent">{f.q}</p>
                <p className="mt-[var(--space-1)] font-display text-h3">{f.a}</p>
                <p className="mt-[var(--space-2)] max-w-measure text-body text-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---- one CTA, no competing actions ---- */}
      <section className="bg-block-a py-[var(--space-12)] text-on-block-a">
        <div className="mx-auto w-full max-w-[820px] px-6 text-center">
          <h2 className="mx-auto max-w-[18ch] font-display text-display [text-wrap:balance]">
            Talk for twenty minutes. Walk out with a shop that&rsquo;s yours.
          </h2>
          <p className="mx-auto mt-[var(--space-3)] max-w-measure text-body-lg opacity-90">
            No card needed to start. No design skill needed, ever. Just you, your craft, and a
            conversation.
          </p>
          <div className="mt-[var(--space-6)] flex justify-center">
            <Link
              href="/sell/interview"
              className="inline-flex min-h-11 items-center rounded-pill bg-ink px-8 py-3 text-body-lg font-bold text-ground transition-transform duration-tap ease-kol hover:bg-ink/90 active:scale-[0.98]"
            >
              Start the interview
            </Link>
          </div>
          <p className="mt-[var(--space-2)] text-caption uppercase tracking-[0.04em] opacity-80">
            You can pause and come back at any step · nothing publishes without you
          </p>
        </div>
      </section>
    </main>
  );
}
