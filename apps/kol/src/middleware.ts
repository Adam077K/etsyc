/**
 * Session refresh + seller role gate (P1).
 *
 * THREE HARD RULES, in priority order:
 *
 *   1. When `hasSupabase()` is false this middleware is a COMPLETE no-op.
 *      No client, no cookie writes, no redirects. The prototype keeps
 *      behaving exactly as it does today, on every route.
 *   2. The buyer feed is never blocked. Discovery, search, product pages,
 *      cart — all of it stays reachable signed-out. Only `/sell/**`
 *      management surfaces are gated, and only when we can actually
 *      resolve an identity.
 *   3. Role comes from the DATABASE (`profiles.role`), never from a
 *      cookie, header, or query param, and `auth.getUser()` re-validates
 *      the JWT rather than decoding it locally.
 *
 * Anything unexpected (network blip, auth outage) fails OPEN for browsing
 * and CLOSED for seller management — never a 500.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabase } from "@/lib/supabase/config";

/** `/sell` itself is the public pitch page — anyone may read it. */
const SELLER_ONBOARDING = ["/sell/interview", "/sell/voice", "/sell/draft", "/sell/verify"];

/** Shop management. Sellers only. */
const SELLER_ONLY = ["/sell/dashboard", "/sell/products", "/sell/edit", "/sell/publish"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(request: NextRequest) {
  // ---- Rule 1: prototype mode is untouched. ----
  if (!hasSupabase()) return NextResponse.next();

  const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
  const key =
    process.env["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
  if (!url || !key) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          // Session cookies are httpOnly + sameSite=lax: the browser never
          // reads the token from JS, and it is never in localStorage.
          response.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        });
      },
    },
  });

  const pathname = request.nextUrl.pathname;
  const needsOnboarding = matches(pathname, SELLER_ONBOARDING);
  const needsSeller = matches(pathname, SELLER_ONLY);

  // IMPORTANT: getUser() is what actually refreshes the session cookie.
  // It runs on every navigation, gated or not.
  let userId: string | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // Auth unreachable. Browsing continues; seller management is denied.
    if (needsOnboarding || needsSeller) return redirectToLogin(request);
    return response;
  }

  // ---- Rule 2: everything outside /sell/** is returned untouched. ----
  if (!needsOnboarding && !needsSeller) return response;

  if (!userId) return redirectToLogin(request);
  if (!needsSeller) return response; // signed-in is enough for onboarding

  // ---- Rule 3: seller-only surfaces resolve role from the DB. ----
  let role: string | null = null;
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle<{ role: string }>();
    role = data?.role ?? null;
  } catch {
    role = null;
  }

  if (role !== "seller") {
    const to = request.nextUrl.clone();
    to.pathname = "/sell";
    to.search = "";
    to.searchParams.set("gated", "seller");
    return NextResponse.redirect(to);
  }

  return response;
}

function redirectToLogin(request: NextRequest) {
  const to = request.nextUrl.clone();
  to.pathname = "/login";
  to.search = "";
  to.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(to);
}

export const config = {
  matcher: [
    /**
     * Everything except static assets and image files. The session cookie
     * has to be refreshed on ordinary navigations too, not just on /sell.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|mp4|webm|woff|woff2|ico)$).*)",
  ],
};
