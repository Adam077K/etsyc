"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Reveal — the one entrance choreography (design-system §4.2).
 * Scroll-triggered ONCE per element: opacity 0→1 + translateY(16px→0) on
 * --ease-kol over --dur-reveal, fired ~15% into viewport. Stagger is driven
 * by `delayMs` (parents pass index * 70). Media-leads-text = give media
 * delay 0 and let copy follow. transform/opacity only; reduced-motion
 * becomes an instant fade via the .kol-reveal media query in globals.css.
 *
 * Motion is a DIAL, not the signature beat — the world-unfold / liquid /
 * depth-3d signatures are Phase 6 and intentionally absent here.
 */
export function Reveal({
  as: Tag = "div",
  delayMs = 0,
  className,
  children,
}: {
  as?: "div" | "section" | "figure" | "header" | "footer" | "li";
  delayMs?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      // ancient-browser fallback: reveal on the next frame (async — no
      // cascading render inside the effect body)
      const raf = requestAnimationFrame(() => setRevealed(true));
      return () => cancelAnimationFrame(raf);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true); // once per element — never re-hides
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={(el: HTMLElement | null) => {
        ref.current = el;
      }}
      className={cn("kol-reveal", revealed && "is-revealed", className)}
      style={{ "--reveal-delay": `${delayMs}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}

/** The §4.2 stagger step (70ms) as a helper so blocks never hardcode it. */
export const STAGGER_MS = 70;
