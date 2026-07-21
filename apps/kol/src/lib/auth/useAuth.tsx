"use client";

/**
 * `useAuth()` — the client half of P1 identity.
 *
 * One module-level store, one Supabase subscription, shared by every
 * component that calls the hook (the same `useSyncExternalStore` shape the
 * prototype session store already uses, so hydration behaves identically).
 *
 * When Supabase is absent the store never leaves ANONYMOUS and no network
 * call is ever made — prototype mode is genuinely inert, not "failing
 * quietly in the background".
 *
 * The server render is ALWAYS anonymous (there is no cookie access here),
 * so `status` starts at `"loading"` and settles after hydration. Render
 * signed-out chrome for `"loading"`; never flash a signed-in state you
 * have not confirmed.
 */

import { useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabase } from "@/lib/supabase/config";
import {
  ANONYMOUS,
  PROFILE_COLUMNS,
  type AuthState,
  type ProfileRow,
  toAuthProfile,
} from "./types";

export type AuthStatus = "loading" | "ready";

export interface ClientAuth extends AuthState {
  status: AuthStatus;
}

const ANON_READY: ClientAuth = { ...ANONYMOUS, status: "ready" };
const ANON_LOADING: ClientAuth = { ...ANONYMOUS, status: "loading" };

/* ------------------------------------------------------------------ *
 * store
 * ------------------------------------------------------------------ */

let snapshot: ClientAuth = ANON_LOADING;
let started = false;
const listeners = new Set<() => void>();

function emit(next: ClientAuth): void {
  snapshot = next;
  listeners.forEach((l) => l());
}

async function loadProfile(
  supabase: SupabaseClient,
  userId: string,
  email: string | null,
): Promise<void> {
  const { data } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  const row = (data ?? null) as ProfileRow | null;
  const profile = row ? toAuthProfile(row) : null;

  emit({
    user: { id: userId, email },
    profile,
    role: profile?.role ?? "buyer",
    isAnonymous: false,
    status: "ready",
  });
}

function start(): void {
  if (started) return;
  started = true;

  if (!hasSupabase()) {
    // Prototype mode: anonymous, settled, no requests.
    emit(ANON_READY);
    return;
  }

  void (async () => {
    try {
      const { getBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getBrowserClient();

      // getUser() re-validates against the auth server — we never decode
      // the cookie ourselves and never trust a client-supplied id.
      const { data, error } = await supabase.auth.getUser();
      const user = error ? null : data.user;

      if (user) await loadProfile(supabase, user.id, user.email ?? null);
      else emit(ANON_READY);

      supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user;
        if (u) void loadProfile(supabase, u.id, u.email ?? null);
        else emit(ANON_READY);
      });
    } catch {
      // A missing/broken auth backend must never take the feed down.
      emit(ANON_READY);
    }
  })();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  start();
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot(): ClientAuth {
  return snapshot;
}

function getServerSnapshot(): ClientAuth {
  return ANON_LOADING;
}

/* ------------------------------------------------------------------ *
 * hook
 * ------------------------------------------------------------------ */

/** `{ user, profile, role, isAnonymous }` (+ `status`) for the browser. */
export function useAuth(): ClientAuth {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export {
  ANONYMOUS,
  landingFor,
  isValidEmail,
  type AuthProfile,
  type AuthRole,
  type AuthState,
  type AuthUser,
  type Role,
} from "./types";
