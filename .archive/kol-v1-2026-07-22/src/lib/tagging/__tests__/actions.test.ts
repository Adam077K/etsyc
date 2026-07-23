import { beforeEach, describe, expect, it, vi } from "vitest";

import { THANKYOU_ONLY_MESSAGE } from "../schemas";

/**
 * saveVideoProfile boundary tests (spec P7). schemas.test.ts proves the Zod
 * schema is correct IN ISOLATION — this file proves the action actually
 * CALLS it before writing. That distinction is the load-bearing invariant:
 * the tag columns are bare text[] with no CHECK constraint, so if the
 * `videoProfileWriteSchema.safeParse` call in actions.ts is ever removed,
 * a thank-you clip becomes feed-eligible and nothing else in the codebase
 * notices. Every rejection case therefore asserts the upsert CALL COUNT is
 * zero — not merely that the result is an error — and the happy path
 * asserts the PARSED payload (post-transform) reaches the upsert verbatim,
 * so a raw-input write fails even when the input happens to be valid.
 */

const { createClientMock, revalidatePathMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
// actions.ts also exports suggestVideoProfileTags, which pulls in the LLM
// stack at module load — stub it out; this file tests the WRITE boundary.
vi.mock("../suggest", () => ({ suggestTags: vi.fn() }));

import { saveVideoProfile } from "../actions";

const VIDEO_ID = "6f1c1a2e-0b3d-4c5e-8f7a-9b0c1d2e3f4a";
const PRODUCT_ID = "0d9b8c7a-6e5f-4a3b-9c2d-1e0f9a8b7c6d";
const USER = { id: "user-1" };

/**
 * anti_repetition_key deliberately arrives as "" — the schema transforms it
 * to null ("absence, not a blank string"), so the parsed payload differs
 * from the raw input. If the action ever writes the raw input instead of
 * `parsed.data`, the happy-path verbatim assertion goes red.
 */
const validInput = {
  purpose: ["process"],
  page_eligibility: ["feed", "world"],
  product_links: [PRODUCT_ID],
  mood: ["calm"],
  anti_repetition_key: "",
};

/**
 * Passes every field-level enum check — ONLY the thankyou-only superRefine
 * rejects it. Exactly the payload that would put a thank-you clip into the
 * feed if the action skipped the schema.
 */
const thankyouLeakInput = {
  purpose: ["thankyou"],
  page_eligibility: ["feed"],
  product_links: [],
  mood: [],
  anti_repetition_key: null,
};

function makeSupabaseStub({
  user,
  upsertError = null,
}: {
  user: { id: string } | null;
  upsertError?: { code: string; message: string } | null;
}) {
  const single = vi.fn().mockResolvedValue(
    upsertError
      ? { data: null, error: upsertError }
      : { data: { id: "profile-row-1" }, error: null },
  );
  const select = vi.fn().mockReturnValue({ single });
  const upsert = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ upsert });
  createClientMock.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
    from,
  });
  return { from, upsert };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("saveVideoProfile — write-time schema gate", () => {
  it("rejects purpose:[thankyou] + page_eligibility:[feed] with field errors AND never invokes the upsert", async () => {
    const { from, upsert } = makeSupabaseStub({ user: USER });

    const result = await saveVideoProfile(VIDEO_ID, thankyouLeakInput);

    expect(result).toMatchObject({
      status: "error",
      fieldErrors: {
        purpose: THANKYOU_ONLY_MESSAGE,
        page_eligibility: THANKYOU_ONLY_MESSAGE,
      },
    });
    // The invariant: the leak must be stopped BEFORE Supabase, not after.
    expect(upsert).toHaveBeenCalledTimes(0);
    expect(from).toHaveBeenCalledTimes(0);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid videoId with no write", async () => {
    const { from, upsert } = makeSupabaseStub({ user: USER });

    const result = await saveVideoProfile("not-a-uuid", validInput);

    expect(result).toEqual({
      status: "error",
      message: "That clip reference is not valid.",
    });
    expect(upsert).toHaveBeenCalledTimes(0);
    expect(from).toHaveBeenCalledTimes(0);
  });

  it("rejects entirely non-object input with a generic error and no write", async () => {
    const { upsert } = makeSupabaseStub({ user: USER });

    const result = await saveVideoProfile(VIDEO_ID, null);

    expect(result).toMatchObject({ status: "error" });
    expect(upsert).toHaveBeenCalledTimes(0);
  });

  it("upserts the PARSED payload verbatim on valid input (transforms applied, onConflict video_id)", async () => {
    const { from, upsert } = makeSupabaseStub({ user: USER });

    const result = await saveVideoProfile(VIDEO_ID, validInput);

    expect(result).toMatchObject({ status: "saved" });
    expect(from).toHaveBeenCalledWith("video_profiles");
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(
      {
        video_id: VIDEO_ID,
        purpose: ["process"],
        page_eligibility: ["feed", "world"],
        product_links: [PRODUCT_ID],
        mood: ["calm"],
        // "" in, null out — proves parsed.data (not the raw input) is written.
        anti_repetition_key: null,
      },
      { onConflict: "video_id" },
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/seller/clips/${VIDEO_ID}`,
    );
  });

  it("returns a session error and never writes when unauthenticated", async () => {
    const { from, upsert } = makeSupabaseStub({ user: null });

    const result = await saveVideoProfile(VIDEO_ID, validInput);

    expect(result).toEqual({
      status: "error",
      message: "Your session has ended — sign in again to save tags.",
    });
    expect(upsert).toHaveBeenCalledTimes(0);
    expect(from).toHaveBeenCalledTimes(0);
  });

  it("maps a Supabase upsert error to the friendly retry message (never throws)", async () => {
    const { upsert } = makeSupabaseStub({
      user: USER,
      upsertError: { code: "42501", message: "rls denial" },
    });
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const result = await saveVideoProfile(VIDEO_ID, validInput);

    expect(result).toEqual({
      status: "error",
      message: "We couldn't save just now — try again in a moment.",
    });
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
