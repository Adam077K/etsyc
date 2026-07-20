"use client";

import { MessageCircle } from "lucide-react";
import { SmartImage } from "@/components/media/SmartImage";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/button";
import { imageById, BlockSection, type BlockProps } from "../shared";

/**
 * Block 11 · contact-cta — the world's closing note. One accent action, low
 * urgency (relationship, not conversion pressure). Body/UI copy ⇒ only dark
 * block-grounds (AA body 4.5:1); midtone --block-c is rejected upstream.
 * Loading is n/a (static from maker data); empty = messaging disabled →
 * block hidden (no dead CTA).
 */
export function ContactCtaBlock({ block, data, state = "success" }: BlockProps<"contact-cta">) {
  const ground = block.props.blockGround ?? null;
  const avatar = imageById(data, data.maker.avatarMediaId);

  // Empty: messaging not enabled for this maker → no dead CTA.
  if (state === "empty") return null;

  // Error: message action unavailable → disabled with a reason, never a broken click.
  const disabled = state === "error";
  const cta = (
    <Button
      variant="accent"
      disabled={disabled}
      title={disabled ? "Messaging opens soon" : undefined}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {block.props.label}
    </Button>
  );

  if (block.variant === "button") {
    return (
      <BlockSection ground={ground}>
        <Reveal className="flex justify-center">{cta}</Reveal>
      </BlockSection>
    );
  }

  if (block.variant === "card") {
    return (
      <BlockSection ground={ground}>
        <Reveal className="mx-auto flex max-w-md flex-col items-center gap-[var(--space-3)] rounded-lg border border-line bg-surface p-[var(--space-6)] text-center">
          {avatar ? <SmartImage image={avatar} className="w-24 rounded-pill" /> : null}
          <div>
            <p className="font-display text-h3">{data.maker.displayName}</p>
            {/* full --ink (→ --on-block-* on colored grounds) — the mixed
                muted tone fails AA at caption size on block-grounds */}
            <p className="mt-0.5 text-caption uppercase tracking-[0.08em] text-ink">
              @{data.maker.handle} · {data.maker.location}
            </p>
          </div>
          {cta}
        </Reveal>
      </BlockSection>
    );
  }

  // footer-strip — full-width close with handle + message action
  return (
    <BlockSection ground={ground} className={ground ? undefined : "border-t border-line"}>
      <div className="flex flex-col items-start justify-between gap-[var(--space-4)] py-[var(--space-6)] md:flex-row md:items-center">
        <Reveal>
          <p className="font-display text-h2 [text-wrap:balance]">
            Keep in touch with {data.maker.displayName.split(" ")[0]}
          </p>
          <p className="mt-1 text-caption uppercase tracking-[0.08em] text-ink">
            @{data.maker.handle}
          </p>
        </Reveal>
        <Reveal delayMs={STAGGER_MS}>{cta}</Reveal>
      </div>
    </BlockSection>
  );
}
