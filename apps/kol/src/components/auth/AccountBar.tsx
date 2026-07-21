import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { ACCOUNT_PATH, type UserRole } from "@/lib/auth/routes";

/**
 * Signed-in identity strip for the role-correct landings (spec P1 success
 * state). Server component — renders the RLS-read profile, never JWT
 * metadata. Sign-out posts the signOut server action.
 */
export function AccountBar({
  email,
  displayName,
  role,
}: {
  email: string;
  displayName: string;
  role: UserRole;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface px-4 py-3">
      <span className="text-body text-ink">
        {displayName.trim() === "" ? email : displayName}
      </span>
      <span className="rounded-pill border border-line px-3 py-1 font-text text-caption uppercase tracking-[0.04em] text-muted">
        {role}
      </span>
      <div className="ml-auto flex items-center gap-3">
        <a
          href={ACCOUNT_PATH}
          className="font-text text-caption uppercase tracking-[0.04em] text-muted underline-offset-4 hover:underline"
        >
          Profile
        </a>
        <form action={signOut}>
          <Button type="submit" variant="quiet" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
