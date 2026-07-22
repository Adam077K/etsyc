import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { ringCookieOptions } from "./select";
import { firstPartyCookieOptions } from "./session";

/**
 * The first-party cookie ATTRIBUTE canon (DECISIONS.md cookie convention —
 * the amendment that covered attributes, not just names, and then didn't
 * hold: four ring writers plus the middleware's kol_sid mint re-typed the
 * set independently, and browse's module-const froze NODE_ENV at import).
 * This suite is the compiler-enforced version of that prose:
 *
 *   1. the canonical set's SHAPE — asserted with toEqual, never
 *      toMatchObject: a partial matcher is how a stripped `secure` shipped
 *      (gate-2 F2). Cookie identity is (name, domain, path); `Secure` is
 *      not part of the key, so one diverged writer silently REPLACES the
 *      canonical cookie for every other writer.
 *   2. write-time NODE_ENV resolution — the SAME import must flip `secure`
 *      when the env changes. A module-scope freeze passes every
 *      fresh-import test and still ships secure:false in any process whose
 *      env resolves after module load.
 *   3. ONE function object — select.ts's ringCookieOptions is an alias of
 *      session.ts's firstPartyCookieOptions, never a second declaration
 *      (the split exists only because the edge runtime cannot import
 *      select.ts's server-only + engine graph).
 *   4. single declaration — every cookie writer (four ring writers AND the
 *      middleware mint) CALLS the canon; no writer file re-types the
 *      attributes. Source-conformance is the only assertion that catches a
 *      writer bypassing the canon with a byte-identical inline copy
 *      (behaviourally invisible today, drift tomorrow). Same house pattern
 *      as the film suite's CSS↔table pin.
 *
 * Per-writer BEHAVIOUR (the options object actually handed to jar.set)
 * stays pinned in each writer's own suite with independently-typed
 * literals — deliberately NOT imported from the canon there: if those
 * suites asserted against the canon itself, a canon-wide drift (say,
 * sameSite flipped in session.ts) would pass every test. The re-typed
 * EXPECTATIONS are the oracle; re-typed SOURCE was the defect.
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

/** The one declaration — middleware-safe (edge runtime, zod-only graph). */
const CANON_FILE = "src/lib/feed/session.ts";

/** Every ring writer in the tree — update HERE when a state adds one. */
const RING_WRITER_FILES = [
  "src/lib/feed/select.ts",
  "src/lib/grow/actions.ts",
  "src/lib/browse/select-browse-clip.ts",
  "src/lib/narration/actions.ts",
] as const;

/** The kol_sid mint — the middleware is the SOLE session-cookie writer. */
const SESSION_MINT_FILE = "src/lib/supabase/middleware.ts";

function sourceOf(file: string): string {
  // vitest runs with cwd = apps/kol (film-layer.test.tsx precedent)
  return readFileSync(join(process.cwd(), file), "utf8");
}

describe("firstPartyCookieOptions — the canonical attribute set", () => {
  it("is the exact F2-complete set — toEqual, no partial match", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(firstPartyCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });
  });

  it("resolves `secure` at WRITE time — the same import flips with NODE_ENV", () => {
    // deliberately NO vi.resetModules / fresh import: a module-scope
    // freeze (the pre-canon browse defect) passes the fresh-import version
    // of this test and fails this one
    vi.stubEnv("NODE_ENV", "test");
    expect(firstPartyCookieOptions().secure).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    expect(firstPartyCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });

  it("ringCookieOptions IS firstPartyCookieOptions — one function object, not an agreeing copy", () => {
    // an alias cannot drift; a second declaration that agrees today can
    expect(ringCookieOptions).toBe(firstPartyCookieOptions);
  });
});

describe("cookie writers — single declaration, no re-typed attribute sets", () => {
  it("every ring write passes ringCookieOptions() — never an inline object", () => {
    for (const file of RING_WRITER_FILES) {
      const source = sourceOf(file);
      // the write call itself uses the canon…
      expect(source, `${file} must write the ring with ringCookieOptions()`).toMatch(
        /\.set\(\s*FEED_RING_COOKIE,\s*value,\s*ringCookieOptions\(\)\s*,?\s*\)/,
      );
      // …and no OTHER ring write exists in the file (an added second write
      // with inline attributes would satisfy the match above and drift)
      const ringWrites = source.match(/\.set\(\s*FEED_RING_COOKIE/g) ?? [];
      expect(ringWrites, `${file} has exactly one ring write`).toHaveLength(1);
    }
  });

  it("the middleware mint passes firstPartyCookieOptions() — never an inline object", () => {
    const source = sourceOf(SESSION_MINT_FILE);
    expect(source, "the kol_sid mint uses the canon").toMatch(
      /\.set\(\s*FEED_SESSION_COOKIE,\s*crypto\.randomUUID\(\),[\s\S]*?firstPartyCookieOptions\(\)\s*,?\s*\)/,
    );
    const mints = source.match(/\.set\(\s*FEED_SESSION_COOKIE/g) ?? [];
    expect(mints, "exactly one kol_sid mint").toHaveLength(1);
    expect(source, "middleware imports the canon from lib/feed/session").toMatch(
      /import \{[^}]*firstPartyCookieOptions[^}]*\} from "@\/lib\/feed\/session"/,
    );
  });

  it("the attributes are DECLARED exactly once, in the canon file", () => {
    // the canon declares…
    const canon = sourceOf(CANON_FILE);
    expect(canon.match(/httpOnly/g), `${CANON_FILE} declares the set once`).toHaveLength(1);
    expect(canon).toMatch(/export function firstPartyCookieOptions\(\)/);

    // …select.ts ALIASES it (an aliased import + export, never a second
    // declaration)…
    const select = sourceOf("src/lib/feed/select.ts");
    expect(select).toMatch(
      /import \{ firstPartyCookieOptions as ringCookieOptions \} from "\.\/session"/,
    );
    expect(select).toMatch(/export \{ ringCookieOptions \}/);

    // …and NO writer file carries attribute literals — not even a copy
    // that agrees today
    for (const file of [...RING_WRITER_FILES, SESSION_MINT_FILE]) {
      const source = sourceOf(file);
      expect(
        source.match(/httpOnly/g) ?? [],
        `${file} must not re-type the attribute set`,
      ).toHaveLength(0);
    }

    // the three action-boundary writers import the alias from select
    for (const file of RING_WRITER_FILES.filter((f) => f !== "src/lib/feed/select.ts")) {
      expect(sourceOf(file), `${file} imports the canon from lib/feed/select`).toMatch(
        /import \{[^}]*ringCookieOptions[^}]*\} from "@\/lib\/feed\/select"/,
      );
    }
  });
});
