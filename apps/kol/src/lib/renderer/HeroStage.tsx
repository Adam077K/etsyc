"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { HeroPersistenceContext } from "./hero-persistence";
import type { WorldStage } from "./stages";

/**
 * HeroStage — the persistent hero slot, the ONE shared element
 * (`layoutId="hero-video"`, spec P4) the world unfolds around. The wrapper
 * keeps an identical tree position across every stage, so React never
 * remounts the <video> inside; stages only change classes and transforms
 * (transform/opacity only — never layout). NARRATE_SHRINK docks the film to
 * a corner via a FLIP transform on --ease-cinematic; the shell pins its
 * in-flow height first so the world never shifts. The `view-transition-name`
 * lives on `.kol-hero-stage` in globals.css, ready for the cross-route
 * shared-element morph when the feed (B1) arrives.
 *
 * The dock class is managed imperatively (not via className) because FLIP
 * must measure the un-docked rect BEFORE the class flips — a render-driven
 * class would already be committed by effect time. `className` on the inner
 * div is intentionally a stable string so React never rewrites the attribute.
 */
export function HeroStage({ stage, children }: { stage: WorldStage; children: ReactNode }) {
  const shellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const wasDockedRef = useRef(false);

  const docked = stage === "narrate-shrink";

  useLayoutEffect(() => {
    const shell = shellRef.current;
    const inner = innerRef.current;
    if (!shell || !inner) return;
    const wasDocked = wasDockedRef.current;
    if (docked === wasDocked) return;
    wasDockedRef.current = docked;

    const first = inner.getBoundingClientRect();
    if (docked) {
      // Pin the shell's flow height so the page doesn't reflow when the
      // film goes position:fixed.
      shell.style.height = `${first.height}px`;
      inner.classList.add("kol-hero-docked");
    } else {
      inner.classList.remove("kol-hero-docked");
      shell.style.height = "";
    }
    const last = inner.getBoundingClientRect();

    // FLIP release — invert to where the film just was, flush, then let the
    // .kol-hero-stage-inner transform transition carry it (transform-only;
    // reduced-motion collapses it to instant via the global media query).
    // Zero-size rects (jsdom, display:none ancestors) skip the play safely.
    if (first.width > 0 && last.width > 0) {
      const dx = first.left - last.left;
      const dy = first.top - last.top;
      const scale = first.width / last.width;
      inner.style.transition = "none";
      inner.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
      void inner.getBoundingClientRect();
      inner.style.transition = "";
      inner.style.transform = "";
    }
  }, [docked]);

  return (
    <div ref={shellRef} data-layout-id="hero-video" className="kol-hero-stage">
      <div ref={innerRef} className="kol-hero-stage-inner">
        <HeroPersistenceContext.Provider value={true}>{children}</HeroPersistenceContext.Provider>
      </div>
    </div>
  );
}
