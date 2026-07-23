"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * The signature liquid/gooey moment (Cuberto beat). An SVG goo filter fuses
 * overlapping blobs into one molten ink form; the blobs drift on transform-only
 * animation. Bounded and reduced-motion-safe (freezes to a static fused shape).
 */

export function GooDefs() {
  return (
    <svg aria-hidden className="absolute h-0 w-0">
      <defs>
        <filter id="kol-goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9"
            result="goo"
          />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </defs>
    </svg>
  );
}

/** A molten ink divider — a row of fusing marigold/clay blobs on an ink band. */
export function LiquidDivider({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();
  const blobs = [
    { id: "clay-l", cx: 22, r: 30, fill: "#7C2D12", dur: 9, cyKeys: [20, 12, 24, 20] },
    // Orange blobs run the inverted cy phase so the seam pinches/billows from
    // frame one instead of waiting for duration drift (design-critic polish).
    { id: "gold-l", cx: 40, r: 38, fill: "#F1641E", dur: 11, cyKeys: [20, 27, 14, 20] },
    { id: "clay-r", cx: 58, r: 30, fill: "#7C2D12", dur: 8, cyKeys: [20, 12, 24, 20] },
    { id: "gold-r", cx: 76, r: 40, fill: "#F1641E", dur: 12, cyKeys: [20, 27, 14, 20] },
  ];
  return (
    <div className={className} aria-hidden>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="h-16 w-full sm:h-24"
      >
        <g style={{ filter: "url(#kol-goo)" }} className="opacity-[0.78] sm:opacity-[0.62]">
          {blobs.map((b) => (
            <motion.circle
              key={b.id}
              cx={b.cx}
              cy={20}
              r={b.r / 1.8}
              fill={b.fill}
              initial={false}
              animate={
                reduce
                  ? { cy: 20 }
                  : { cy: b.cyKeys, cx: [b.cx, b.cx + 4, b.cx - 3, b.cx] }
              }
              transition={{
                duration: b.dur,
                repeat: reduce ? 0 : Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
