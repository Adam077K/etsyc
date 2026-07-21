import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Middleware session helper — refreshes the auth token and keeps request +
 * response cookies in sync, per @supabase/ssr App Router conventions.
 *
 * Deliberately does NO role-gated routing (that is P1 scope). Call from
 * src/middleware.ts once auth routes exist:
 *
 *   export async function middleware(request: NextRequest) {
 *     return updateSession(request);
 *   }
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
  await supabase.auth.getUser();

  return supabaseResponse;
}
