"use client";

import { TapToHear } from "@/components/media/TapToHear";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { EmptyPrompt } from "@/components/states/EmptyPrompt";
import { Skeleton } from "@/components/states/Skeleton";
import { BlockSection, voiceoverById, type BlockProps } from "../shared";

/**
 * Block 5 · voice-quote — the "hear her say it" honest-voice moment (D10).
 * Text never waits on audio; audio failure degrades silently to text-only
 * (TapToHear removes itself, no error chrome). Display type ⇒ ALL three
 * block-grounds are valid here, including the two midtone --block-c grounds
 * (large-text-only).
 */
export function VoiceQuoteBlock({ block, data, state = "success", isPreview }: BlockProps<"voice-quote">) {
  const voiceover = block.bindings.voiceoverIds[0]
    ? voiceoverById(data, block.bindings.voiceoverIds[0])
    : undefined;
  const ground = block.props.blockGround ?? null;

  // Empty: live hides the block entirely (never a blank quote frame);
  // seller preview shows the interview-beat prompt instead of blank.
  if (state === "empty" || block.props.quote.length === 0) {
    if (!isPreview) return null;
    return (
      <BlockSection>
        <EmptyPrompt
          prompt="One line, in your own voice"
          hint="Say it out loud in your interview — we set the words here and buyers can tap to hear you say them."
        />
      </BlockSection>
    );
  }

  if (state === "loading") {
    // text shows immediately — only the audio affordance waits
    return (
      <BlockSection ground={ground}>
        <figure className="mx-auto max-w-[28ch] space-y-[var(--space-3)] text-center">
          <QuoteText quote={block.props.quote} attribution={block.props.attribution} />
          {block.variant !== "text-only" ? (
            <Skeleton aria-busy="true" className="mx-auto h-8 w-48 rounded-pill" />
          ) : null}
        </figure>
      </BlockSection>
    );
  }

  // Error: audio unavailable → text-only, affordance removed, no chrome.
  const audioAvailable =
    block.variant !== "text-only" && voiceover !== undefined && state !== "error";

  return (
    <BlockSection ground={ground}>
      <figure className="mx-auto max-w-[28ch] space-y-[var(--space-3)] text-center">
        <Reveal>
          <QuoteText quote={block.props.quote} attribution={block.props.attribution} />
        </Reveal>
        {audioAvailable ? (
          <Reveal delayMs={STAGGER_MS * 2} className="flex justify-center">
            <TapToHear
              src={voiceover.src}
              label={voiceover.label}
              showWaveform={block.variant === "text+waveform"}
            />
          </Reveal>
        ) : null}
      </figure>
    </BlockSection>
  );
}

function QuoteText({ quote, attribution }: { quote: string; attribution?: string }) {
  return (
    <>
      {/* display face at restraint — curly quotes per typographic craft §3 */}
      <blockquote className="font-display text-h1 [text-wrap:balance]">
        &ldquo;{quote}&rdquo;
      </blockquote>
      {/* attribution sets in full --ink (→ the AA-certified --on-block-*
          pair on colored grounds; groundStyle points --muted there too) */}
      {attribution ? (
        <figcaption className="text-caption uppercase tracking-[0.08em] text-ink">
          — {attribution}
        </figcaption>
      ) : null}
    </>
  );
}
