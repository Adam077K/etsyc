import type { Clip } from "@/lib/store-config/types";

/**
 * clips[].focalPoint is OPTIONAL in the v1.3 contract (deliberately unlike
 * the required images[].focalPoint) — so the centre default lives HERE, in
 * the renderer, never injected at parse time (schema doc §2.3): stored
 * configs round-trip unchanged.
 */
export const DEFAULT_CLIP_FOCAL_POINT = { x: 0.5, y: 0.5 } as const;

/**
 * object-position anchor for cross-aspect clip crops (4:5 feed card ·
 * 16:9 centre column · full-bleed world hero · 320 px dock) — keeps the
 * maker's face in frame wherever the clip is composed.
 */
export function clipObjectPosition(clip: Pick<Clip, "focalPoint">): string {
  const { x, y } = clip.focalPoint ?? DEFAULT_CLIP_FOCAL_POINT;
  return `${x * 100}% ${y * 100}%`;
}
