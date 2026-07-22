import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { ringCookieOptions } from "./select";

/**
 * The ring-cookie ATTRIBUTE canon (DECISIONS.md cookie convention — the
 * amendment that covered attributes, not just names, and then didn't hold:
 * four writers re-typed the set independently, and browse's module-const
 * froze NODE_ENV at import). This suite is the compiler-enforced version
 * of that prose:
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
 *   3. single declaration — every ring writer CALLS ringCookieOptions();
 *      no writer file re-types the attributes. Source-conformance is the
 *      only assertion that catches a writer bypassing the canon with a
 *      byte-identical inline copy (behaviourally invisible today, drift
 *      tomorrow). Same house pattern as the film suite's CSS↔table pin.
 *
 * Per-writer BEHAVIOUR (the options object actually handed to jar.set)
 * stays pinned in each writer's own suite with independently-typed
 * literals — deliberately NOT imported from the canon there: if those
 * suites asserted against ringCookieOptions() itself, a canon-wide drift
 * (say, sameSite flipped in select.ts) would pass every test. The
 * re-typed EXPECTATIONS are the oracle; re-typed SOURCE was the defect.
 */

afterEach(() => {
  vi.unstubAllEnvs();
});

/** Every ring writer in the tree — update HERE when a state adds one. */
const RING_WRITER_FILES = [
  "src/lib/feed/select.ts",
  "src/lib/grow/actions.ts",
  "src/lib/browse/select-browse-clip.ts",
  "src/lib/narration/actions.ts",
] as const;

const CANON_FILE = "src/lib/feed/select.ts";

function sourceOf(file: string): string {
  // vitest runs with cwd = apps/kol (film-layer.test.tsx precedent)
  return readFileSync(join(process.cwd(), file), "utf8");
}

describe("ringCookieOptions — the canonical attribute set", () => {
  it("is the exact F2-complete set — toEqual, no partial match", () => {
    vi.stubEnv("NODE_ENV", "test");
    expect(ringCookieOptions()).toEqual({
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
    expect(ringCookieOptions().secure).toBe(false);
    vi.stubEnv("NODE_ENV", "production");
    expect(ringCookieOptions()).toEqual({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
    });
  });
});

describe("ring writers — single declaration, no re-typed attribute sets", () => {
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

  it("the attributes are DECLARED exactly once, in the canon file", () => {
    for (const file of RING_WRITER_FILES) {
      const source = sourceOf(file);
      const declarations = source.match(/httpOnly/g) ?? [];
      if (file === CANON_FILE) {
        // the one declaration lives beside FEED_RING_COOKIE
        expect(declarations, `${CANON_FILE} declares the set once`).toHaveLength(1);
        expect(source).toMatch(/export function ringCookieOptions\(\)/);
      } else {
        // importers carry NO attribute literals — not even an agreeing copy
        expect(declarations, `${file} must not re-type the attribute set`).toHaveLength(0);
        expect(source, `${file} imports the canon from lib/feed/select`).toMatch(
          /import \{[^}]*ringCookieOptions[^}]*\} from "@\/lib\/feed\/select"/,
        );
      }
    }
  });
});
