/**
 * Stage 3 — anti-repetition over the session key ring (video-engine §3.1, ADR-0003).
 *
 * Pure: no I/O, no clock, no randomness. Drops candidates whose resolved key is
 * already in the ring, dedupes WITHIN the batch (no two clips in one selection
 * share a key), truncates to `limit`, and returns the updated ring — the caller
 * writes it back.
 *
 * Ring convention (P6b-internal — P6a never touches the ring): index 0 is the
 * NEWEST key. The selected batch's keys are prepended and the result is bounded
 * to KEY_RING_MAX, so eviction is newest-wins: the oldest (deepest) keys fall
 * off the end.
 */

import {
  KEY_RING_MAX,
  resolveAntiRepetitionKey,
  type Candidate,
  type KeyRing,
  type SelectedClip,
} from "./types";

export function antiRepetition(
  candidates: Candidate[],
  ring: KeyRing,
  limit: number,
): { clips: SelectedClip[]; ring: KeyRing } {
  // Seeding the set with the ring makes "already seen this session" and
  // "already selected in this batch" the same check.
  const seen = new Set<string>(ring);
  const clips: SelectedClip[] = [];
  const selectedKeys: string[] = [];

  for (const candidate of candidates) {
    if (clips.length >= limit) break; // truncate to ctx.limit
    const key = resolveAntiRepetitionKey(candidate);
    if (seen.has(key)) continue; // in the ring OR earlier in this batch
    seen.add(key);
    selectedKeys.push(key);
    clips.push({
      videoId: candidate.videoId,
      storeId: candidate.storeId,
      ownerId: candidate.ownerId,
      src: candidate.video.src,
      poster: candidate.video.poster,
      durationMs: candidate.video.duration_ms,
      captionsSrc: candidate.video.captions_src,
      antiRepetitionKey: key,
    });
  }

  // Newest-wins: new keys in front, oldest evicted past KEY_RING_MAX.
  // Empty candidates / limit 0 degrade gracefully — the ring passes through
  // (re-bounded defensively) and the engine never throws.
  const nextRing: KeyRing = [...selectedKeys, ...ring].slice(0, KEY_RING_MAX);
  return { clips, ring: nextRing };
}
