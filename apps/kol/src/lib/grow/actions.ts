"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  ENGINE_RING_COOKIE,
  getGrownSelection,
  GROW_SESSION_COOKIE,
} from "./select";
import type { GrownSelection } from "./types";

/**
 * The grow surface's server boundary (B2). A tap on a feed card calls this
 * to resolve the engine's GROWN preset for the tapped clip's store. It
 * derives identity server-side — buyer from the Supabase session (null =
 * anonymous, Relationship term 0), session id from a first-party cookie
 * generated on first use — and owns the engine's signed ring cookie
 * writes, which a Server Action (unlike an RSC render) is allowed to make.
 */

const grownRequestSchema = z.object({
  storeId: z.string().min(1).max(128),
  tappedVideoId: z.string().min(1).max(128).nullable(),
});

const YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function requestGrownSelection(input: {
  storeId: string;
  tappedVideoId: string | null;
}): Promise<GrownSelection> {
  const parsed = grownRequestSchema.safeParse(input);
  if (!parsed.success) return { status: "error", grown: null, peers: [] };

  const jar = await cookies();

  // engine session identity — first-party, works signed-out, never Math.random
  let sessionId = jar.get(GROW_SESSION_COOKIE)?.value ?? "";
  if (sessionId.length === 0 || sessionId.length > 64) {
    sessionId = crypto.randomUUID();
    jar.set(GROW_SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: YEAR_SECONDS,
    });
  }

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
      read: () => jar.get(ENGINE_RING_COOKIE)?.value,
      write: (value) =>
        jar.set(ENGINE_RING_COOKIE, value, {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          maxAge: YEAR_SECONDS,
        }),
    },
  });
}
