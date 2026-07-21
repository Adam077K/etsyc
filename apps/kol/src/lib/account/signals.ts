// SERVER-ONLY MODULE — buyer_signals rows must never reach the browser
// (spec P2 privacy NFR / P6 §5.4). The `server-only` import makes any attempt
// to pull this into a "use client" bundle a build-time error.
import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { buyerSignalInsertSchema, type BuyerSignalInsert } from "./schemas";

/**
 * buyer_signals paths (spec P2 / OQ-4) — the substrate P6+ relationship
 * ranking and B13 follow/save depend on.
 *
 * WRITE — service-role only. buyer_signals has NO client INSERT/UPDATE policy;
 * signals are emitted by the server engine on real events (visit, purchase,
 * follow, …), never self-reported by the client with an arbitrary weight
 * (P2-4). recordBuyerSignal is the one sanctioned write path; it uses the
 * admin client, which is itself a server-only module.
 *
 * READ — own-only. A buyer reads exactly their own rows under RLS
 * (buyer_signals_buyer_read); the rows still never leave the server.
 */

export type BuyerSignalRow = Pick<
  Database["public"]["Tables"]["buyer_signals"]["Row"],
  "id" | "subject_type" | "subject_id" | "signal_type" | "weight" | "created_at"
>;

export type RecordSignalResult =
  | { ok: true; id: string }
  | { ok: false; reason: "invalid_input" | "insert_failed" };

/**
 * Engine write path (service-role). Callers pass a fully-known, server-derived
 * event — buyerId comes from the authenticated session of the flow that
 * observed the event, never from client-supplied form data.
 */
export async function recordBuyerSignal(
  input: BuyerSignalInsert,
): Promise<RecordSignalResult> {
  const parsed = buyerSignalInsertSchema.safeParse(input);
  if (!parsed.success) {
    console.error("[account] buyer_signal_invalid", {
      issues: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    });
    return { ok: false, reason: "invalid_input" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("buyer_signals")
    .insert({
      buyer_id: parsed.data.buyerId,
      subject_type: parsed.data.subjectType,
      subject_id: parsed.data.subjectId,
      signal_type: parsed.data.signalType,
      weight: parsed.data.weight,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[account] buyer_signal_insert_failed", {
      code: error.code,
      message: error.message,
    });
    return { ok: false, reason: "insert_failed" };
  }

  return { ok: true, id: data.id };
}

/**
 * Read-own path (session client, RLS-scoped). Returns the signed-in buyer's
 * newest signals; [] when signed out or on read failure. The explicit
 * buyer_id filter states intent — RLS enforces it regardless.
 */
export async function readOwnSignals(limit = 100): Promise<BuyerSignalRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("buyer_signals")
    .select("id, subject_type, subject_id, signal_type, weight, created_at")
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[account] buyer_signals_read_failed", {
      code: error.code,
      message: error.message,
    });
    return [];
  }

  return data;
}
