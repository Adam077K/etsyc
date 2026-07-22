import { z } from "zod";

import { IMAGE_ASPECTS } from "@/lib/store-config/schema";

/**
 * Media upload contract (spec S8, STEP 3). Files go to the `store-media`
 * Supabase Storage bucket under the owning store's prefix; rows land in
 * `media`, owner-scoped by RLS (`media_owner_all`, with the P1-5 cross-store
 * WITH CHECK guard). The bucket itself is Supabase-side configuration — this
 * module is built against its name and degrades to a quiet inline error +
 * retry while it is absent.
 */

export const STORE_MEDIA_BUCKET = "store-media";

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "avif"] as const;
export const MODEL_EXTENSIONS = ["glb", "gltf"] as const;

/** Client-side guards — humane limits, not the trust boundary. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_MODEL_BYTES = 50 * 1024 * 1024;

export type MediaAspect = (typeof IMAGE_ASPECTS)[number];

export function fileExtension(name: string): string | null {
  const ext = /\.([a-z0-9]+)$/i.exec(name)?.[1];
  return ext ? ext.toLowerCase() : null;
}

/**
 * Storage object key: `{storeId}/{kind}/{uuid}.{ext}`. The store prefix is
 * what `createMediaRecord` verifies server-side, so a forged path can never
 * claim another store's folder. Returns null for an extension outside the
 * allow-list — the caller shows a field error, nothing uploads.
 */
export function storagePathFor(
  storeId: string,
  kind: "image" | "model3d",
  fileName: string,
): string | null {
  const ext = fileExtension(fileName);
  if (!ext) return null;
  const allowed: readonly string[] =
    kind === "image" ? IMAGE_EXTENSIONS : MODEL_EXTENSIONS;
  if (!allowed.includes(ext)) return null;
  return `${storeId}/${kind}/${crypto.randomUUID()}.${ext}`;
}

const ASPECT_RATIOS: Record<MediaAspect, number> = {
  "1:1": 1,
  "4:5": 4 / 5,
  "3:2": 3 / 2,
  "16:9": 16 / 9,
};

/**
 * Nearest catalog aspect for a pixel size — media.aspect is one of the four
 * store-config values, so uploads snap to whichever the image is closest to
 * (log-ratio distance treats 2× too-wide and 2× too-tall the same).
 */
export function nearestAspect(width: number, height: number): MediaAspect {
  if (width <= 0 || height <= 0) return "1:1";
  const ratio = width / height;
  let best: MediaAspect = "1:1";
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const aspect of IMAGE_ASPECTS) {
    const distance = Math.abs(Math.log(ratio / ASPECT_RATIOS[aspect]));
    if (distance < bestDistance) {
      bestDistance = distance;
      best = aspect;
    }
  }
  return best;
}

/** 0–1 art-direction anchor, same shape as store-config focalPoint. */
export const focalPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const uuidSegment = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const imagePathPattern = new RegExp(
  `^${uuidSegment}/image/${uuidSegment}\\.(${IMAGE_EXTENSIONS.join("|")})$`,
);
const modelPathPattern = new RegExp(
  `^${uuidSegment}/model3d/${uuidSegment}\\.(${MODEL_EXTENSIONS.join("|")})$`,
);

const mimeSchema = z
  .string()
  .trim()
  .max(100)
  .transform((v) => (v === "" ? null : v));

/**
 * The `media` row contract. alt is REQUIRED and never empty for images
 * (store-config §2.3 — a11y is a hard gate); models carry no alt because
 * the 3D viewer's gallery fallback owns their description.
 */
export const mediaRecordSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("image"),
    path: z.string().regex(imagePathPattern, { error: "not an image upload path" }),
    alt: z
      .string()
      .trim()
      .min(1, { error: "Every image needs alt text — say what a buyer would see." })
      .max(300, { error: "Keep alt text under 300 characters." }),
    aspect: z.enum(IMAGE_ASPECTS),
    focalPoint: focalPointSchema,
    mime: mimeSchema,
  }),
  z.object({
    kind: z.literal("model3d"),
    path: z.string().regex(modelPathPattern, { error: "not a 3D upload path" }),
    mime: mimeSchema,
  }),
]);

export type MediaRecordInput = z.input<typeof mediaRecordSchema>;
