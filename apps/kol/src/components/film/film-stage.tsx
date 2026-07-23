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
  // Crop the top of the (uniformly-scaled, undistorted) film so the corner dock
  // reads as a landscape card instead of a viewport-aspect column on portrait
  // phones. `round` keeps all four corners on the radius. Zero on hero/desktop.
  const clipTop = useTransform(m.clip, (v) => v * 100);
  const clipPath = useMotionTemplate`inset(${clipTop}% 0px 0px 0px round ${m.radius}px)`;

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
              Hidden on the tiny PiP, where the route renders a legible label. */}
          {intent.stageChip !== false && (
          <div className="absolute left-4 top-20 sm:left-8">
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
          </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
