// SERVER-ONLY MODULE — the `server-only` import makes any attempt to pull the
// service-role key accessor into a "use client" bundle a build-time error
// (QA finding #2: the accessor must not live beside the browser-safe accessors
// in env.ts). Do not re-export from any client-imported barrel.
import "server-only";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[supabase] Missing environment variable ${name}. ` +
        `Copy apps/kol/.env.example to apps/kol/.env.local and set it (Supabase dashboard → Settings → API).`,
    );
  }
  return value;
}

export function getSupabaseServiceRoleKey(): string {
  return requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY",
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
