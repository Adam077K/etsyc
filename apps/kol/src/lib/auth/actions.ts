"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { SIGN_IN_PATH, landingPathFor, safeNextPath } from "./routes";
import { requestOtpSchema, verifyOtpSchema } from "./schemas";

/**
 * Auth server actions (spec P1). All inputs are Zod-validated at this
 * boundary. The actions run on the anon-key session client — every DB read
 * is RLS-scoped, and NOTHING here sends role or handle to Supabase (B0:
 * role is FORCED 'buyer' by the handle_new_user trigger; 'seller' is a
 * service-role onboarding step that does not exist in this flow).
 */

export type AuthFormState =
  | { status: "idle" }
  | { status: "sent"; email: string; resent: boolean }
  | { status: "error"; email?: string; message: string };

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

function friendlySendError(message: string, status?: number): string {
  if (status === 429 || /rate limit|too many/i.test(message)) {
    return "Too many codes requested — give it a minute, then try again.";
  }
  return "We couldn't send the code just now — try again in a moment.";
}

function friendlyVerifyError(message: string, status?: number): string {
  if (status === 429 || /rate limit|too many/i.test(message)) {
    return "Too many attempts — give it a minute, then try again.";
  }
  if (/expired|invalid|not found/i.test(message)) {
    return "That code didn't match or has expired — check the digits, or resend a fresh one.";
  }
  return "We couldn't verify the code just now — try again in a moment.";
}

export async function requestOtp(
  prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = requestOtpSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: firstIssue(parsed.error) };
  }
  const { email } = parsed.data;

  const supabase = await createClient();
  // No `options.data`: user metadata must never carry role/handle (B0).
  // Signup is allowed — first sign-in IS signup; on_auth_user_created →
  // handle_new_user seeds profiles with role='buyer', handle null.
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error("[auth] request_otp_failed", {
      status: error.status,
      code: error.code,
      message: error.message,
    });
    return {
      status: "error",
      email,
      message: friendlySendError(error.message, error.status),
    };
  }

  return { status: "sent", email, resent: prev.status === "sent" };
}

export async function verifyOtp(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = verifyOtpSchema.safeParse({
    email: formData.get("email"),
    code: formData.get("code"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    const email = formData.get("email");
    return {
      status: "error",
      email: typeof email === "string" ? email : undefined,
      message: firstIssue(parsed.error),
    };
  }
  const { email, code, next } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error || !data.user) {
    if (error) {
      console.error("[auth] verify_otp_failed", {
        status: error.status,
        code: error.code,
        message: error.message,
      });
    }
    return {
      status: "error",
      email,
      message: friendlyVerifyError(error?.message ?? "no user", error?.status),
    };
  }

  // Role comes from the DB row the SECURITY DEFINER trigger seeded — never
  // from client metadata or the JWT's user_metadata (forgeable). RLS lets a
  // user read exactly their own row here.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("[auth] profile_role_read_failed", {
      code: profileError.code,
      message: profileError.message,
    });
    // W1-FF fix 6: never guess "buyer" off a FAILED read — a seller would
    // land on (and see) the buyer feed. Bounce through auth-entry instead:
    // the middleware re-reads the role at its own choke point and issues
    // the role-correct landing server-side, so no wrong surface renders.
    redirect(safeNextPath(next) ?? SIGN_IN_PATH);
  }

  redirect(safeNextPath(next) ?? landingPathFor(profile?.role ?? "buyer"));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[auth] sign_out_failed", {
      status: error.status,
      message: error.message,
    });
  }
  redirect("/");
}
