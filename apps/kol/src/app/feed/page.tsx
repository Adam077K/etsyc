import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountBar } from "@/components/auth/AccountBar";
import { SIGN_IN_PATH } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";

/**
 * Buyer landing (spec P1 success state: buyer → discovery feed). The feed
 * itself — the engine's FEED preset over videos/video_profiles — is B1
 * (Batch 2); P1 owns the authed shell: session read, RLS-scoped profile,
 * sign-out. Middleware already gates this route; the getUser check here is
 * defense in depth, not the boundary (RLS is the boundary — B0).
 */

export const metadata: Metadata = { title: "Your feed — KOL" };

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(SIGN_IN_PATH);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, handle")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-page flex-col justify-center gap-[var(--space-4)] px-[var(--space-2)] md:px-[var(--space-6)]">
      <AccountBar
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        role={profile?.role ?? "buyer"}
      />
      <p className="font-text text-caption uppercase tracking-[0.08em] text-muted">
        KOL · your feed
      </p>
      <h1 className="max-w-[16ch] font-display text-display-hero [text-wrap:balance]">
        You&rsquo;re in. The films are on their way.
      </h1>
      <p className="max-w-measure text-body-lg text-muted">
        Your account, orders, and the makers you grow close to now persist
        across visits. The maker-film discovery feed arrives with Batch 2 —
        until then, the block library lives at the preview route.
      </p>
    </main>
  );
}
