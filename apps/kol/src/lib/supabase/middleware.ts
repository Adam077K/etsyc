import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  BUYER_LANDING,
  SIGN_IN_PATH,
  classifyRoute,
  landingPathFor,
} from "@/lib/auth/routes";

import type { Database } from "./database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Middleware session helper — refreshes the auth token, keeps request +
 * response cookies in sync (per @supabase/ssr App Router conventions), and
 * applies the P1 role-gated route policy (lib/auth/routes.ts):
 *
 *   - protected routes (buyer/seller/account) without a session → /sign-in?next=…
 *   - /sign-in with a session → role-correct landing (buyer→feed, seller→dashboard)
 *   - seller routes as a non-seller → buyer landing (no cross-role leak)
 *   - /feed is PUBLIC since W3-B1a: an anonymous request passes through with
 *     200 (no redirect) while the getUser() call below still runs, so the
 *     auth-cookie refresh path is preserved for signed-in visitors.
 *
 * Routing is UX; RLS remains the only trust boundary (B0). The role is read
 * from the RLS-scoped profiles row — never from forgeable JWT user_metadata.
 * Called from src/middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Required: getUser() (not getSession()) revalidates the JWT with Supabase
  // and triggers the token refresh the cookie sync above persists.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Any redirect must carry the refreshed auth cookies, or the new token is
  // dropped and the user bounces through a refresh loop.
  const redirectTo = (pathname: string, next?: string) => {
    const url = request.nextUrl.clone();
    url.pathname = pathname;
    url.search = "";
    if (next) url.searchParams.set("next", next);
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies
      .getAll()
      .forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  const route = classifyRoute(request.nextUrl.pathname);

  if (!user) {
    // "buyer" currently has no member routes (W3-B1a made /feed public);
    // the branch stays so a future buyer-only route is protected the moment
    // classifyRoute claims it. /account and /seller remain gated.
    if (route === "buyer" || route === "seller" || route === "account") {
      return redirectTo(SIGN_IN_PATH, request.nextUrl.pathname);
    }
    return supabaseResponse;
  }

  if (route === "auth-entry" || route === "seller") {
    // Own-row read under RLS; one query, only on the routes that need role.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role ?? "buyer";

    if (route === "auth-entry") return redirectTo(landingPathFor(role));
    if (role !== "seller") return redirectTo(BUYER_LANDING);
  }

  return supabaseResponse;
}
