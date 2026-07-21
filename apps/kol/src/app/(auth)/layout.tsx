/**
 * Auth route-group shell (P1 — curated chrome only, no seller theming).
 *
 * A narrow, calm column on the app ground. Deliberately quiet: no film,
 * no colour blocks, no countdowns or urgency chrome. Signing in is
 * hygiene, and the entry point should feel warm rather than transactional.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md px-6 pb-[var(--space-16)] pt-[var(--space-10)]">
      {children}
    </main>
  );
}
