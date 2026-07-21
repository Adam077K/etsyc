"use client";

/**
 * Email + OTP form shared by /login and /signup (P1).
 *
 * Four states, all real:
 *   idle    — email entry (warm entry point, not a blank slab)
 *   sending — submit disabled, scoped spinner copy, never a page block
 *   sent    — code entry + resend; the email also carries a link
 *   error   — inline beneath the field, aria-live, always recoverable
 *
 * Prototype mode (`hasSupabase() === false`) does not pretend. It says so
 * plainly and points at the anonymous path, which is how the feed already
 * works. No fake "code sent" ever appears.
 *
 * The client never touches `role` or `handle` — `handle_new_user` forces
 * `'buyer'` server-side and `guard_profile_role` rejects anything else.
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { hasSupabase } from "@/lib/supabase/config";
import { isValidEmail, safeRedirect } from "@/lib/auth/types";

type Stage = "idle" | "sending" | "sent" | "verifying";

const CODE_LENGTH = 6;

/* ---- shared surface classes (KOL design system, no new tokens) ---- */
const FIELD =
  "w-full min-h-11 rounded-sm border border-line bg-surface px-3 text-body text-ink placeholder:text-muted focus:border-accent focus:outline-none";
const PRIMARY =
  "inline-flex min-h-11 w-full items-center justify-center rounded-pill bg-accent-cta px-5 text-caption font-semibold uppercase text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const QUIET =
  "inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground";

/** Supabase's raw messages are for us, not for the person reading them. */
function humanError(raw: string, mode: Mode): string {
  const m = raw.toLowerCase();
  if (m.includes("signups not allowed") || m.includes("user not found")) {
    return mode === "login"
      ? "We couldn't find an account for that email. Create one below — it takes one code."
      : "That email can't be used to sign up right now.";
  }
  if (m.includes("already registered") || m.includes("already exists")) {
    return "You already have an account with that email. Sign in instead.";
  }
  if (m.includes("rate") || m.includes("too many") || m.includes("429")) {
    return "That's a few codes in a row. Give it a minute, then ask again.";
  }
  if (m.includes("expired")) {
    return "That code has expired. Send a fresh one and it'll work.";
  }
  if (m.includes("invalid") || m.includes("token")) {
    return "That code didn't match. Check the digits, or send a new one.";
  }
  if (m.includes("fetch") || m.includes("network")) {
    return "We couldn't reach the sign-in service. Check your connection and try again.";
  }
  return "Something went wrong on our side. Try again — nothing was lost.";
}

/** `?error=` values the callback route can hand back. */
function linkErrorMessage(reason: string | null): string | null {
  if (!reason) return null;
  if (reason === "link") {
    return "That sign-in link didn't work — links are single-use and expire. Send a new code.";
  }
  return "Sign-in isn't available right now. Try again in a moment.";
}

export type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();

  const next = safeRedirect(params?.get("next") ?? null, "");
  const linkError = params?.get("error") ?? null;

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  // A failed callback comes back as `?error=…`. Seed the inline error from
  // it at mount rather than syncing it in an effect.
  const [error, setError] = useState<string | null>(() => linkErrorMessage(linkError));
  const [resent, setResent] = useState(false);

  const codeRef = useRef<HTMLInputElement>(null);
  const enabled = hasSupabase();

  useEffect(() => {
    if (stage === "sent") codeRef.current?.focus();
  }, [stage]);

  const sendCode = useCallback(
    async (isResend: boolean) => {
      setError(null);
      setResent(false);

      if (!isValidEmail(email)) {
        setError("That doesn't look like an email address yet.");
        return;
      }

      setStage("sending");
      try {
        const { getBrowserClient } = await import("@/lib/supabase/client");
        const supabase = getBrowserClient();

        const redirect = new URL("/auth/callback", window.location.origin);
        if (next) redirect.searchParams.set("next", next);

        const { error: err } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            // /login must not silently create accounts; /signup may.
            shouldCreateUser: mode === "signup",
            emailRedirectTo: redirect.toString(),
          },
        });

        if (err) {
          setError(humanError(err.message ?? "", mode));
          setStage(isResend ? "sent" : "idle");
          return;
        }

        setStage("sent");
        if (isResend) setResent(true);
      } catch (e) {
        setError(humanError(e instanceof Error ? e.message : "", mode));
        setStage(isResend ? "sent" : "idle");
      }
    },
    [email, mode, next],
  );

  const verify = useCallback(async () => {
    setError(null);

    const token = code.replace(/\D/g, "");
    if (token.length !== CODE_LENGTH) {
      setError(`The code is ${CODE_LENGTH} digits — check the email again.`);
      return;
    }

    setStage("verifying");
    try {
      const { getBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getBrowserClient();

      const { error: err } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token,
        type: "email",
      });

      if (err) {
        setError(humanError(err.message ?? "", mode));
        setStage("sent");
        return;
      }

      // Role-correct landing is decided server-side by the callback route
      // and the layout; we only need a full refresh so the server sees the
      // new cookie.
      router.replace(next || "/for-you");
      router.refresh();
    } catch (e) {
      setError(humanError(e instanceof Error ? e.message : "", mode));
      setStage("sent");
    }
  }, [code, email, mode, next, router]);

  /* ---------------- prototype mode ---------------- */

  if (!enabled) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface p-5">
        <p className="text-caption uppercase text-muted">Accounts</p>
        <p className="mt-1 max-w-measure text-body text-ink">
          Accounts aren&rsquo;t switched on in this build. KOL is running as an anonymous
          prototype — your follows, saves, and cart live in this browser only.
        </p>
        <p className="mt-2 max-w-measure text-body text-muted">
          Everything below the sign-in wall is already open to you. Nothing is being withheld.
        </p>
        <Link href="/for-you" className={`mt-4 ${QUIET}`}>
          Keep browsing →
        </Link>
      </div>
    );
  }

  /* ---------------- live mode ---------------- */

  const busy = stage === "sending" || stage === "verifying";

  return (
    <div>
      {stage === "sent" || stage === "verifying" ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void verify();
          }}
          noValidate
        >
          <p className="text-body text-ink">
            We sent a {CODE_LENGTH}-digit code to{" "}
            <span className="font-semibold">{email.trim()}</span>. The same email has a link
            if you&rsquo;d rather tap that.
          </p>

          <label htmlFor="otp" className="mt-5 block text-caption uppercase text-muted">
            Your code
          </label>
          <input
            id="otp"
            ref={codeRef}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={CODE_LENGTH}
            placeholder="······"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "auth-error" : undefined}
            className={`mt-1 tracking-[0.4em] ${FIELD}`}
          />

          <p aria-live="polite" className="mt-2 min-h-5 text-caption text-muted">
            {error ? (
              <span id="auth-error" className="text-accent">
                {error}
              </span>
            ) : resent ? (
              "New code sent."
            ) : stage === "verifying" ? (
              "Verifying your code…"
            ) : (
              ""
            )}
          </p>

          <button type="submit" disabled={busy} className={`mt-3 ${PRIMARY}`}>
            {stage === "verifying" ? "Verifying…" : "Sign in"}
          </button>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void sendCode(true)}
              disabled={busy}
              className="text-caption uppercase text-muted underline underline-offset-4 transition-colors duration-state ease-kol hover:text-ink disabled:opacity-50"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                setStage("idle");
                setCode("");
                setError(null);
                setResent(false);
              }}
              className="text-caption uppercase text-muted underline underline-offset-4 transition-colors duration-state ease-kol hover:text-ink"
            >
              Use a different email
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendCode(false);
          }}
          noValidate
        >
          <label htmlFor="email" className="block text-caption uppercase text-muted">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "auth-error" : undefined}
            className={`mt-1 ${FIELD}`}
          />

          <p aria-live="polite" className="mt-2 min-h-5 text-caption text-muted">
            {error ? (
              <span id="auth-error" className="text-accent">
                {error}
              </span>
            ) : stage === "sending" ? (
              "Sending your code…"
            ) : (
              "No password. We email you a code."
            )}
          </p>

          <button type="submit" disabled={stage === "sending"} className={`mt-3 ${PRIMARY}`}>
            {stage === "sending" ? "Sending…" : "Email me a code"}
          </button>
        </form>
      )}

      {/* ---- the anonymous path stays open, always (buyers browse first) ---- */}
      <div className="mt-6 border-t border-line pt-5">
        <p className="text-body text-muted">
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <Link
            href={mode === "login" ? "/signup" : "/login"}
            className="text-ink underline underline-offset-4"
          >
            {mode === "login" ? "Create an account" : "Sign in"}
          </Link>
        </p>
        <Link href="/for-you" className={`mt-3 ${QUIET}`}>
          Continue without an account →
        </Link>
        <p className="mt-2 max-w-measure text-caption text-muted">
          Browsing, saving, and following all work signed-out — they just live in this browser
          instead of your account.
        </p>
      </div>
    </div>
  );
}
