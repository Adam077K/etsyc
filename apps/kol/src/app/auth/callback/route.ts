/**
 * OTP / magic-link callback (P1 step 2→4).
 *
 * Handles both shapes Supabase can hand back:
 *   • `?code=…`                 — PKCE exchange (magic link, OAuth)
 *   • `?token_hash=…&type=email` — email OTP verification link
 *
 * On success the session cookie is written by the Supabase server client
 * and we redirect to the role-correct landing (or a validated `next`).
 * On failure we send the person back to /login with an honest, inline,
 * recoverable message — never a dead end.
 *
 * `next` is validated by `safeRedirect` (same-origin absolute paths only)
 * so this endpoint can't be turned into an open redirect that leaks a code.
 */

import { NextResponse, type NextRequest } from "next/server";
import { hasSupabase } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";
import { landingFor, safeRedirect, type Role } from "@/lib/auth/types";

type EmailOtpType = "email" | "signup" | "magiclink" | "recovery" | "invite" | "email_change";

const OTP_TYPES: EmailOtpType[] = [
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
];

function failure(request: NextRequest, reason: string) {
  const to = request.nextUrl.clone();
  to.pathname = "/login";
  to.search = "";
  to.searchParams.set("error", reason);
  return NextResponse.redirect(to);
}

export async function GET(request: NextRequest) {
  // Prototype mode has no session to establish. Don't pretend otherwise.
  if (!hasSupabase()) return failure(request, "unavailable");

  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const rawType = params.get("type");
  const next = params.get("next");

  // Supabase surfaces its own failures on the redirect URL.
  const providerError = params.get("error_description") ?? params.get("error");
  if (providerError) return failure(request, "link");

  if (!code && !tokenHash) return failure(request, "link");

  try {
    const supabase = await getServerClient();

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return failure(request, "link");
    } else if (tokenHash) {
      const type = OTP_TYPES.find((t) => t === rawType) ?? "email";
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) return failure(request, "link");
    }

    // Role is read back from the DB — never from the link, never from a
    // query param. `handle_new_user` has already forced 'buyer' on a
    // first-ever sign-in.
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return failure(request, "link");

    const { data: row } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: Role }>();

    const destination = safeRedirect(next, landingFor(row?.role ?? "buyer"));

    // Resolved against our own origin, so a crafted `next` can never
    // point off-site even if it slipped past `safeRedirect`.
    return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
  } catch {
    return failure(request, "unexpected");
  }
}
