/**
 * /login — email + OTP sign-in (P1).
 *
 * Does not create accounts: a stranger's email here gets an honest
 * "we couldn't find an account" and a link to /signup, rather than a
 * silent registration.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = {
  title: "Sign in — KOL",
  description: "Sign in to KOL with a one-time code. No password.",
};

export default function LoginPage() {
  return (
    <>
      <header>
        <p className="text-caption uppercase text-muted">Welcome back</p>
        <h1 className="mt-1 font-display text-h1 text-ink">Sign in</h1>
        <p className="mt-3 max-w-measure text-body text-muted">
          Your follows, saves, and orders come with you. Enter your email and we&rsquo;ll send a
          one-time code — there&rsquo;s no password to remember.
        </p>
      </header>

      <div className="mt-[var(--space-6)] rounded-lg border border-line bg-surface p-5 shadow-subtle">
        <Suspense fallback={<div className="kol-skeleton h-40 rounded-sm" />}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </>
  );
}
