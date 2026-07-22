import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { StoreConfigSchema } from "../schema";

/**
 * SEED-W3 contract guard — the Wave-3 seed (supabase/seed/002_w3_seed_worlds.sql)
 * embeds five store-config jsonb documents ($cfg$-delimited): four published
 * maker worlds + one unpublished RLS-probe store. The DB cannot validate jsonb
 * shape (ADR-0001 OQ-2), so this test keeps every embedded config honest
 * against the shipped v1.3 Zod contract. If a hand edit to the seed SQL breaks
 * the contract, this fails before staging does.
 */
const SEED_SQL = resolve(
  __dirname,
  "../../../../../..",
  "supabase/seed/002_w3_seed_worlds.sql",
);

describe("002_w3_seed_worlds.sql embedded configs", () => {
  const sql = readFileSync(SEED_SQL, "utf8");
  const configs = [...sql.matchAll(/\$cfg\$([\s\S]*?)\$cfg\$::jsonb/g)].map(
    // capture group 1 always exists for a match; "" would fail JSON.parse loudly
    (m) => JSON.parse(m[1] ?? ""),
  );

  it("embeds exactly five configs: four published worlds + one draft probe", () => {
    expect(configs).toHaveLength(5);
    const statuses = configs.map((c) => c.meta.status);
    expect(statuses.filter((s) => s === "published")).toHaveLength(4);
    expect(statuses.filter((s) => s === "draft")).toHaveLength(1);
  });

  it("every embedded config passes StoreConfigSchema.parse()", () => {
    for (const config of configs) {
      expect(() => StoreConfigSchema.parse(config)).not.toThrow();
    }
  });

  it("meta.criticScore is a number on every config (never the null conflict)", () => {
    for (const config of configs) {
      expect(typeof config.meta.criticScore).toBe("number");
    }
  });

  it("every clip id resolves to a videos-table id in the same seed (OQ-2)", () => {
    // the videos INSERT section carries every canonical clip uuid
    const videosSection = sql.slice(
      sql.indexOf("insert into public.videos"),
      sql.indexOf("insert into public.video_profiles"),
    );
    for (const config of configs) {
      for (const clip of config.media.clips) {
        expect(videosSection).toContain(`'${clip.id}'`);
      }
    }
  });

  it("every clip carries a focalPoint (four-aspect crop requirement)", () => {
    for (const config of configs) {
      for (const clip of config.media.clips) {
        expect(clip.focalPoint).toBeDefined();
      }
    }
  });
});
