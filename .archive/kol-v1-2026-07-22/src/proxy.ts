import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Session refresh + role-gated routing on every navigable request (spec P1).
 * `proxy` is Next 16's name for the middleware convention (middleware.ts is
 * deprecated); all policy lives in the updateSession helper +
 * lib/auth/routes.ts — this file only wires it up and scopes the matcher.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets and Next internals — auth state can't change them.
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm|vtt|woff2?|ico|txt|xml)$).*)",
  ],
};
