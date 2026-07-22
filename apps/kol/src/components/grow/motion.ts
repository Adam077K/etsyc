/**
 * Reduced-motion gate for the grow choreography (§5.3): transforms and
 * parting are removed entirely — never run at 0.01 ms — while the film
 * keeps playing and every state remains reachable. The Film Layer applies
 * the same policy internally for its FLIP; this covers B2's own moves
 * (parting, image FLIP, staged delays).
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
