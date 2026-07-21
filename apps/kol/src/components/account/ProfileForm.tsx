"use client";

import { useActionState } from "react";

import { ErrorInline } from "@/components/states/ErrorInline";
import { Button } from "@/components/ui/button";
import {
  updateProfile,
  type ProfileField,
  type ProfileFormState,
} from "@/lib/account/actions";

/**
 * Profile edit form (spec P2, all 4 states):
 *   empty   → new-profile guiding prompts (empty ≠ blank — an invitation)
 *   loading → save-in-flight, submit disabled, scoped "Saving…"
 *   error   → inline per-field validation beneath each input
 *   success → quiet "saved" confirmation; the server action revalidates the
 *             page so the next read reflects the change
 *
 * The form sends exactly displayName + bio + avatarUrl. No role, no handle —
 * role is DB-guarded (B0: guard_profile_role) and the app never attempts it.
 */

const IDLE: ProfileFormState = { status: "idle" };

const inputClass =
  "min-h-11 w-full rounded-md border border-line bg-surface px-4 py-2.5 font-text text-body text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const labelClass =
  "font-text text-caption uppercase tracking-[0.08em] text-muted";

function fieldError(
  state: ProfileFormState,
  field: ProfileField,
): string | undefined {
  return state.status === "error" ? state.fieldErrors?.[field] : undefined;
}

export function ProfileForm({
  displayName,
  bio,
  avatarUrl,
}: {
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfile, IDLE);

  const isNew =
    displayName.trim() === "" && bio === null && avatarUrl === null;

  const nameError = fieldError(state, "displayName");
  const bioError = fieldError(state, "bio");
  const avatarError = fieldError(state, "avatarUrl");

  return (
    <div className="flex flex-col gap-6">
      {isNew ? (
        // ── Empty state: guiding prompts, not a blank form ──
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line bg-surface/60 px-6 py-6">
          <p className="font-display text-h3 text-ink">
            Make this yours
          </p>
          <p className="max-w-measure text-body text-muted">
            A name and a line about you is all it takes — the makers you buy
            from see this, and your feed grows around it.
          </p>
        </div>
      ) : null}

      <form action={action} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="profile-display-name" className={labelClass}>
            Display name
          </label>
          <input
            id="profile-display-name"
            name="displayName"
            type="text"
            required
            maxLength={80}
            defaultValue={displayName}
            placeholder="How should makers know you?"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "profile-display-name-error" : undefined}
            className={inputClass}
          />
          {nameError ? (
            <div id="profile-display-name-error">
              <ErrorInline message={nameError} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="profile-bio" className={labelClass}>
            Bio <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <textarea
            id="profile-bio"
            name="bio"
            rows={4}
            maxLength={500}
            defaultValue={bio ?? ""}
            placeholder="A line or two — what you love, what you collect."
            aria-invalid={bioError ? true : undefined}
            aria-describedby={bioError ? "profile-bio-error" : undefined}
            className={`${inputClass} min-h-28 resize-y`}
          />
          {bioError ? (
            <div id="profile-bio-error">
              <ErrorInline message={bioError} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="profile-avatar-url" className={labelClass}>
            Avatar URL{" "}
            <span className="normal-case tracking-normal">(optional)</span>
          </label>
          <input
            id="profile-avatar-url"
            name="avatarUrl"
            type="url"
            maxLength={2048}
            defaultValue={avatarUrl ?? ""}
            placeholder="https://…"
            aria-invalid={avatarError ? true : undefined}
            aria-describedby={avatarError ? "profile-avatar-url-error" : undefined}
            className={inputClass}
          />
          {avatarError ? (
            <div id="profile-avatar-url-error">
              <ErrorInline message={avatarError} />
            </div>
          ) : null}
        </div>

        {state.status === "error" && !state.fieldErrors ? (
          <ErrorInline message={state.message} />
        ) : null}

        <div className="flex items-center gap-4">
          <Button type="submit" variant="accent" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
          {state.status === "saved" && !pending ? (
            <p className="text-body text-muted" role="status">
              Saved — your profile is up to date.
            </p>
          ) : null}
          {pending ? (
            <p className="sr-only" role="status">
              Saving profile
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
