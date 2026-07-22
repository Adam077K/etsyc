/**
 * Fail-safe-hunt finding #1 — the fontCatalog `??` quoted-passthrough
 * resolving to faces the app never loads is SILENT: the ferreirapress seed
 * world declared "Space Grotesk" + "Source Serif 4" (neither cataloged nor
 * loaded) and rendered its entire type system in the system stack with
 * every test green. This suite makes that class loud:
 *
 *  - every custom pairing we author (fixtures AND seed worlds) must declare
 *    catalog faces — a family outside the catalog fails HERE, not on a
 *    buyer's screen;
 *  - the passthrough semantics for unknown families are pinned explicitly,
 *    so the fallback is a documented behavior, not an accident.
 *
 * Whether the RUNTIME should reject unknown families loudly instead of
 * falling through to the system stack is a catalog-scope decision (§5.5 —
 * the catalog grows with the seller pipeline); flagged, not decided here.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { customStore } from "@/lib/store-config/fixtures/custom";
import { fontCatalog, resolveFamily } from "./custom";

/** Families the app actually serves (next/font/google + Fontshare CSS). */
const catalogFamilies = Object.keys(fontCatalog);

/** Parse every $cfg$-quoted store config out of the seed SQL. */
function seedConfigs(): Array<{ handle: string; theme: Record<string, unknown> }> {
  const sql = readFileSync(
    join(__dirname, "../../../../../supabase/seed/002_w3_seed_worlds.sql"),
    "utf8",
  );
  const configs: Array<{ handle: string; theme: Record<string, unknown> }> = [];
  const blocks = sql.split("$cfg$");
  // odd indices are the dollar-quoted JSON payloads
  for (let i = 1; i < blocks.length; i += 2) {
    const payload = blocks[i];
    if (payload === undefined) continue;
    const parsed = JSON.parse(payload) as {
      maker?: { handle?: string };
      theme?: Record<string, unknown>;
    };
    const handle =
      (parsed as { storeId?: string }).storeId ?? parsed.maker?.handle ?? `block-${i}`;
    if (parsed.theme) configs.push({ handle: String(handle), theme: parsed.theme });
  }
  return configs;
}

describe("font catalog — declared families must be faces the app serves", () => {
  it("noor fixture (custom) declares only catalog families", () => {
    const theme = customStore.theme;
    if (theme.kind !== "custom") throw new Error("noor fixture must be custom-themed");
    expect(catalogFamilies).toContain(theme.customPairing.displayFamily);
    expect(catalogFamilies).toContain(theme.customPairing.textFamily);
  });

  it("every custom seed world declares only catalog families (the ferreirapress defect can't return)", () => {
    const customs = seedConfigs().filter((c) => c.theme.kind === "custom");
    expect(customs.length).toBeGreaterThanOrEqual(2); // isoldeglass + ferreirapress
    for (const { handle, theme } of customs) {
      const pairing = theme.customPairing as { displayFamily: string; textFamily: string };
      expect(catalogFamilies, `${handle} displayFamily "${pairing.displayFamily}"`).toContain(
        pairing.displayFamily,
      );
      expect(catalogFamilies, `${handle} textFamily "${pairing.textFamily}"`).toContain(
        pairing.textFamily,
      );
    }
  });

  it("catalog families resolve to loaded stacks; unknown families take the DOCUMENTED quoted passthrough", () => {
    // declared path: a catalog face resolves through its mapping
    expect(resolveFamily("Fraunces", "serif")).toBe("var(--font-fraunces), serif");
    expect(resolveFamily("Clash Display", "sans-serif")).toBe('"Clash Display", sans-serif');
    // stripped path: an off-catalog face passes through quoted — worst case
    // the system stack. Pinned so the semantics are explicit; whether this
    // should instead reject loudly is the flagged §5.5 catalog decision.
    expect(resolveFamily("Comic Sans MS", "sans-serif")).toBe('"Comic Sans MS", sans-serif');
  });
});
