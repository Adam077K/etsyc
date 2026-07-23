import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/components/account/ProfileForm";
import { ProfileLoadError } from "@/components/account/ProfileLoadError";
import { AccountBar } from "@/components/auth/AccountBar";
import { ACCOUNT_PATH, SIGN_IN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * Account & profile screen (spec P2). Session read + RLS-scoped OWN-row
 * profile read — this page never reads another user's profiles row (cross-user
 * display reads go through get_public_profile, lib/account/public-profile.ts).
 * Middleware already gates this route; the getUser check here is defense in
 * depth, not the boundary (RLS is the boundary — B0).
 */

export const metadata: Metadata = { title: "Your account — KOL" };

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`${SIGN_IN_PATH}?next=${encodeURIComponent(ACCOUNT_PATH)}`);
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role, display_name, bio, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[account] own_profile_read_failed", {
      code: error.code,
      message: error.message,
    });
    // Read failed ≠ new profile (W1-FF fix 1). Falling through here would
    // render the form pre-filled with blanks, and one submit would overwrite
    // a real stored profile with empty values. Render the recoverable error
    // state instead — no editable form, no AccountBar built on data we don't
    // have (a defaulted role would flash the wrong identity).
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-page flex-col gap-[var(--space-4)] px-[var(--space-2)] py-[var(--space-6)] md:px-[var(--space-6)]">
        <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
          KOL · your account
        </p>
        <h1 className="max-w-[16ch] font-display text-display [text-wrap:balance]">
          Your profile
        </h1>
        <div className="max-w-prose">
          <ProfileLoadError />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-page flex-col gap-[var(--space-4)] px-[var(--space-2)] py-[var(--space-6)] md:px-[var(--space-6)]">
      <AccountBar
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        role={profile?.role ?? "buyer"}
      />
      <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
        KOL · your account
      </p>
      <h1 className="max-w-[16ch] font-display text-display [text-wrap:balance]">
        Your profile
      </h1>
      <p className="max-w-measure text-body-lg text-muted">
        What you share here follows you across every maker&rsquo;s world. Your
        bio stays yours — other people only ever see your name, avatar, and
        role.
      </p>
      <div className="max-w-prose">
        <ProfileForm
          displayName={profile?.display_name ?? ""}
          bio={profile?.bio ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </main>
  );
}
