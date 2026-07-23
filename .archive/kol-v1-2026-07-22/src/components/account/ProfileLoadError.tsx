"use client";

import { useRouter } from "next/navigation";

import { ErrorInline } from "@/components/states/ErrorInline";

/**
 * Read-error state for the account page (W1-FF fix 1). Deliberately distinct
 * from the empty state: a failed profiles read must NEVER fall through to an
 * editable form — a form pre-filled with blanks would let a single submit
 * overwrite a real stored profile with empty values (data loss). Retry
 * re-runs the server-component read (router.refresh), keeping recovery
 * quiet and inline — never a blocking wall.
 */
export function ProfileLoadError() {
  const router = useRouter();
  return (
    <ErrorInline
      message="We couldn't load your profile just now — nothing's changed, and nothing will be overwritten."
      onRetry={() => router.refresh()}
    />
  );
}
