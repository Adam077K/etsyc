/**
 * Film — the shared stand-in for real maker footage (D12 footage is
 * Phase 7). Gradient classes v1–v5 match the approved page mockups
 * one-to-one, so every surface reads as film-led without binaries.
 * Scrim + on-media type follow design-system §1.1 over-media rules.
 */

import type { ReactNode } from "react";

export type FilmVariant = "v1" | "v2" | "v3" | "v4" | "v5";
export type FilmAspect = "tall" | "wide" | "square" | "portrait";

const GRADIENTS: Record<FilmVariant, string> = {
  v1: "linear-gradient(140deg,#8a6a4f,#3f3327 60%,#241d16)", // sena · stoneware
  v2: "linear-gradient(140deg,#6d7a4a,#2f3a24 60%,#1a2016)", // elias · bookbinding
  v3: "linear-gradient(140deg,#4c93a8,#26414c 60%,#16242a)", // tomas · woodwork
  v4: "linear-gradient(140deg,#b8452a,#5c2317 60%,#2a1410)", // mira · copper
  v5: "linear-gradient(140deg,#7a2e4a,#3d1726 60%,#1e0c13)", // noor · indigo
};

const ASPECTS: Record<FilmAspect, string> = {
  tall: "aspect-[4/5]",
  wide: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

export function Film({
  variant = "v1",
  aspect = "wide",
  craft,
  title,
  play = true,
  rounded = true,
  className = "",
  children,
}: {
  variant?: FilmVariant;
  aspect?: FilmAspect;
  craft?: string;
  title?: string;
  play?: boolean;
  rounded?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`relative flex items-end overflow-hidden shadow-card ${ASPECTS[aspect]} ${
        rounded ? "rounded-md" : ""
      } ${className}`}
      style={{ background: GRADIENTS[variant] }}
    >
      {/* scrim — bottom-up, per §1.1 over-media type rule */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, color-mix(in oklab, black 55%, transparent) 0%, transparent 55%)",
        }}
      />
      {play ? (
        <div className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-pill bg-on-media/90 text-ink shadow-raised">
            ▶
          </span>
        </div>
      ) : null}
      {(craft || title || children) && (
        <div className="relative z-[1] w-full p-4 text-on-media">
          {craft ? <p className="text-caption uppercase opacity-85">{craft}</p> : null}
          {title ? <p className="font-display text-h3 font-bold">{title}</p> : null}
          {children}
        </div>
      )}
    </div>
  );
}
