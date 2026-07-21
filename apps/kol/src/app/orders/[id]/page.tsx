import Link from "next/link";
import { notFound } from "next/navigation";
import { Film } from "@/components/chrome/Film";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import {
  formatPrice,
  getMaker,
  getOrder,
  getProduct,
  orderStages,
  type MockMaker,
  type MockOrder,
} from "@/lib/mock/db";

/**
 * Order detail (B9) + thank-you moment (B8).
 * Hard AC (D10): the thank-you film + message are maker-authored or neutral —
 * never AI-fabricated. No synthetic voice or face, ever.
 * With ?placed=1 the thank-you leads the page; otherwise it closes it, quietly.
 */

function ThankYouMoment({
  maker,
  order,
  prominent,
}: {
  maker: MockMaker;
  order: MockOrder;
  prominent: boolean;
}) {
  return (
    <Reveal as="section" className={prominent ? "" : "mt-[var(--space-8)]"}>
      {prominent ? (
        <p className="mb-[var(--space-2)] text-caption uppercase tracking-[0.08em] text-muted">
          Order placed · a note from {maker.name}
        </p>
      ) : (
        <p className="mb-[var(--space-2)] text-caption uppercase tracking-[0.04em] text-muted">
          The note {maker.name} sent with this order
        </p>
      )}
      <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-card">
        <Film
          variant={maker.filmClass}
          aspect="wide"
          rounded={false}
          craft={`A note from ${maker.name}`}
          title={prominent ? "Thank you" : undefined}
        />
        <div className="p-[var(--space-3)]">
          {order.thankYou ? (
            <p className="max-w-measure text-body-lg text-ink">
              &ldquo;{order.thankYou}&rdquo;
              <span className="text-muted"> — {maker.name}</span>
            </p>
          ) : (
            <p className="max-w-measure text-body text-muted">
              Your order is confirmed. {maker.name} will post updates here as the work moves.
            </p>
          )}
          <p className="mt-[var(--space-2)] text-caption text-muted">
            Maker-authored — never AI-generated
          </p>
        </div>
      </div>
    </Reveal>
  );
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  // Next 16: both route params and search params arrive as Promises.
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  const justPlaced = placed === "1";

  const order = getOrder(id);
  if (!order) notFound();
  const maker = getMaker(order.makerSlug);
  if (!maker) notFound();

  const itemsSummary = order.items
    .map((item) => {
      const product = getProduct(item.productId);
      const title = product?.title ?? item.productId;
      return item.qty > 1 ? `${title} ×${item.qty}` : title;
    })
    .join(" · ");

  return (
    <main className="mx-auto w-full max-w-[840px] px-[var(--space-3)] pb-[var(--space-16)] pt-[var(--space-8)]">
      {/* THANK-YOU MOMENT — leads the page right after purchase (B8) */}
      {justPlaced ? <ThankYouMoment maker={maker} order={order} prominent /> : null}

      <Reveal
        as="header"
        delayMs={justPlaced ? STAGGER_MS : 0}
        className={justPlaced ? "mt-[var(--space-6)]" : ""}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-caption uppercase tracking-[0.08em] text-muted">
              Order #{order.id} · placed {order.placed}
            </p>
            <h1 className="mt-[var(--space-1)] max-w-measure font-display text-h1 text-ink [text-wrap:balance]">
              {itemsSummary}
            </h1>
            <p className="mt-[var(--space-1)] text-body text-muted">
              {maker.name} · {maker.craft} · {maker.location}
            </p>
          </div>
          <span className="font-mono text-h3 text-ink">{formatPrice(order.totalMinor)}</span>
        </div>
      </Reveal>

      {/* PRODUCTION TIMELINE — maker-posted stages, not a status bar */}
      <Reveal
        as="section"
        delayMs={STAGGER_MS * 2}
        className="mt-[var(--space-6)] rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle"
      >
        <p className="text-caption uppercase tracking-[0.04em] text-muted">
          How it&rsquo;s coming along
        </p>
        <ol className="mt-[var(--space-3)]">
          {orderStages.map((label, i) => {
            const reached = i <= order.stage;
            const current = i === order.stage;
            const update = order.updates.find((u) => u.stage === i);
            const isLast = i === orderStages.length - 1;

            return (
              <li key={label} className={`relative pl-8 ${isLast ? "" : "pb-[var(--space-4)]"}`}>
                {isLast ? null : (
                  <span
                    aria-hidden
                    className={`absolute bottom-0 left-[7px] top-5 w-px ${
                      i < order.stage ? "bg-accent" : "bg-line"
                    }`}
                  />
                )}
                <span
                  aria-hidden
                  className={`absolute left-0 top-1 h-[15px] w-[15px] rounded-pill border ${
                    reached ? "border-accent bg-accent" : "border-line bg-surface"
                  }`}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-body font-medium ${reached ? "text-ink" : "text-muted"}`}>
                    {label}
                  </p>
                  {current ? (
                    <span className="rounded-pill border border-line bg-ground px-2 py-0.5 text-caption text-muted">
                      now
                    </span>
                  ) : null}
                </div>

                {update ? (
                  <div className="mt-1">
                    <p className="text-caption text-muted">{update.when}</p>
                    <p className="max-w-measure text-body text-ink">
                      &ldquo;{update.note}&rdquo;
                      <span className="text-muted"> — {maker.name}</span>
                    </p>
                  </div>
                ) : reached ? null : (
                  <p className="mt-1 text-caption text-muted">
                    {maker.name} posts here when the work reaches this step.
                  </p>
                )}

                {/* plain tracking row once shipped — a fact, not a countdown */}
                {i === 4 && reached ? (
                  <div className="mt-[var(--space-2)] flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-ground/60 px-[var(--space-2)] py-[var(--space-1)]">
                    <span className="text-caption uppercase tracking-[0.04em] text-muted">
                      Tracking
                    </span>
                    <span className="font-mono text-body text-ink">USPS · 9400 1108 2201 4412</span>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </Reveal>

      {/* CUSTOMIZATION CHECKPOINT — approved; nothing fires without sign-off */}
      <Reveal
        as="section"
        delayMs={STAGGER_MS * 3}
        className="mt-[var(--space-4)] rounded-lg border border-line bg-surface p-[var(--space-4)] shadow-subtle"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-caption uppercase tracking-[0.04em] text-muted">
            Customization checkpoint
          </p>
          <span className="rounded-pill border border-line bg-ground px-3 py-1 text-caption text-ink">
            ✓ Approved
          </span>
        </div>
        <p className="mt-[var(--space-1)] max-w-measure text-body text-ink">
          You approved the final details before {maker.name} fired the batch. Nothing ships
          without your sign-off.
        </p>
        <Link
          href="/inbox/t-tumbler"
          className="mt-[var(--space-2)] inline-flex min-h-11 items-center text-caption uppercase tracking-[0.04em] text-muted underline-offset-4 transition-colors duration-state ease-kol hover:text-ink hover:underline"
        >
          Message {maker.name} about this order
        </Link>
      </Reveal>

      {/* quiet thank-you at the end on ordinary visits */}
      {justPlaced ? null : <ThankYouMoment maker={maker} order={order} prominent={false} />}
    </main>
  );
}
