import { describe, expect, it } from "vitest";

import {
  avatarUrlSchema,
  bioSchema,
  buyerSignalInsertSchema,
  displayNameSchema,
  publicProfileIdSchema,
  updateProfileSchema,
} from "./schemas";

const UUID = "6f1c1a2e-0b3d-4c5e-8f7a-9b0c1d2e3f4a";

describe("displayNameSchema", () => {
  it("trims and accepts a normal name", () => {
    expect(displayNameSchema.parse("  Ada Lovelace  ")).toBe("Ada Lovelace");
  });

  it("rejects empty / whitespace-only", () => {
    expect(displayNameSchema.safeParse("").success).toBe(false);
    expect(displayNameSchema.safeParse("   ").success).toBe(false);
  });

  it("rejects > 80 chars", () => {
    expect(displayNameSchema.safeParse("a".repeat(81)).success).toBe(false);
  });
});

describe("bioSchema", () => {
  it("stores empty as null (absence, not blank string)", () => {
    expect(bioSchema.parse("")).toBeNull();
    expect(bioSchema.parse("   ")).toBeNull();
  });

  it("keeps trimmed content", () => {
    expect(bioSchema.parse("  I collect teapots.  ")).toBe("I collect teapots.");
  });

  it("rejects > 500 chars", () => {
    expect(bioSchema.safeParse("a".repeat(501)).success).toBe(false);
  });
});

describe("avatarUrlSchema", () => {
  it("stores empty as null", () => {
    expect(avatarUrlSchema.parse("")).toBeNull();
  });

  it("accepts a well-formed https URL", () => {
    expect(avatarUrlSchema.parse("https://cdn.example/a.png")).toBe(
      "https://cdn.example/a.png",
    );
  });

  it.each(["http://cdn.example/a.png", "javascript:alert(1)", "not a url", "//cdn.example/a.png"])(
    "rejects %s",
    (bad) => {
      expect(avatarUrlSchema.safeParse(bad).success).toBe(false);
    },
  );
});

describe("updateProfileSchema", () => {
  it("carries exactly displayName + bio + avatarUrl — no role, no handle", () => {
    const parsed = updateProfileSchema.parse({
      displayName: "Ada",
      bio: "",
      avatarUrl: "",
      // extra keys a hostile form might inject are STRIPPED, not forwarded
      role: "seller",
      handle: "forged",
    } as Record<string, unknown>);
    expect(parsed).toEqual({ displayName: "Ada", bio: null, avatarUrl: null });
    expect(Object.keys(parsed).sort()).toEqual([
      "avatarUrl",
      "bio",
      "displayName",
    ]);
  });

  it("rejects invalid input as a whole (no partial write)", () => {
    const parsed = updateProfileSchema.safeParse({
      displayName: "",
      bio: "fine",
      avatarUrl: "https://ok.example/a.png",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("publicProfileIdSchema", () => {
  it("accepts a uuid and rejects everything else (RPC is id-keyed only)", () => {
    expect(publicProfileIdSchema.safeParse(UUID).success).toBe(true);
    expect(publicProfileIdSchema.safeParse("*").success).toBe(false);
    expect(publicProfileIdSchema.safeParse("1 OR 1=1").success).toBe(false);
    expect(publicProfileIdSchema.safeParse("").success).toBe(false);
  });
});

describe("buyerSignalInsertSchema", () => {
  const base = {
    buyerId: UUID,
    subjectType: "store",
    subjectId: UUID,
    signalType: "visit",
  } as const;

  it("accepts a valid signal and defaults weight to 1", () => {
    const parsed = buyerSignalInsertSchema.parse(base);
    expect(parsed.weight).toBe(1);
  });

  it("mirrors the DB weight CHECK (0–100)", () => {
    expect(buyerSignalInsertSchema.safeParse({ ...base, weight: 100 }).success).toBe(true);
    expect(buyerSignalInsertSchema.safeParse({ ...base, weight: 101 }).success).toBe(false);
    expect(buyerSignalInsertSchema.safeParse({ ...base, weight: -1 }).success).toBe(false);
  });

  it("rejects values outside the DB enums", () => {
    expect(
      buyerSignalInsertSchema.safeParse({ ...base, subjectType: "video" }).success,
    ).toBe(false);
    expect(
      buyerSignalInsertSchema.safeParse({ ...base, signalType: "scroll" }).success,
    ).toBe(false);
  });
});
