"use client";

/**
 * Drop-in replacement for the Nav's hard-coded "Sign in" pill.
 *
 * Nav integration is ONE import swap — see `README.md` in this directory.
 * The markup deliberately mirrors the existing nav pill (`min-h-11`,
 * `rounded-pill`, `text-caption`, `bg-accent-cta`) so the row's rhythm is
 * unchanged whether or not anyone is signed in.
 *
 * While auth is still resolving we render the signed-OUT state. Flashing a
 * signed-in chip you haven't confirmed is worse than a beat of "Sign in".
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./useAuth";

const PILL =
  "inline-flex min-h-11 items-center rounded-pill px-4 text-caption transition-colors duration-state ease-kol";

export function AuthMenu() {
  const { user, profile, isAnonymous, status } = useAuth();
  const pathname = usePathname() ?? "/";

  if (status === "loading" || isAnonymous || !user) {
    // Come back to where they were once they're in.
    const next = pathname.startsWith("/login") || pathname.startsWith("/signup") ? null : pathname;
    const href = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

    return (
      <Link
        href={href}
        className={`${PILL} bg-accent-cta font-semibold text-accent-ink transition-transform duration-tap active:scale-[0.98]`}
      >
        Sign in
      </Link>
    );
  }

  const label = profile?.displayName?.trim() || user.email || "Account";

  return (
    <span className="flex items-center gap-2">
      <Link
        href="/settings"
        title={user.email ?? undefined}
        className={`${PILL} max-w-[12rem] truncate border border-line bg-surface text-ink hover:bg-ground`}
      >
        {label}
      </Link>

      {/* A real form POST: httpOnly cookies can only be cleared server-side,
          and this keeps working with JS disabled. */}
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className={`${PILL} border border-line bg-surface text-muted hover:bg-ground hover:text-ink`}
        >
          Sign out
        </button>
      </form>
    </span>
  );
}
