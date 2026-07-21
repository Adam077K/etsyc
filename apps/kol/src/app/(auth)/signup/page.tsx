/**
 * /signup — create an account with email + OTP (P1).
 *
 * Everyone starts as a buyer. `handle_new_user` seeds the profile row with
 * role FORCED `'buyer'` and a null handle; this page has no role field,
 * no handle field, and no way to influence either. Becoming a seller is a
 * separate, service-role-only step in seller onboarding.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "../AuthForm";

export const metadata: Metadata = {
  title: "Create an account — KOL",
  description: "Join KOL with a one-time code. No password.",
};

export default function SignupPage() {
  return (
    <>
      <header>
        <p className="text-caption uppercase text-muted">Join KOL</p>
        <h1 className="mt-1 font-display text-h1 text-ink">Create an account</h1>
        <p className="mt-3 max-w-measure text-body text-muted">
          An account keeps the makers you follow, the pieces you save, and your orders in one
          place — across devices, not just this browser.
        </p>
      </header>

      <div className="mt-[var(--space-6)] rounded-lg border border-line bg-surface p-5 shadow-subtle">
        <Suspense fallback={<div className="kol-skeleton h-40 rounded-sm" />}>
          <AuthForm mode="signup" />
        </Suspense>
      </div>

      <p className="mt-5 max-w-measure text-caption text-muted">
        Making things to sell? Start with an account, then{" "}
        <Link href="/sell" className="text-ink underline underline-offset-4">
          open a shop
        </Link>{" "}
        — seller access is granted during onboarding, not at signup.
      </p>
    </>
  );
}
