import { describe, expect, it } from "vitest";

import { isFeedSessionId, resolveFeedSessionId } from "./session";

const VALID = "9b2f8c4e-1d3a-4f6b-8e0c-2a7d5b9c1e3f";

describe("resolveFeedSessionId", () => {
  it("passes a valid UUID cookie value through unchanged", () => {
    expect(resolveFeedSessionId(VALID)).toBe(VALID);
  });

  it("mints a fresh UUID when the cookie is absent", () => {
    const minted = resolveFeedSessionId(undefined);
    expect(isFeedSessionId(minted)).toBe(true);
  });

  it.each([
    "",
    "not-a-uuid",
    "1234",
    "9b2f8c4e-1d3a-4f6b-8e0c", // truncated
    `${VALID}\n`, // trailing control char
    "A".repeat(600), // oversized
  ])("never reuses tampered value %j — mints a fresh UUID instead", (bad) => {
    const minted = resolveFeedSessionId(bad);
    expect(minted).not.toBe(bad);
    expect(isFeedSessionId(minted)).toBe(true);
  });

  it("two mints are distinct (no fixed fallback id)", () => {
    expect(resolveFeedSessionId(undefined)).not.toBe(
      resolveFeedSessionId(undefined),
    );
  });
});
