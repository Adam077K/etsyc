// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import SignInPage from "./page";

/**
 * W1-FF fix 6 (edge B) — a rejected ?next= must not linger in the address
 * bar for the whole OTP flow. The page strips it server-side (redirect to
 * the bare sign-in path) before anything renders; only a next that will
 * actually be honored survives into the URL and the hidden form field.
 */

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));

// The server-action module pulls the real Supabase client into the test
// graph; the rendered form only needs the action references.
vi.mock("@/lib/auth/actions", () => ({
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));

function props(next?: string | string[]) {
  return {
    searchParams: Promise.resolve(
      next === undefined ? {} : { next },
    ) as Promise<Record<string, string | string[] | undefined>>,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("SignInPage ?next= hygiene (W1-FF fix 6)", () => {
  it.each([
    "https://evil.com",
    "/\t//evil.com", // control-char vector (sec-p1) — still fails closed
    "/..//evil.com", // dot-segment vector (sec-p1) — still fails closed
    `/${"a".repeat(600)}`, // over the length bound (fix 3)
  ])("strips rejected next %j server-side before render", async (bad) => {
    await expect(SignInPage(props(bad))).rejects.toThrow("redirect:/sign-in");
  });

  it("strips a repeated ?next= (array) — never trusts an ambiguous param", async () => {
    await expect(SignInPage(props(["/feed", "/account"]))).rejects.toThrow(
      "redirect:/sign-in",
    );
  });

  it("keeps a valid same-origin next in the hidden field", async () => {
    const { container } = render(await SignInPage(props("/account")));
    const hidden = container.querySelector<HTMLInputElement>(
      'input[name="next"]',
    );
    expect(hidden?.value).toBe("/account");
  });

  it("renders normally with no next param", async () => {
    const { container } = render(await SignInPage(props()));
    expect(container.querySelector('input[name="next"]')).toBeNull();
    expect(container.querySelector('input[name="email"]')).not.toBeNull();
  });
});
