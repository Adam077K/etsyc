/**
 * Events & Live (B19 · v1.1) — /m/[maker]/live. ROADMAP, NOT MVP
 * (D16-8): streaming infra doesn't gate the recorded-video loop, so
 * this surface is designed-for, not shipped. It exists to protect
 * forward-compat seams. Hard bans hold everywhere: no countdowns, no
 * scarcity, no "starting soon" pressure — presence is the pitch,
 * urgency is not.
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { events, feedItems, getMaker } from "@/lib/mock/db";
import { Film } from "@/components/chrome/Film";

const KIND_LABEL: Record<string, string> = {
  workshop: "Workshop",
  "studio-tour": "Studio tour",
  launch: "Launch",
};

const CHAT: { author: string; body: string }[] = [
  { author: "Priya", body: "How wet is the clay when you pull like that?" },
  { author: "Sena", body: "Softer than you'd think — I'll show you the seam." },
  { author: "Marco", body: "That wobble at the top is so satisfying." },
  { author: "Aylin", body: "Is the winter glaze on these?" },
];

export default async function LivePage({
  params,
}: {
  params: Promise<{ maker: string }>;
}) {
  const { maker: slug } = await params;
  const maker = getMaker(slug);
  if (!maker) notFound();

  const makerEvents = events.filter((e) => e.makerSlug === slug);
  const upcoming = makerEvents.filter((e) => !e.vod);
  const vods = makerEvents.filter((e) => e.vod);
  const recordings = feedItems.filter((f) => f.makerSlug === slug && f.kind === "video");

  return (
    <main className="pb-24">
      {/* unmissable roadmap banner */}
      <div className="bg-block-a text-on-block-a">
        <div className="mx-auto max-w-page px-6 py-6">
          <p className="text-caption uppercase tracking-[0.08em] opacity-85">
            Roadmap · not shipping now
          </p>
          <h2 className="mt-1 font-display text-h3 font-bold">
            ROADMAP v1.1 — NOT MVP (D16-8)
          </h2>
          <p className="mt-1 max-w-measure text-body opacity-90">
            Streaming infra doesn&rsquo;t gate the recorded-video loop; this surface is
            designed-for, not shipped.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-page px-6">
        {/* header */}
        <header className="py-10">
          <p className="text-caption uppercase tracking-[0.08em] text-muted">
            {maker.name}&rsquo;s world · {maker.craft} · {maker.location}
          </p>
          <h1 className="mt-2 font-display text-display text-ink">Live &amp; upcoming</h1>
          <p className="mt-3 max-w-measure text-body-lg text-muted">
            The nearest thing to standing in the studio. Same recorded-video ethos — just
            happening in real time, with no reason to rush you.
          </p>
        </header>

        {/* upcoming events */}
        <section aria-label="Upcoming" className="pb-12">
          <h2 className="mb-4 font-display text-h2 text-ink">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line bg-surface/60 px-6 py-10">
              <p className="font-display text-h3 text-muted">Nothing on the calendar</p>
              <p className="mt-2 max-w-measure text-body text-muted/80">
                When {maker.name} schedules a workshop, a studio tour, or a first showing,
                it appears here — and every session becomes a recording afterwards.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {upcoming.map((e) => (
                <article
                  key={e.id}
                  className="flex flex-wrap items-stretch overflow-hidden rounded-md border border-line bg-surface shadow-subtle"
                >
                  <div className="min-w-[280px] flex-1">
                    <Film variant={maker.filmClass} aspect="wide" rounded={false}>
                      <p className="text-caption uppercase opacity-85">
                        {KIND_LABEL[e.kind] ?? e.kind}
                      </p>
                      <p className="font-display text-h3 font-bold">{e.title}</p>
                    </Film>
                  </div>
                  <div className="flex min-w-[280px] flex-1 flex-col justify-center gap-2 p-5">
                    <span className="self-start rounded-pill border border-line bg-ground px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                      {KIND_LABEL[e.kind] ?? e.kind}
                    </span>
                    <p className="text-body font-semibold text-ink">{e.title}</p>
                    <p className="text-caption text-muted">{e.when} · in your own time</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="min-h-11 rounded-pill bg-accent-cta px-6 text-body font-bold text-accent-ink transition-transform duration-tap ease-kol hover:bg-accent-cta/90 active:scale-[0.98]"
                      >
                        RSVP
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded-pill border border-line bg-surface px-5 text-body text-ink transition-colors duration-state ease-kol hover:bg-ground"
                      >
                        Add to calendar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* live session view — mock */}
        <section aria-label="Live session" className="pb-12">
          <h2 className="mb-4 font-display text-h2 text-ink">In the room</h2>
          <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* the stream */}
            <div>
              <Film variant={maker.filmClass} aspect="wide">
                <p className="text-caption uppercase opacity-85">
                  ● Live · {maker.name} · at the bench
                </p>
                <p className="font-display text-h3 font-bold">
                  Working slowly, on purpose
                </p>
              </Film>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <span className="text-caption text-muted">62 watching · started earlier</span>
                <span className="flex items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2 text-caption uppercase tracking-[0.04em] text-ink">
                  <span aria-hidden className="flex items-center gap-[3px]">
                    {[6, 12, 8, 14, 5].map((h, i) => (
                      <span
                        key={i}
                        className="w-[3px] rounded-pill bg-accent"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </span>
                  Voice-anchored · this is really {maker.name}
                </span>
              </div>
            </div>

            {/* calm chat column */}
            <div className="flex min-h-[320px] flex-col overflow-hidden rounded-md border border-line bg-surface shadow-subtle">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-caption uppercase tracking-[0.04em] text-muted">
                  Live chat
                </span>
                <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption uppercase tracking-[0.04em] text-muted">
                  Moderation: v1.1
                </span>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
                {CHAT.map((m, i) => (
                  <div key={i} className={i > 0 ? "border-t border-line pt-3" : ""}>
                    <p className="text-caption uppercase tracking-[0.04em] text-muted">
                      {m.author}
                    </p>
                    <p className="mt-0.5 text-body text-ink">{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-line p-3">
                <input
                  aria-label="Say something"
                  placeholder="Say something…"
                  className="min-h-11 min-w-0 flex-1 rounded-pill border border-line bg-ground px-4 font-text text-body text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                />
                <button
                  type="button"
                  className="min-h-11 rounded-pill border border-line bg-ground px-5 text-body text-ink transition-colors duration-state ease-kol hover:bg-surface"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* designer's note — the restraint, made explicit */}
      <section
        aria-label="Designer's note"
        className="text-on-block-a"
        style={{ background: "linear-gradient(120deg, var(--block-a), var(--block-c))" }}
      >
        <div className="mx-auto max-w-page px-6 py-16">
          <p className="text-caption uppercase tracking-[0.08em] opacity-85">
            Designer&rsquo;s note · the restraint
          </p>
          <h2 className="mt-2 max-w-[26ch] font-display text-h2">
            Live is the purest &ldquo;meet the real maker&rdquo; proof — so we refuse to
            cheapen it.
          </h2>
          <p className="mt-4 max-w-measure text-body-lg opacity-90">
            Every convention of live commerce pulls the other way: countdown timers,
            &ldquo;only 3 left,&rdquo; flash prices, a host manufacturing panic. The KOL
            design system bans that chrome and D16-8 guards it explicitly — no auction, no
            sales pressure.
          </p>
          <p className="mt-3 max-w-measure text-body-lg opacity-90">
            So this page has none of it. No clock. No scarcity counter. No &ldquo;buy now
            before it&rsquo;s gone.&rdquo; You watch someone make something, you talk to
            them, and you buy later in their world if you want to — at the same price it
            would always have been. Presence is the pitch; urgency is not.
          </p>
        </div>
      </section>

      {/* past sessions — VOD rail */}
      <section aria-label="Past sessions" className="mx-auto w-full max-w-page px-6 pt-12">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-h2 text-ink">Past sessions</h2>
          <span className="text-caption uppercase tracking-[0.04em] text-muted">Scroll →</span>
        </div>
        <p className="mb-4 max-w-measure text-body text-muted">
          Missed one? Every session becomes a recording — the same footage the rest of the
          world sees. Nothing here expires.
        </p>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {vods.map((e) => (
            <Link key={e.id} href={`/m/${slug}`} className="w-60 flex-none">
              <Film variant={maker.filmClass} aspect="tall">
                <p className="text-caption uppercase opacity-85">
                  {KIND_LABEL[e.kind] ?? e.kind} · recording
                </p>
                <p className="font-display text-h3 font-bold">{e.title}</p>
              </Film>
              <p className="mt-2 text-caption text-muted">{e.when}</p>
            </Link>
          ))}
          {recordings.map((f) => (
            <Link key={f.id} href={`/m/${slug}`} className="w-60 flex-none">
              <Film variant={maker.filmClass} aspect="tall">
                <p className="text-caption uppercase opacity-85">From the world · recording</p>
                <p className="font-display text-h3 font-bold">{f.title}</p>
              </Film>
              <p className="mt-2 text-caption text-muted">Watch any time</p>
            </Link>
          ))}
          {vods.length === 0 && recordings.length === 0 ? (
            <div className="w-full rounded-lg border border-dashed border-line bg-surface/60 px-6 py-10">
              <p className="font-display text-h3 text-muted">No recordings yet</p>
              <p className="mt-2 max-w-measure text-body text-muted/80">
                The first session {maker.name} runs will live here afterwards, permanently.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
