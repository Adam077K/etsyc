"use client";

import { useState } from "react";
import { BadgeCheck, ChevronDown, Sparkles } from "lucide-react";
import { TapToHear } from "@/components/media/TapToHear";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/states/Skeleton";
import { cn } from "@/lib/utils";
import { BlockSection, clipById, type BlockProps } from "../shared";

/**
 * Block 8 · trust-badge — the two honest trust layers (D7): Real-Maker
 * (voice-anchored) + AI-Transparency (honest disclosure, verbatim). Empty is
 * n/a — trust always resolves to SOME honest state; when verification can't
 * be reached we show `pending`, never a false "verified".
 */
export function TrustBadgeBlock({ block, data, state = "success" }: BlockProps<"trust-badge">) {
  const [expanded, setExpanded] = useState(false);
  const { realMaker, aiTransparency } = data.maker.trust;
  const anchorClip = clipById(data, realMaker.voiceAnchorClipId);

  if (state === "loading") {
    return (
      <BlockSection>
        <div aria-busy="true" className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-44 rounded-pill" />
          <Skeleton className="h-8 w-36 rounded-pill" />
          {/* disclosure text area reserved */}
          <Skeleton className="mt-2 h-4 w-full max-w-md basis-full" />
        </div>
      </BlockSection>
    );
  }

  // Error: verification service unreachable → honest `pending`, never a claim.
  const status = state === "error" ? "pending" : realMaker.status;

  const realMakerChip =
    status === "verified" && anchorClip ? (
      <Badge variant="ink" className="min-h-8">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        Real maker · verified
      </Badge>
    ) : (
      <Badge className="min-h-8">
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
        {status === "unverified" ? "Not yet verified" : "Verification in progress"}
      </Badge>
    );

  const aiChip = (
    <Badge className="min-h-8">
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      {{ "maker-authored": "Maker-authored", "ai-assisted": "AI-assisted", "ai-drafted": "AI-drafted" }[aiTransparency.level]}
    </Badge>
  );

  if (block.variant === "inline-compact" || state === "empty") {
    return (
      <BlockSection>
        <div className="flex flex-wrap gap-2">
          {realMakerChip}
          {aiChip}
        </div>
      </BlockSection>
    );
  }

  // expandable-detail
  return (
    <BlockSection>
      <div className="rounded-lg border border-line bg-surface">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex min-h-11 w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition-colors duration-state ease-kol hover:bg-ground/50"
        >
          <span className="flex flex-wrap gap-2">
            {realMakerChip}
            {aiChip}
          </span>
          <ChevronDown
            aria-hidden="true"
            className={cn("h-4 w-4 text-muted transition-transform duration-state ease-kol", expanded && "rotate-180")}
          />
        </button>
        <div
          className={cn(
            "grid transition-[grid-template-rows,opacity] duration-enter ease-kol",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="space-y-[var(--space-3)] border-t border-line px-4 py-4">
              {/* the maker's disclosure — VERBATIM, plus exactly where AI helped */}
              <p className="max-w-measure text-body text-muted">{aiTransparency.disclosure}</p>
              {aiTransparency.aiAssistedFields.length > 0 ? (
                <p className="text-caption uppercase tracking-[0.04em] text-muted">
                  AI helped with: {aiTransparency.aiAssistedFields.join(" · ")}
                </p>
              ) : null}
              {status === "verified" && anchorClip ? (
                // the voice anchor plays the audio of the maker's own intro clip
                <TapToHear
                  src={anchorClip.src}
                  label={`Hear ${data.maker.displayName.split(" ")[0]} — the voice behind the badge`}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </BlockSection>
  );
}
