"use client";

/**
 * Settings → "Account info" (P2).
 *
 * Two honest branches:
 *   • signed in  — the real email (read-only, it IS the credential) and an
 *     editable display name written to the buyer's OWN `profiles` row.
 *   • otherwise  — the prototype's existing decorative rows, unchanged, so
 *     the page still reads correctly with no database behind it.
 *
 * There is no password row when signed in: KOL has no password store —
 * sign-in is a one-time code, so "change password" would be a lie.
 *
 * SECURITY: the update writes `display_name` only. `role` and `handle` are
 * never in the payload; `guard_profile_role` would reject a role change
 * anyway, and the id is the one `getUser()` validated, never a client value.
 */

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "./useAuth";

const ROW = "flex items-center justify-between gap-4 p-4";
const CARD = "divide-y divide-line rounded-lg border border-line bg-surface";
const BTN =
  "inline-flex min-h-11 items-center rounded-pill border border-line bg-surface px-4 text-caption text-ink transition-colors duration-state ease-kol hover:bg-ground";
const FIELD =
  "min-h-11 w-full rounded-sm border border-line bg-surface px-3 text-body text-ink focus:border-accent focus:outline-none";

type Save = "idle" | "saving" | "saved" | "error";

const MAX_NAME = 60;

export function AccountSection() {
  const { user, profile, isAnonymous, status } = useAuth();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [save, setSave] = useState<Save>("idle");
  const [error, setError] = useState<string | null>(null);

  /* ---- no session: the prototype's decorative rows, untouched ---- */
  if (status === "loading" || isAnonymous || !user) {
    return (
      <>
        <div className={`mt-3 ${CARD}`}>
          <div className={ROW}>
            <div>
              <p className="text-caption uppercase text-muted">Name</p>
              <p className="text-body text-ink">Rowan Ellison</p>
            </div>
            <button className={BTN}>Edit</button>
          </div>
          <div className={ROW}>
            <div>
              <p className="text-caption uppercase text-muted">Email</p>
              <p className="text-body text-ink">rowan@example.com</p>
            </div>
            <button className={BTN}>Edit</button>
          </div>
          <div className={ROW}>
            <div>
              <p className="text-caption uppercase text-muted">Password</p>
              <p className="text-body text-ink">Last changed 3 months ago</p>
            </div>
            <button className={BTN}>Change</button>
          </div>
        </div>
        <p className="mt-2 text-caption text-muted">
          You&rsquo;re browsing without an account, so these are placeholders.{" "}
          <Link href="/login" className="text-ink underline underline-offset-4">
            Sign in
          </Link>{" "}
          to see your real details here.
        </p>
      </>
    );
  }

  /* ---- real session ---- */

  const commit = async () => {
    const value = name.trim();
    setError(null);

    if (value.length > MAX_NAME) {
      setError(`Keep it under ${MAX_NAME} characters.`);
      setSave("error");
      return;
    }

    setSave("saving");
    try {
      const { getBrowserClient } = await import("@/lib/supabase/client");
      const supabase = getBrowserClient();

      const { error: err } = await supabase
        .from("profiles")
        .update({ display_name: value.length > 0 ? value : null })
        .eq("id", user.id);

      if (err) {
        setError("We couldn't save that. Nothing changed — try again.");
        setSave("error");
        return;
      }

      setSave("saved");
      setEditing(false);
    } catch {
      setError("We couldn't reach the server. Nothing changed.");
      setSave("error");
    }
  };

  return (
    <>
      <div className={`mt-3 ${CARD}`}>
        <div className={`${ROW} items-start`}>
          <div className="min-w-0 flex-1">
            <p className="text-caption uppercase text-muted">Display name</p>
            {editing ? (
              <>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={MAX_NAME}
                  autoComplete="name"
                  aria-label="Display name"
                  aria-invalid={save === "error" ? true : undefined}
                  className={`mt-1 ${FIELD}`}
                />
                <p aria-live="polite" className="mt-1 min-h-5 text-caption">
                  {error ? (
                    <span className="text-accent">{error}</span>
                  ) : save === "saving" ? (
                    <span className="text-muted">Saving…</span>
                  ) : (
                    <span className="text-muted">
                      Shown to makers you message. Empty is fine.
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-body text-ink">
                {profile?.displayName?.trim() || (
                  <span className="text-muted">Not set yet — add one when you like.</span>
                )}
              </p>
            )}
          </div>

          {editing ? (
            <span className="flex flex-none gap-2">
              <button
                onClick={() => void commit()}
                disabled={save === "saving"}
                className="inline-flex min-h-11 items-center rounded-pill bg-accent-cta px-4 text-caption font-semibold uppercase text-accent-ink transition-transform duration-tap ease-kol active:scale-[0.98] disabled:opacity-50"
              >
                {save === "saving" ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setName(profile?.displayName ?? "");
                  setError(null);
                  setSave("idle");
                }}
                className={BTN}
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              onClick={() => {
                // Seed the field from the current profile at the moment
                // editing starts — no effect syncing two sources of truth.
                setName(profile?.displayName ?? "");
                setError(null);
                setSave("idle");
                setEditing(true);
              }}
              className={`${BTN} flex-none`}
            >
              Edit
            </button>
          )}
        </div>

        <div className={ROW}>
          <div className="min-w-0">
            <p className="text-caption uppercase text-muted">Email</p>
            <p className="truncate text-body text-ink">{user.email ?? "—"}</p>
          </div>
          <span className="flex-none text-caption text-muted">Your sign-in</span>
        </div>

        <div className={ROW}>
          <div>
            <p className="text-caption uppercase text-muted">Password</p>
            <p className="max-w-measure text-body text-muted">
              There isn&rsquo;t one. KOL signs you in with a one-time code, so there&rsquo;s
              nothing to remember and nothing to leak.
            </p>
          </div>
        </div>

        <div className={ROW}>
          <div>
            <p className="text-caption uppercase text-muted">Account type</p>
            <p className="text-body text-ink">
              {profile?.role === "seller" ? "Seller" : "Buyer"}
            </p>
          </div>
          {profile?.role === "seller" ? (
            <Link href="/sell/dashboard" className={`${BTN} flex-none`}>
              Shop dashboard
            </Link>
          ) : (
            <Link href="/sell" className={`${BTN} flex-none`}>
              Open a shop
            </Link>
          )}
        </div>

        <div className={ROW}>
          <div>
            <p className="text-body text-ink">Sign out</p>
            <p className="text-caption text-muted">Ends this session on this device.</p>
          </div>
          <form action="/auth/signout" method="post" className="flex-none">
            <button type="submit" className={BTN}>
              Sign out
            </button>
          </form>
        </div>
      </div>

      <p aria-live="polite" className="mt-2 min-h-5 text-caption text-muted">
        {save === "saved" && !editing ? "Saved." : ""}
      </p>
    </>
  );
}
