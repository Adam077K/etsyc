import { afterEach, describe, expect, it, vi } from "vitest";

import { createAnonClient } from "../anon";

/**
 * Unit contract for the server-side anon factory (W2-WIRE STEP 1): the
 * client MUST be constructed with the anon key — never the service-role
 * key, even when both are present in the server env — and MUST carry no
 * cookie or session adapter, so `auth.uid()` is null on every query and
 * only the `*_public_read_published` RLS policies apply.
 */

const { createClientSpy } = vi.hoisted(() => ({
  createClientSpy: vi.fn(
    (url: string, key: string, options?: Record<string, unknown>) => ({
      marker: "fake-supabase-client" as const,
      url,
      key,
      options,
    }),
  ),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientSpy,
}));

const SUPABASE_URL = "https://w2-wire-test.supabase.co";
const ANON_KEY = "anon-key-sentinel";
const SERVICE_ROLE_KEY = "service-role-key-sentinel";

function stubKeys(): void {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ANON_KEY);
  // Present on the server for admin.ts — the anon factory must never read it.
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY);
}

afterEach(() => {
  vi.unstubAllEnvs();
  createClientSpy.mockClear();
});

describe("createAnonClient", () => {
  it("constructs with the ANON key — never the service-role key, even when both are in env", () => {
    stubKeys();
    const client = createAnonClient();

    expect(createClientSpy).toHaveBeenCalledOnce();
    const [url, key] = createClientSpy.mock.calls[0] ?? [];
    expect(url).toBe(SUPABASE_URL);
    expect(key).toBe(ANON_KEY);
    expect(key).not.toBe(SERVICE_ROLE_KEY);
    expect(client).toBe(createClientSpy.mock.results[0]?.value);
  });

  it("carries no cookie or session adapter — auth.uid() stays null on every query", () => {
    stubKeys();
    createAnonClient();

    const options = createClientSpy.mock.calls[0]?.[2];
    expect(options).toBeDefined();
    // A cookie adapter of any shape would resolve the signed-in user's JWT
    // and re-open the unpublished-clip leak this factory exists to close.
    expect(options).not.toHaveProperty("cookies");
    expect(options).not.toHaveProperty("global");
    expect(options?.auth).toEqual({
      autoRefreshToken: false,
      persistSession: false,
    });
  });
});
