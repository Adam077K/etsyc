// SERVER-ONLY MODULE — the composition root constructs the service-role
// ranker and reads ENGINE_COOKIE_SECRET. Nothing here may reach a client
// bundle; the browser talks to the engine through a server boundary only.
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";
import { createAnonClient } from "@/lib/supabase/anon";
import type { Database } from "@/lib/supabase/database.types";

import { createCookieKeyRing } from "./cookie-ring";
import { createEligible } from "./eligible";
import { createRulesRanker } from "./rank";
import type { EngineDeps } from "./types";

/**
 * The engine's composition root (W2-WIRE, ADR-0003 / video-engine §1).
 *
 * Composes stage 1 (eligibility, ANON client), stage 2 (rules ranker,
 * service-role client for `buyer_signals` ONLY — video-engine §5.4) and
 * stage 3 (signed-cookie anti-repetition ring) into the one `EngineDeps`
 * that `selectVideos` consumes. One import site for callers: deps factories,
 * `selectVideos`, and the public types all live here.
 */

export { selectVideos } from "./select-videos";
export type {
  BuyerState,
  Candidate,
  EngineContext,
  EngineDeps,
  KeyRing,
  KeyRingStore,
  Mood,
  PageEligibility,
  Purpose,
  Ranker,
  ScoreFeatures,
  ScoreTrace,
  ScoringWeights,
  SelectedClip,
  Selection,
  VideoProfileRow,
  VideoRow,
} from "./types";

/**
 * Thrown by createEngineDeps when ENGINE_COOKIE_SECRET is not provisioned.
 * There is deliberately NO default and NO insecure fallback: an unsigned or
 * predictable ring cookie is client-controlled input to selection.
 */
export class EngineSecretMissingError extends Error {
  constructor() {
    super(
      "[engine] Missing environment variable ENGINE_COOKIE_SECRET. " +
        "Generate 32+ random bytes (`openssl rand -base64 48`) and set it in " +
        "apps/kol/.env.local (Vercel: project env). The anti-repetition ring " +
        "cannot run without it and there is no insecure fallback.",
    );
    this.name = "EngineSecretMissingError";
  }
}

/**
 * ENGINE_COOKIE_SECRET floor — what the missing-secret error message already
 * instructs (`openssl rand -base64 48`). Below 32 bytes the HMAC key is weak
 * enough that the signed ring cookie degrades toward client-controlled input.
 */
const MIN_SECRET_BYTES = 32;

/**
 * Thrown by createEngineDeps when ENGINE_COOKIE_SECRET is present but shorter
 * than MIN_SECRET_BYTES. A 1-character secret must not pass the guard that
 * exists to keep the ring cookie unforgeable.
 */
export class EngineSecretTooShortError extends Error {
  constructor(byteLength: number) {
    super(
      `[engine] ENGINE_COOKIE_SECRET is ${byteLength} bytes — at least ` +
        `${MIN_SECRET_BYTES} random bytes are required ` +
        "(`openssl rand -base64 48`). A short secret makes the signed " +
        "anti-repetition ring cookie forgeable client input.",
    );
    this.name = "EngineSecretTooShortError";
  }
}

/**
 * Compose the three engine stages from explicit dependencies.
 *
 * LOCKED SIGNATURE (QA-Lead condition, dispatch packet §5): this is the
 * testable seam — the real-composition suite substitutes ONLY the Supabase
 * clients at this boundary. Do not change the shape.
 *
 * `db` MUST be the anon client (createAnonClient). Passing the cookie-bound
 * user client leaks a signed-in seller's own unpublished clips into the
 * public feed: their drafts satisfy the owner RLS policies, enter the FEED
 * pool, and newestPerStore() then guarantees them a slot.
 *
 * `serviceDb` is the ranker's `buyer_signals` read path ONLY (RLS-private,
 * video-engine §5.4) — it must never serve eligibility reads.
 *
 * Application code must NOT call this directly — call createEngineDeps,
 * which constructs the correct clients internally and cannot be miswired.
 */
export function createDefaultDeps(opts: {
  db: SupabaseClient<Database>; // ANON client — public read only
  serviceDb: SupabaseClient<Database>; // service role — buyer_signals ONLY
  secret: string; // ENGINE_COOKIE_SECRET
  cookies: { read: () => string | undefined; write: (value: string) => void };
}): EngineDeps {
  return {
    eligible: createEligible(opts.db),
    ranker: createRulesRanker({ serviceDb: opts.serviceDb }),
    ring: createCookieKeyRing({
      secret: opts.secret,
      read: opts.cookies.read,
      write: opts.cookies.write,
    }),
  };
}

/**
 * The ONLY entry point application code is permitted to call.
 *
 * Constructs the anon client (public read) and the service-role client
 * (buyer_signals only) internally, so a caller CANNOT wire the wrong client
 * into eligibility — the unpublished-clip defect path is structurally
 * closed, not merely documented. Reads ENGINE_COOKIE_SECRET at call time
 * (never at module scope — the app must build unconfigured) and throws
 * EngineSecretMissingError when it is absent.
 */
export function createEngineDeps(cookies: {
  read: () => string | undefined;
  write: (value: string) => void;
}): EngineDeps {
  const secret = process.env.ENGINE_COOKIE_SECRET;
  if (secret === undefined || secret.length === 0) {
    throw new EngineSecretMissingError();
  }
  // Byte length, not UTF-16 code units — the floor is an entropy budget.
  const secretBytes = new TextEncoder().encode(secret).byteLength;
  if (secretBytes < MIN_SECRET_BYTES) {
    throw new EngineSecretTooShortError(secretBytes);
  }
  return createDefaultDeps({
    db: createAnonClient(),
    serviceDb: createAdminClient(),
    secret,
    cookies,
  });
}
