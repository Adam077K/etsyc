"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { resolveEdgeMs, resolveStateMs } from "@/components/film/edge-table";
import { useFilmSlot } from "@/components/film/useFilmSlot";
import { requestGrownSelection } from "@/lib/grow/actions";
import type { GrownSelection } from "@/lib/grow/types";
import { GrownColumn } from "./GrownColumn";
import { prefersReducedMotion } from "./motion";
import { partFeedCards, type PartHandle } from "./part-feed";
import type { GrowHandoff, GrowSource } from "./types";

/**
 * GrowProvider — B2's orchestration of the FEED → GROWN edge, the
 * cross-tree handoff the Film Layer exists for. Wraps the feed surface
 * (B1b mounts it around FeedMagazine); a tapped card calls
 * `useGrow().grow(source, cardElement)` and the provider:
 *
 *   1. mounts the GrownColumn, which claims the film on the §5.2 `grow`
 *      edge — the layer FLIPs the frame from the card rect to the centre
 *      column and NEVER touches the video buffers (same-source: true
 *      element persistence, cross-fading forbidden);
 *   2. parts the surrounding `[data-feed-card]` elements on Y, transform
 *      only, 70 ms staggered outward from the tapped card;
 *   3. resolves the engine's GROWN preset through the server action
 *      (peers ride the B3 handoff);
 *   4. on Escape runs `ungrow` — chrome leaves first at --dur-state,
 *      then the film FLIPs back at --dur-ungrow (§2.5, exact reverse) and
 *      focus returns to the tapped card;
 *   5. on the second tap calls `onOpenWorld` and DOES NOT unmount — the
 *      parent unmounts the provider's column only after B3's world has
 *      claimed the film, so the frame is never parked mid-beat.
 *
 * Corresponds to WORLD_STAGES "grown" (stages.ts) — the real feed's grow
 * drives the same §5.2 edge the preview rail simulates, so B3 can carry
 * the film straight into `world-open` on `unfold`.
 */

type GrowPhase = "idle" | "grown" | "ungrowing";

type GrowState =
  | { phase: "idle" }
  | { phase: "grown" | "ungrowing"; source: GrowSource; sourceElement: HTMLElement };

export interface GrowApi {
  phase: GrowPhase;
  /** Grow a tapped card. Re-entrant: a tap on another card switches the column. */
  grow: (source: GrowSource, sourceElement: HTMLElement) => void;
  /** GROWN → FEED on the `ungrow` edge; no-op unless currently grown. */
  ungrow: () => void;
}

const GrowContext = createContext<GrowApi | null>(null);

/** Null outside a GrowProvider — feed cards degrade to non-growing media. */
export function useGrow(): GrowApi | null {
  return useContext(GrowContext);
}

export function GrowProvider({
  onOpenWorld,
  children,
}: {
  onOpenWorld: (handoff: GrowHandoff) => void;
  children: ReactNode;
}) {
  // the slot the film returns to on ungrow — registered on the tapped card
  const returnSlot = useFilmSlot();
  const [state, setState] = useState<GrowState>({ phase: "idle" });
  const [selection, setSelection] = useState<GrownSelection | null>(null);

  const stateRef = useRef(state);
  const selectionRef = useRef(selection);
  const sourceElRef = useRef<HTMLElement | null>(null);
  const partRef = useRef<PartHandle | null>(null);
  const timersRef = useRef<number[]>([]);
  const requestTokenRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) window.clearTimeout(timer);
    timersRef.current = [];
  }, []);

  const fetchSelection = useCallback((source: GrowSource) => {
    const token = ++requestTokenRef.current;
    setSelection(null);
    void requestGrownSelection({ storeId: source.storeId, tappedVideoId: source.videoId })
      .then((result) => {
        if (requestTokenRef.current === token) setSelection(result);
      })
      .catch(() => {
        // the action itself never throws by contract; this guards the wire
        if (requestTokenRef.current === token) {
          setSelection({ status: "error", grown: null, peers: [] });
        }
      });
  }, []);

  const returnSlotRef = returnSlot.ref;
  const grow = useCallback(
    (source: GrowSource, sourceElement: HTMLElement) => {
      clearTimers();
      partRef.current?.release();
      partRef.current = null;
      // the ref copy exists for the column's LAYOUT-effect callbacks,
      // which fire before this component's own effects sync stateRef
      sourceElRef.current = sourceElement;
      returnSlotRef(sourceElement);
      setState({ phase: "grown", source, sourceElement });
      fetchSelection(source);
    },
    [clearTimers, fetchSelection, returnSlotRef],
  );

  const returnSlotClaim = returnSlot.claim;
  const ungrow = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "grown") return;
    setState({ ...current, phase: "ungrowing" });
    const reduced = prefersReducedMotion();
    // §2.5 out: affordance and type leave first (opacity only), THEN the
    // film FLIPs back; under reduced motion everything is immediate and
    // the layer snaps internally — the film keeps playing throughout.
    timersRef.current.push(
      window.setTimeout(
        () => {
          returnSlotClaim("ungrow");
          partRef.current?.release();
          partRef.current = null;
          timersRef.current.push(
            window.setTimeout(
              () => {
                setState({ phase: "idle" });
                setSelection(null);
                sourceElRef.current?.focus({ preventScroll: true });
              },
              reduced ? 0 : resolveEdgeMs("ungrow"),
            ),
          );
        },
        // --dur-state via the token reader — type and affordance leave first
        reduced ? 0 : resolveStateMs(),
      ),
    );
  }, [returnSlotClaim]);

  const advance = useCallback(() => {
    const current = stateRef.current;
    if (current.phase !== "grown") return;
    onOpenWorld({ source: current.source, selection: selectionRef.current });
  }, [onOpenWorld]);

  // Escape ungrows — the column is a lean-in, not a modal, and the feed
  // behind stays interactive, so this is the one global key.
  useEffect(() => {
    if (state.phase !== "grown") return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") ungrow();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [state.phase, ungrow]);

  const handleColumnReady = useCallback(
    (rect: { left: number; top: number; width: number; height: number }) => {
      if (prefersReducedMotion()) return; // §5.3 — no parting transforms
      partRef.current?.release();
      // the cleared band extends past the window to keep the affordance
      // line beneath it readable against parted ground, not card media
      partRef.current = partFeedCards({
        columnRect: { ...rect, height: rect.height + 88 },
        sourceElement: sourceElRef.current,
      });
    },
    [],
  );

  const handleRetrySelection = useCallback(() => {
    const current = stateRef.current;
    if (current.phase === "idle") return;
    fetchSelection(current.source);
  }, [fetchSelection]);

  useEffect(
    () => () => {
      clearTimers();
      partRef.current?.release();
      partRef.current = null;
    },
    [clearTimers],
  );

  const api = useMemo<GrowApi>(
    () => ({ phase: state.phase, grow, ungrow }),
    [state.phase, grow, ungrow],
  );

  return (
    <GrowContext.Provider value={api}>
      {children}
      {state.phase !== "idle" ? (
        <GrownColumn
          key={`${state.source.storeId}:${state.source.videoId ?? state.source.poster}`}
          source={state.source}
          leaving={state.phase === "ungrowing"}
          selection={selection}
          sourceElement={state.sourceElement}
          onAdvance={advance}
          onColumnReady={handleColumnReady}
          onRetrySelection={handleRetrySelection}
        />
      ) : null}
    </GrowContext.Provider>
  );
}
