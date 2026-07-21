import { describe, expect, it } from "vitest";

import {
  emailSchema,
  otpCodeSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "./schemas";

describe("emailSchema", () => {
  it("accepts a plain address and normalizes case + whitespace", () => {
    expect(emailSchema.parse("  Maker@Example.COM ")).toBe("maker@example.com");
  });

  it.each(["", "not-an-email", "a@", "@b.com", "a b@c.com"])(
    "rejects %j",
    (bad) => {
      expect(emailSchema.safeParse(bad).success).toBe(false);
    },
  );

  it("rejects addresses over 254 chars", () => {
    const long = `${"a".repeat(250)}@example.com`;
    expect(emailSchema.safeParse(long).success).toBe(false);
  });
});

describe("otpCodeSchema", () => {
  it("accepts exactly 6 digits (trimmed)", () => {
    expect(otpCodeSchema.parse(" 123456 ")).toBe("123456");
  });

  it.each(["", "12345", "1234567", "12345a", "12 456", "123456\n7"])(
    "rejects %j",
    (bad) => {
      expect(otpCodeSchema.safeParse(bad).success).toBe(false);
    },
  );
});

describe("form schemas", () => {
  it("requestOtpSchema requires a valid email", () => {
    expect(requestOtpSchema.safeParse({ email: "x@y.dev" }).success).toBe(true);
    expect(requestOtpSchema.safeParse({}).success).toBe(false);
  });

  it("verifyOtpSchema requires email + code; next stays optional", () => {
    expect(
      verifyOtpSchema.safeParse({ email: "x@y.dev", code: "000111" }).success,
    ).toBe(true);
    expect(
      verifyOtpSchema.safeParse({
        email: "x@y.dev",
        code: "000111",
        next: "/feed",
      }).success,
    ).toBe(true);
    expect(verifyOtpSchema.safeParse({ email: "x@y.dev" }).success).toBe(false);
  });

  it("verifyOtpSchema has no role or handle field — the client can never send one", () => {
    const keys = Object.keys(verifyOtpSchema.shape);
    expect(keys).not.toContain("role");
    expect(keys).not.toContain("handle");
  });
});
