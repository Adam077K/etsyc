/**
 * Env accessors for the Supabase client layer.
 *
 * Missing vars throw a CLEAR error at first use (runtime), never at build time —
 * the app must compile unconfigured (CI builds without keys).
 * Var names are the contract in apps/kol/.env.example.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[supabase] Missing environment variable ${name}. ` +
        `Copy apps/kol/.env.example to apps/kol/.env.local and set it (Supabase dashboard → Settings → API).`,
    );
  }
  return value;
}

export function getSupabaseUrl(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  );
}

export function getSupabaseAnonKey(): string {
  return requireEnv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
