"use client";

import { useActionState } from "react";

import { ErrorInline } from "@/components/states/ErrorInline";
import { Button } from "@/components/ui/button";
import { requestOtp, verifyOtp, type AuthFormState } from "@/lib/auth/actions";
import { SIGN_IN_PATH } from "@/lib/auth/routes";

/**
 * Email/OTP sign-in (spec P1, all 4 states — §A2.3):
 *   empty   → logged-out email entry (a warm entry point, not a blank)
 *   loading → "verifying" scoped to the submit action, never full-page
 *   error   → quiet inline message beneath the field + resend affordance
 *   success → the verify server action redirects to the role-correct landing
 *
 * The form sends exactly email + code (+ same-origin next). No role, no
 * handle — those are DB-owned (B0: handle_new_user forces 'buyer').
 */

const IDLE: AuthFormState = { status: "idle" };

const inputClass =
  "min-h-11 w-full rounded-md border border-line bg-surface px-4 py-2.5 font-text text-body text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export function SignInForm({ next }: { next?: string }) {
  const [sendState, sendAction, sendPending] = useActionState(requestOtp, IDLE);
  const [verifyState, verifyAction, verifyPending] = useActionState(
    verifyOtp,
    IDLE,
  );

  if (sendState.status !== "sent") {
    // ── Empty state: email entry (plus inline error if the send failed) ──
    return (
      <form action={sendAction} className="flex flex-col gap-4">
        <label
          htmlFor="auth-email"
          className="font-text text-caption uppercase tracking-[0.08em] text-muted"
        >
          Email
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          defaultValue={
            sendState.status === "error" ? (sendState.email ?? "") : ""
          }
          aria-describedby={sendState.status === "error" ? "send-error" : undefined}
          className={inputClass}
        />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {sendState.status === "error" ? (
          <div id="send-error">
            <ErrorInline message={sendState.message} />
          </div>
        ) : null}
        <Button type="submit" variant="accent" disabled={sendPending}>
          {sendPending ? "Sending code…" : "Send me a code"}
        </Button>
        <p className="text-caption text-muted">
          No password — we email you a one-time code. New here? The same code
          creates your account.
        </p>
      </form>
    );
  }

  // ── Code entry: verify (loading) / inline error + resend / success ──
  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-muted" role="status">
        {sendState.resent
          ? `A fresh code is on its way to ${sendState.email}.`
          : `We sent a 6-digit code to ${sendState.email}.`}
      </p>

      <form action={verifyAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={sendState.email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label
          htmlFor="auth-code"
          className="font-text text-caption uppercase tracking-[0.08em] text-muted"
        >
          6-digit code
        </label>
        <input
          id="auth-code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoFocus
          placeholder="000000"
          aria-describedby={
            verifyState.status === "error" ? "verify-error" : undefined
          }
          className={`${inputClass} tracking-[0.4em]`}
        />
        {verifyState.status === "error" ? (
          <div id="verify-error">
            <ErrorInline message={verifyState.message} />
          </div>
        ) : null}
        <Button type="submit" variant="accent" disabled={verifyPending}>
          {verifyPending ? "Verifying…" : "Verify and sign in"}
        </Button>
        {verifyPending ? (
          <p className="sr-only" role="status">
            Verifying code
          </p>
        ) : null}
      </form>

      <form action={sendAction} className="flex items-center gap-3">
        <input type="hidden" name="email" value={sendState.email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Button type="submit" variant="quiet" size="sm" disabled={sendPending}>
          {sendPending ? "Sending…" : "Resend code"}
        </Button>
        <a
          href={
            next
              ? `${SIGN_IN_PATH}?next=${encodeURIComponent(next)}`
              : SIGN_IN_PATH
          }
          className="font-text text-caption uppercase tracking-[0.04em] text-muted underline-offset-4 hover:underline"
        >
          Use a different email
        </a>
      </form>
    </div>
  );
}
