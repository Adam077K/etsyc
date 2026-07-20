"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { groundStyle, imageById, type BlockProps } from "../shared";

const toneMix: Record<"warm" | "cool" | "neutral", string> = {
  warm: "color-mix(in oklab, var(--accent) 10%, var(--ground))",
  cool: "color-mix(in oklab, var(--accent-2) 10%, var(--ground))",
  neutral: "var(--surface)",
};

/**
 * Block 10 · atmosphere — the "world breathes" connective tissue and the
 * only block permitted ambient motion (sub-threshold, static under
 * reduced-motion). `block-ground` variant is the purest Faire color-block.
 * Empty legitimately collapses to a spacing gap — absence is fine here.
 */
export function AtmosphereBlock({ block, data, state = "success" }: BlockProps<"atmosphere">) {
  const image = imageById(data, block.bindings.imageIds[0]);
  const [imageFailed, setImageFailed] = useState(false);
  const ground = block.props.blockGround ?? null;

  // Empty → a pure spacing gap (still valid — it's atmosphere).
  if (state === "empty") {
    return <div aria-hidden="true" className="h-[var(--space-16)]" />;
  }

  const washStyle: CSSProperties = {
    background: `linear-gradient(180deg, var(--ground) 0%, ${toneMix[block.props.toneShift]} 50%, var(--ground) 100%)`,
  };

  // block-ground (P2-a) — a solid full-bleed band in --block-{a|b|c}
  if (block.variant === "block-ground" && ground) {
    return (
      <div
        aria-hidden="true"
        style={groundStyle(ground)}
        className="h-[var(--space-16)] w-full md:h-[var(--space-20)]"
      />
    );
  }

  if (block.variant === "image-band" && image) {
    // loading holds --ground fill (no layout shift); error falls back to color-wash
    const fallback = state === "error" || imageFailed;
    return (
      <div
        aria-hidden="true"
        className="relative h-[var(--space-20)] w-full overflow-hidden md:h-64"
        style={fallback ? washStyle : undefined}
      >
        {!fallback ? (
          // eslint-disable-next-line @next/next/no-img-element -- config-driven remote srcs; next/image domains are a P5 config concern
          <img
            src={image.src}
            alt=""
            onError={() => setImageFailed(true)}
            className={cn(
              "h-full w-full object-cover transition-opacity duration-reveal ease-kol",
              state === "loading" && "opacity-0",
            )}
            style={{ objectPosition: `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%` }}
          />
        ) : null}
      </div>
    );
  }

  if (block.variant === "motion-divider") {
    // sub-threshold ambient drift — opacity only, Aesop-quiet, static under
    // reduced-motion via the global media query
    return (
      <div aria-hidden="true" className="relative h-[var(--space-16)] w-full overflow-hidden" style={washStyle}>
        <div
          className="absolute inset-x-0 top-1/2 h-px bg-line"
          style={{ animation: "kol-skeleton-pulse 6s var(--ease-kol) infinite" }}
        />
      </div>
    );
  }

  // color-wash (default; also the image-band error fallback path when no image)
  return <div aria-hidden="true" className="h-[var(--space-16)] w-full md:h-[var(--space-20)]" style={washStyle} />;
}
