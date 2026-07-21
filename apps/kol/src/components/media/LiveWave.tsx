"use client";

/**
 * LiveWave — bars driven by REAL input level (see useMediaRecorder's
 * AnalyserNode). When `levels` is all zeros the bars sit flat, which is the
 * honest reading for "mic open, nothing said" — this is deliberately not an
 * animation. `StaticWave` is the non-live decorative variant used on
 * buttons and previews where no capture is happening.
 */

export function LiveWave({
  levels,
  tone = "accent",
  height = 32,
}: {
  levels: readonly number[];
  tone?: "accent" | "muted";
  height?: number;
}) {
  return (
    <span aria-hidden className="flex items-end gap-0.5" style={{ height: `${height}px` }}>
      {levels.map((level, i) => (
        <span
          key={i}
          style={{ height: `${Math.max(2, level * height)}px` }}
          className={`w-0.5 rounded-pill transition-[height] duration-75 ease-linear ${
            tone === "accent" ? "bg-accent" : "bg-ink/40"
          }`}
        />
      ))}
    </span>
  );
}

export function StaticWave({
  heights,
  tone = "muted",
}: {
  heights: readonly number[];
  tone?: "accent" | "muted";
}) {
  return (
    <span aria-hidden className="flex items-end gap-0.5">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}px` }}
          className={`w-0.5 rounded-pill ${
            tone === "accent" ? (i % 2 === 0 ? "bg-accent" : "bg-accent/50") : "bg-ink/40"
          }`}
        />
      ))}
    </span>
  );
}
