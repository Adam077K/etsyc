import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { verifyOtp, type AuthFormState } from "./actions";

/**
 * W1-FF fix 6 (edge A) — the post-sign-in redirect must land on the
 * role-correct default whenever ?next= is rejected, with no wrong-surface
 * flash. Pre-fix, a FAILED role read fell back to a blind "buyer" guess and
 * sent sellers to the buyer feed; it now bounces through auth-entry, where
 * the middleware re-resolves the role at its own choke point.
 */

const verifyOtpAuth = vi.fn();
const maybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { verifyOtp: verifyOtpAuth },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

const IDLE: AuthFormState = { status: "idle" };

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) fd.set(key, value);
  return fd;
}

beforeEach(() => {
  verifyOtpAuth.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("verifyOtp redirect targets (W1-FF fix 6)", () => {
  it("honors a valid next — final URL carries no ?next=", async () => {
    maybeSingle.mockResolvedValue({ data: { role: "buyer" }, error: null });

    await expect(
      verifyOtp(IDLE, form({ email: "a@b.co", code: "123456", next: "/account" })),
    ).rejects.toThrow("redirect:/account");
  });

  it("rejected next (control-char vector) → role-correct landing for a seller", async () => {
    maybeSingle.mockResolvedValue({ data: { role: "seller" }, error: null });

    await expect(
      verifyOtp(
        IDLE,
        form({ email: "a@b.co", code: "123456", next: "/\t//evil.com" }),
      ),
    ).rejects.toThrow("redirect:/seller");
  });

  it("rejected next → role-correct landing for a buyer", async () => {
    maybeSingle.mockResolvedValue({ data: { role: "buyer" }, error: null });

    await expect(
      verifyOtp(
        IDLE,
        form({ email: "a@b.co", code: "123456", next: "https://evil.com" }),
      ),
    ).rejects.toThrow("redirect:/feed");
  });

  it("FAILED role read (dot-segment vector rejected too) → auth-entry bounce, never a blind buyer guess", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "transient read failure" },
    });

    // Pre-fix this redirected a seller to /feed (the wrong surface). The
    // bounce target is auth-entry — the middleware re-reads the role there
    // and issues the role-correct landing before anything renders.
    await expect(
      verifyOtp(
        IDLE,
        form({ email: "a@b.co", code: "123456", next: "/..//evil.com" }),
      ),
    ).rejects.toThrow("redirect:/sign-in");
  });
});
