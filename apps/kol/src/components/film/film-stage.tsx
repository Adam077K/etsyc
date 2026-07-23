"use client";

import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useReducedMotion,
  useTransform,
} from "framer-motion";
import { Play } from "@phosphor-icons/react";
import { MakerFilm } from "../maker-film";
import { cn } from "@/lib/utils";
import { useFilm } from "./film-context";

/**
 * FilmStage — the ONE persistent film element for the buyer journey. Mounted
 * once in the app shell, it renders the active maker's film at a fixed position
 * and follows the shared MotionValues that each route drives. It is never
 * unmounted across `/m/[slug] → …/p/[product] → /checkout → /thank-you`, so the
 * <video> node (and its currentTime) is literally continuous — no black frame
 * at any route boundary.
 *
 * The stage is media only: gradient scrim, radius, shadow, and a single legible
 * "now playing" chip. Route-specific chrome (labels, controls, receipts) is
 * rendered by each route, positioned to meet the film. When a route grants an
 * `interaction`, the stage frame becomes a keyboard-operable control.
 */
export function FilmStage() {
  const { intent, m, videoRef, interaction } = useFilm();
  const reduce = useReducedMotion();

  const boxShadow = useTransform(
    m.shadow,
    [0, 1],
    ["0 0 0 rgba(0,0,0,0)", "0 30px 60px -20px rgba(0,0,0,0.8)"],
  );
  const transformOrigin = useMotionTemplate`${m.originX}% ${m.originY}%`;
  // Crop the BOTTOM of the (uniformly-scaled, undistorted) film so the corner
  // dock reads as a landscape card instead of a viewport-aspect column on
  // portrait phones. Bottom crop (not top) because the dock anchors TOP-LEFT —
  // keeping the top strip makes the card sit flush at the top-left inset with no
  // empty gap above it. `round` keeps all four corners on the radius. CRITICAL:
  // clip-path is "none" whenever clip===0, because even inset(0%) clips the
  // element's box-shadow at the border box — so the hero/desktop dock keeps its
  // shadow untouched, and only the cropped mobile card is clipped.
  const clipPath = useTransform([m.clip, m.radius], ([clip, radius]: number[]) =>
    (clip ?? 0) <= 0.0001
      ? "none"
      : `inset(0px 0px ${(clip ?? 0) * 100}% 0px round ${radius ?? 0}px)`,
  );
  // While clipped, the box-shadow is severed by the clip, so restore depth with a
  // contract-allowed drop-shadow (follows the cropped card shape). "none" at
  // clip===0 so the hero keeps its real box-shadow and descendant backdrop-blur
  // (the chip) is never disabled by a filter context.
  const dockShadow = useTransform(m.clip, (clip) =>
    clip <= 0.0001 ? "none" : "drop-shadow(0 12px 22px rgba(0,0,0,0.72))",
  );
  // The stage chip is anchored top-left for the full-bleed hero; fade it out as
  // the film docks so the landscape top-crop never severs it mid-word.
  const chipOpacity = useTransform(m.clip, [0, 0.12], [1, 0]);

  if (!intent) return null;

  const interactive = Boolean(interaction);
  const chipText =
    intent.chip === "personal"
      ? "Personal thank-you"
      : intent.chip === "now-playing"
        ? "Now playing"
        : "On film";

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <motion.div style={{ opacity: m.opacity }} className="absolute inset-0">
        <motion.div
          data-film-node="stage"
          data-film-maker={intent.makerId}
          style={{
            scale: m.scale,
            x: m.x,
            y: m.y,
            borderRadius: m.radius,
            boxShadow,
            transformOrigin,
            clipPath,
            filter: dockShadow,
          }}
          onClick={interaction?.onActivate}
          onKeyDown={
            interaction
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    interaction.onActivate();
                  }
                }
              : undefined
          }
          role={interactive ? "button" : undefined}
          tabIndex={interactive ? 0 : -1}
          aria-label={interactive ? interaction!.label : undefined}
          aria-hidden={interactive ? undefined : true}
          className={cn(
            "absolute inset-0 overflow-hidden",
            interactive &&
              "pointer-events-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marigold focus-visible:ring-offset-2 focus-visible:ring-offset-ink",
          )}
        >
          <MakerFilm
            videoSrc={intent.videoSrc}
            poster={intent.poster}
            alt={intent.alt}
            reduce={!!reduce}
            priority
            sizes="100vw"
            className="object-cover"
            videoRef={videoRef}
            initialTime={intent.seedTime}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />

          {/* Contextual chip — crossfades when the clip label swaps (step 5).
              Hidden on the tiny PiP, where the route renders a legible label.
              Anchored top-left for the full-bleed hero; it fades out as the film
              docks (clip>0) so the landscape top-crop never clips it. */}
          {intent.stageChip !== false && (
          <motion.div
            style={{ opacity: chipOpacity }}
            className="absolute left-4 top-20 sm:left-8"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={intent.clipLabel ?? chipText}
                initial={reduce ? false : { opacity: 0, y: -6 }}
                animate={reduce ? undefined : { opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: 6 }}
                transition={{ duration: 0.35 }}
                className="flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 backdrop-blur-sm"
              >
                <Play size={13} weight="fill" className="text-marigold" />
                <span className="meta text-bone">
                  {intent.clipLabel ?? chipText}
                </span>
              </motion.div>
            </AnimatePresence>
          </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
