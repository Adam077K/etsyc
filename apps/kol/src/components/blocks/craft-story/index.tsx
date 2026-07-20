import { SmartImage } from "@/components/media/SmartImage";
import { Reveal, STAGGER_MS } from "@/components/motion/Reveal";
import { EmptyPrompt } from "@/components/states/EmptyPrompt";
import { Skeleton, SkeletonLines } from "@/components/states/Skeleton";
import { cn } from "@/lib/utils";
import { BlockSection, imageById, type BlockProps } from "../shared";

/**
 * Block 2 · craft-story — the "meet the human" editorial reading moment.
 * Body at --fs-body-lg, 65ch measure; display face used ONCE (heading or
 * pull-quote, never both). May color-block only on dark grounds (AA body
 * 4.5:1) unless the variant is pull-quote — enforced upstream by the catalog
 * + critic; this component renders whatever ground the config carries.
 */
export function CraftStoryBlock({ block, data, state = "success", isPreview }: BlockProps<"craft-story">) {
  const image = imageById(data, block.bindings.imageIds[0]);
  const ground = block.props.blockGround ?? null;
  const hasStory = block.props.heading.length > 0 || block.props.body.length > 0;

  if (state === "empty" || !hasStory) {
    if (!isPreview) return null; // live: an empty section never renders
    return (
      <BlockSection>
        <EmptyPrompt
          prompt="Tell the story behind your craft"
          hint="In your interview we'll ask where it started — your answer becomes this section, in your own words."
        />
      </BlockSection>
    );
  }

  if (state === "loading") {
    return (
      <BlockSection ground={ground}>
        <div aria-busy="true" className="grid gap-[var(--space-6)] md:grid-cols-2 md:items-center">
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <SkeletonLines lines={5} />
          </div>
          {/* media area holds the focal-cropped frame at its real aspect */}
          <Skeleton className="aspect-[4/5] w-full rounded-md" />
        </div>
      </BlockSection>
    );
  }

  // Error = media failed → text renders alone, reflowed to stacked-editorial.
  // Copy is never blocked by media.
  const mediaFailed = state === "error" || !image;
  const variant = mediaFailed ? "stacked-editorial" : block.variant;

  const heading =
    variant === "pull-quote" && block.props.pullQuote ? (
      <blockquote className="max-w-[24ch] font-display text-display [text-wrap:balance]">
        &ldquo;{block.props.pullQuote}&rdquo;
      </blockquote>
    ) : (
      <h2 className="max-w-[24ch] font-display text-h1 [text-wrap:balance]">{block.props.heading}</h2>
    );

  const body = (
    <p className="max-w-[65ch] font-text text-body-lg text-muted">{block.props.body}</p>
  );

  if (variant === "text-left-media-right") {
    return (
      <BlockSection ground={ground}>
        <div className="grid gap-[var(--space-6)] md:grid-cols-2 md:items-center">
          <div className="order-2 space-y-[var(--space-3)] md:order-1">
            <Reveal delayMs={STAGGER_MS}>{heading}</Reveal>
            <Reveal delayMs={STAGGER_MS * 2}>{body}</Reveal>
          </div>
          {/* media leads text (§4.2) */}
          <Reveal as="figure" className="order-1 md:order-2">
            {image ? <SmartImage image={image} /> : null}
          </Reveal>
        </div>
      </BlockSection>
    );
  }

  // stacked-editorial (also the media-error reflow) and pull-quote
  return (
    <BlockSection ground={ground}>
      <div className={cn("space-y-[var(--space-6)]", variant === "pull-quote" && "text-center")}>
        {!mediaFailed && image ? (
          <Reveal as="figure">
            <SmartImage image={image} />
          </Reveal>
        ) : null}
        <Reveal delayMs={STAGGER_MS} className={cn(variant === "pull-quote" && "flex justify-center")}>
          {heading}
        </Reveal>
        {variant !== "pull-quote" ? (
          <Reveal delayMs={STAGGER_MS * 2}>{body}</Reveal>
        ) : null}
      </div>
    </BlockSection>
  );
}
