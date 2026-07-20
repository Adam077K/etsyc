"use client";

import { useState } from "react";
import type { StoreImage } from "@/lib/store-config/types";
import { cn } from "@/lib/utils";

const aspectClass: Record<StoreImage["aspect"], string> = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]",
  "3:2": "aspect-[3/2]",
  "16:9": "aspect-video",
};

/**
 * Art-directed still: focal-point cropping via object-position, aspect
 * reserved up front (no layout shift), graceful per-image error state — the
 * alt text stays visible on a surface fill (catalog: product-detail error).
 */
export function SmartImage({
  image,
  className,
  rounded = true,
}: {
  image: StoreImage;
  className?: string;
  rounded?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <figure
      className={cn(
        "relative w-full overflow-hidden bg-surface",
        aspectClass[image.aspect],
        rounded && "rounded-md",
        className,
      )}
    >
      {failed ? (
        <figcaption className="flex h-full w-full items-end p-4">
          <span className="border-l-2 border-line pl-3 text-caption uppercase tracking-[0.04em] text-muted">
            {image.alt}
          </span>
        </figcaption>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote CDN srcs in config; next/image domains are a P5 config concern
        <img
          src={image.src}
          alt={image.alt}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          style={{
            objectPosition: `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%`,
          }}
        />
      )}
    </figure>
  );
}
