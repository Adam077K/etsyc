// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AccountPage from "./page";

/**
 * W1-FF fix 1 — a transient profiles read error must render the recoverable
 * error state, NEVER the editable form. Pre-fix, the error fell through to
 * the empty-state form pre-filled with blanks, and one submit overwrote a
 * real stored profile with empty values (data loss).
 */

const getUser = vi.fn();
const maybeSingle = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle }),
      }),
    }),
  }),
}));

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
  useRouter: () => ({ refresh }),
}));

// The server-action modules pull next/cache + the real Supabase client into
// the test graph; the rendered forms only need their references here.
vi.mock("@/lib/account/actions", () => ({ updateProfile: vi.fn() }));
vi.mock("@/lib/auth/actions", () => ({ signOut: vi.fn() }));

const USER = { id: "user-1", email: "ada@example.com" };

beforeEach(() => {
  getUser.mockResolvedValue({ data: { user: USER } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("AccountPage — read error vs empty state (W1-FF fix 1)", () => {
  it("renders the error state on a read error — no submittable blank form", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "transient read failure" },
    });

    render(await AccountPage());

    // The data-loss vector: no editable profile form may exist in this state.
    expect(screen.queryByRole("button", { name: /save profile/i })).toBeNull();
    expect(screen.queryByLabelText(/display name/i)).toBeNull();
    expect(screen.queryByLabelText(/bio/i)).toBeNull();
    expect(screen.queryByLabelText(/avatar url/i)).toBeNull();
    // And it must not look like a fresh profile either (error ≠ empty).
    expect(screen.queryByText("Make this yours")).toBeNull();

    // Recoverable: quiet inline message + retry re-runs the server read.
    expect(
      screen.getByText(/couldn't load your profile/i),
    ).toBeDefined();
    const retry = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(retry);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("renders the empty-state form for a genuinely new profile (no error)", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    render(await AccountPage());

    expect(screen.getByText("Make this yours")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /save profile/i }),
    ).toBeDefined();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("renders the loaded profile on success", async () => {
    maybeSingle.mockResolvedValue({
      data: {
        role: "buyer",
        display_name: "Ada",
        bio: "I collect teapots.",
        avatar_url: null,
      },
      error: null,
    });

    render(await AccountPage());

    expect(screen.getByDisplayValue("Ada")).toBeDefined();
    expect(
      screen.getByRole("button", { name: /save profile/i }),
    ).toBeDefined();
    expect(screen.queryByText("Make this yours")).toBeNull();
    expect(screen.queryByRole("button", { name: /try again/i })).toBeNull();
  });

  it("redirects to sign-in when there is no session", async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(AccountPage()).rejects.toThrow(
      "redirect:/sign-in?next=%2Faccount",
    );
  });
});
