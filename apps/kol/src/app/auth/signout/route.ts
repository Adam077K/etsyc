/**
 * Sign out — POST only.
 *
 * Server-side on purpose: the session cookies are httpOnly, so the browser
 * cannot clear them itself. Calling `signOut()` on the server client is
 * what actually revokes the refresh token and expires the cookies.
 *
 * POST-only means a stray `<img src="/auth/signout">` or a prefetch can't
 * log someone out, and the `AuthMenu` submits a real form so it still
 * works with JS disabled.
 */

import { NextResponse, type NextRequest } from "next/server";
import { hasSupabase } from "@/lib/supabase/config";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  if (hasSupabase()) {
    try {
      const supabase = await getServerClient();
      await supabase.auth.signOut();
    } catch {
      // Already signed out, or auth unreachable. Land them home either way.
    }
  }

  return NextResponse.redirect(new URL("/", request.nextUrl.origin), {
    status: 303, // POST → GET, so the browser doesn't re-post on refresh
  });
}
