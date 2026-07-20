"use client";

import { useState } from "react";

/**
 * Decorative poster/still that hides itself via state when the asset 404s —
 * never `element.remove()` on a React-managed node (reconciliation would
 * throw NotFoundError later). The ground-tinted parent fill is the designed
 * fallback underneath.
 */
export function PosterStill({ src, className }: { src: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- config-driven remote srcs; next/image domains are a P5 config concern
    <img
      src={src}
      alt=""
      aria-hidden="true"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
