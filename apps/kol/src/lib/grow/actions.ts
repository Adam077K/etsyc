"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { FEED_RING_COOKIE } from "@/lib/feed/select";
import { FEED_SESSION_COOKIE, resolveFeedSessionId } from "@/lib/feed/session";
import { createClient } from "@/lib/supabase/server";
import { getGrownSelection } from "./select";
import type { GrownSelection } from "./types";

/**
 * The grow surface's server boundary (B2). A tap on a feed card calls this
 * to resolve the engine's GROWN preset for the tapped clip's store.
 *
 * Identity is the FEED's identity — one buyer, one session, one ring
 * across the whole journey (DECISIONS.md canonical cookie names): buyer
 * from the Supabase session (null = anonymous, Relationship term 0),
 * session id read via `resolveFeedSessionId` off `kol_sid` — the proxy
 * middleware is the SOLE minter; this action never sets it — and the
 * signed `kol_ring` anti-repetition cookie, which a Server Action (unlike
 * an RSC render) is allowed to persist. B1a's feed read documents exactly
 * this split: "Ring persistence happens where the engine runs inside a
 * Server Action (the B2+ journey states)."
 */

const grownRequestSchema = z.object({
  storeId: z.string().min(1).max(128),
  tappedVideoId: z.string().min(1).max(128).nullable(),
});

export async function requestGrownSelection(input: {
  storeId: string;
  tappedVideoId: string | null;
}): Promise<GrownSelection> {
  const parsed = grownRequestSchema.safeParse(input);
  if (!parsed.success) return { status: "error", grown: null, peers: [] };

  const jar = await cookies();
  const sessionId = resolveFeedSessionId(jar.get(FEED_SESSION_COOKIE)?.value);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return getGrownSelection({
    storeId: parsed.data.storeId,
    tappedVideoId: parsed.data.tappedVideoId,
    buyerId: user?.id ?? null,
    sessionId,
    cookies: {
      read: () => jar.get(FEED_RING_COOKIE)?.value,
      write: (value) =>
        // same attributes as the feed's ring write (lib/feed/select.ts)
        jar.set(FEED_RING_COOKIE, value, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
        }),
    },
  });
}
