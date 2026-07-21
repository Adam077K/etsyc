import type { Metadata } from "next";

import { SignInForm } from "@/components/auth/SignInForm";
import { safeNextPath } from "@/lib/auth/routes";

/**
 * Logged-out entry (spec P1 empty state — curated chrome, KOL's own UI).
 * An already-authed visitor never sees this page: the middleware classes
 * /sign-in as auth-entry and redirects to the role-correct landing.
 */

export const metadata: Metadata = {
  title: "Sign in — KOL",
  description: "One email, one code — your makers and orders, kept.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Sanitize ?next= before it ever reaches a hidden field — hostile values
  // are dropped here AND at the redirect choke point (safeNextPath).
  const next =
    safeNextPath(typeof params.next === "string" ? params.next : null) ??
    undefined;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-page flex-col justify-center px-[var(--space-2)] md:px-[var(--space-6)]">
      <div className="mx-auto flex w-full max-w-[26rem] flex-col gap-[var(--space-3)]">
        <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
          KOL · sign in / join
        </p>
        <h1 className="font-display text-h1 [text-wrap:balance]">
          Pick up where you and your makers left off.
        </h1>
        <SignInForm next={next} />
      </div>
    </main>
  );
}
