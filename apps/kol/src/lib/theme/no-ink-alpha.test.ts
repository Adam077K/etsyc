/**
 * Guard — no opacity modifier on any ink token, anywhere in src/
 * (docs/06-design/KOL-wave3-aa-fix-muted.md §3 Fix A).
 *
 * Why: Tailwind slash-opacity on an ink token composites a color nobody
 * designed and nobody audited. EmptyPrompt's `text-muted` at 80% over
 * `bg-surface/60` landed at 3.63:1 — below AA body — in 8 of the 10
 * palette-modes, while the token itself passed everywhere. On any ground,
 * hierarchy comes from the TYPE SCALE, not a second alpha (the same rule
 * groundStyle() in blocks/shared.tsx learned in QA cycle 2).
 *
 * Background-token alphas (bg-surface/60, bg-surface/85, bg-accent/90 …)
 * stay: they are backdrops, and aa-audit measures full-opacity ink against
 * them.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// Ink tokens (design-system §2 token contract). `accent[a-z0-9-]*` also
// catches accent-2/accent-3/accent-cta/accent-ink. Alpha is a bare number
// (text-muted/80) or an arbitrary value (text-muted/[0.8]). Non-global
// source; call sites build their own instance so lastIndex never leaks.
const INK_ALPHA_SRC =
  "(?:^|[^a-z0-9-])(text-(?:ink|muted|on-media|on-block-[abc]|accent[a-z0-9-]*)\\/(?:\\d+|\\[[^\\]]+\\]))";
const inkAlpha = (flags = "") => new RegExp(INK_ALPHA_SRC, flags);

const SRC_ROOT = fileURLToPath(new URL("../..", import.meta.url));

/** All .ts/.tsx under src/, minus test files (they don't ship UI — and this
 *  file would match its own self-test fixtures). */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    if (!/\.tsx?$/.test(entry.name) || /\.test\.tsx?$/.test(entry.name)) return [];
    return [full];
  });
}

function violationsIn(file: string): string[] {
  return readFileSync(file, "utf8")
    .split("\n")
    .flatMap((line, i) =>
      [...line.matchAll(inkAlpha("g"))].map(
        (m) => `${file.slice(SRC_ROOT.length)}:${i + 1} ${m[1]}`,
      ),
    );
}

describe("no opacity modifier on ink tokens", () => {
  it("src/ contains zero text-<ink-token>/<alpha> class usages", () => {
    const violations = sourceFiles(SRC_ROOT).flatMap(violationsIn);
    // A hit here means a composited, un-audited ink color. Do NOT weaken the
    // token or this regex — drop the alpha and get hierarchy from the type
    // scale (text-caption vs text-body), per the fix doc.
    expect(violations).toEqual([]);
  });

  it("the pattern itself catches the defect shapes and spares legal ones", () => {
    // Fixtures built by concatenation so this file never contains a literal
    // violation (it is excluded from the scan, but belt and braces).
    const alpha = "/80";
    const banned = [
      `text-muted${alpha}`,
      `text-ink${alpha}`,
      `hover:text-on-media/90`,
      `md:text-on-block-a/75`,
      `text-accent-2/50`,
      `text-accent-cta/60`,
      `text-muted/[0.8]`,
    ];
    const legal = [
      "text-muted", // full-opacity ink — the correct form
      "bg-surface/60", // backdrop alphas are measured and allowed
      "bg-ink/5", // ink used as a background wash, not as type
      "text-body/80", // type-scale utility: slash is line-height, not alpha
    ];
    for (const cls of banned) expect(cls).toMatch(inkAlpha());
    for (const cls of legal) expect(cls).not.toMatch(inkAlpha());
  });
});
