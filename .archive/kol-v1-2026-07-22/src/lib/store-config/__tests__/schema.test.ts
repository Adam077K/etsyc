/**
 * P3 — store-config v1.3 validator invariants. One green + one red fixture
 * per invariant (spec: store-engine-spine.md ## P3 acceptance criteria).
 * Red assertions also check the error NAMES the exact failing key/id.
 */

import { describe, expect, it } from "vitest";

import { customStore } from "../fixtures/custom";
import { senaStore } from "../fixtures/sena";
import { CRITIC_PASS_THRESHOLD, validateStoreConfig } from "../schema";
import type { StoreConfig } from "../types";

const cloneSena = (): StoreConfig => structuredClone(senaStore);
const cloneCustom = (): StoreConfig => structuredClone(customStore);

function expectGreen(config: unknown): void {
  const result = validateStoreConfig(config);
  if (!result.ok) {
    throw new Error(
      `expected GREEN, got:\n${result.errors.map((e) => `${e.path}: ${e.message}`).join("\n")}`,
    );
  }
  expect(result.ok).toBe(true);
}

function expectReject(config: unknown, match: RegExp): void {
  const result = validateStoreConfig(config);
  expect(result.ok).toBe(false);
  if (!result.ok) {
    const rendered = result.errors.map((e) => `${e.path}: ${e.message}`).join("\n");
    expect(rendered).toMatch(match);
  }
}

describe("happy path — the two canonical fixtures", () => {
  it("validates the curated sena world GREEN", () => {
    expectGreen(senaStore);
  });

  it("validates the custom (D15) tinctura world GREEN", () => {
    expectGreen(customStore);
  });

  it("validates a minimal-but-valid config (optional blocks absent) GREEN", () => {
    const minimal: StoreConfig = {
      schemaVersion: "1.3",
      storeId: "st_min",
      maker: {
        id: "mk_min",
        displayName: "Min Maker",
        handle: "minmaker",
        craft: "paper folding",
        location: "Kyoto",
        bio: "Small things, folded slowly.",
        avatarMediaId: null,
        trust: {
          realMaker: { status: "unverified", verifiedAt: null, voiceAnchorClipId: null },
          aiTransparency: { level: "maker-authored", disclosure: "No AI involved.", aiAssistedFields: [] },
        },
      },
      theme: {
        kind: "curated",
        paletteId: "orchard",
        mode: "light",
        fontPairingId: "warm-serif",
        motionPreset: "hushed",
        radiusIdentity: "soft",
        density: "standard",
      },
      media: { clips: [], images: [] },
      products: [],
      voiceovers: [],
      blocks: [
        {
          id: "b_hero",
          type: "hero-video",
          variant: "full-bleed",
          order: 0,
          props: { showCraftLine: false },
          bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
        },
      ],
      meta: {
        version: 1,
        status: "draft",
        criticScore: 0,
        approvedSections: [],
        createdAt: "2026-07-20T00:00:00Z",
        updatedAt: "2026-07-20T00:00:00Z",
      },
    };
    expectGreen(minimal);
  });
});

describe("v1.3 shape — strict keys + schemaVersion", () => {
  it("rejects an unknown top-level key", () => {
    const config = { ...cloneSena(), promoBanner: "SALE" };
    expectReject(config, /promoBanner/);
  });

  it("rejects a stale schemaVersion", () => {
    const config = { ...cloneSena(), schemaVersion: "1.2" };
    expectReject(config, /schemaVersion must be "1\.3"/);
  });

  it("accepts the v1.3 thank-you maker-authored message (and rejects unknown props keys)", () => {
    const config = cloneSena();
    config.blocks.push({
      id: "b_thanks",
      type: "thank-you",
      variant: "text+media",
      order: 8,
      props: { message: "Thank you — every order keeps the kiln warm." },
      bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
    });
    expectGreen(config);

    const bad = cloneSena();
    bad.blocks.push({
      id: "b_thanks",
      type: "thank-you",
      variant: "text+media",
      order: 8,
      props: { aiMessage: "fabricated" } as never,
      bindings: { clipTags: [], imageIds: [], productIds: [], voiceoverIds: [] },
    });
    expectReject(bad, /aiMessage/);
  });
});

describe("v1.3 Wave-3 additive amendment — clips[].focalPoint + hero-video statement (P3-EXT)", () => {
  function heroBlock(config: StoreConfig) {
    const hero = config.blocks.find((b) => b.type === "hero-video");
    if (!hero || hero.type !== "hero-video") throw new Error("fixture must contain a hero");
    return hero;
  }

  // NON-BREAKING PROOF: both canonical stored-config fixtures predate the
  // amendment (no clips[].focalPoint, no statement anywhere) and must parse
  // GREEN *unchanged* — and round-trip identically: the parser must not
  // inject defaults into stored configs (the 0.5/0.5 default is the
  // RENDERER's, schema doc §2.3).
  it("parses both pre-amendment fixtures unchanged and round-trips them identically", () => {
    for (const fixture of [senaStore, customStore]) {
      const result = validateStoreConfig(structuredClone(fixture));
      if (!result.ok) {
        throw new Error(
          `expected GREEN, got:\n${result.errors.map((e) => `${e.path}: ${e.message}`).join("\n")}`,
        );
      }
      expect(result.config).toEqual(fixture);
      expect(fixture.media.clips.some((clip) => "focalPoint" in clip)).toBe(false);
    }
  });

  it("accepts clips[].focalPoint {x,y} in 0–1 range (green)", () => {
    const config = cloneSena();
    const clip = config.media.clips[0];
    if (!clip) throw new Error("fixture needs a clip");
    clip.focalPoint = { x: 0.5, y: 0.32 };
    expectGreen(config);
  });

  it("rejects an out-of-range focalPoint, naming the exact axis", () => {
    const config = cloneSena();
    const clip = config.media.clips[0];
    if (!clip) throw new Error("fixture needs a clip");
    clip.focalPoint = { x: 1.5, y: 0.5 };
    expectReject(config, /media\.clips\.0\.focalPoint\.x/);

    const config2 = cloneSena();
    const clip2 = config2.media.clips[0];
    if (!clip2) throw new Error("fixture needs a clip");
    clip2.focalPoint = { x: 0.5, y: -0.1 };
    expectReject(config2, /media\.clips\.0\.focalPoint\.y/);
  });

  it("rejects unknown keys inside focalPoint (strict object)", () => {
    const config = cloneSena();
    const clip = config.media.clips[0];
    if (!clip) throw new Error("fixture needs a clip");
    clip.focalPoint = { x: 0.5, y: 0.5, z: 0.5 } as never;
    expectReject(config, /media\.clips\.0\.focalPoint/);
  });

  it("images[].focalPoint stays REQUIRED — the asymmetry is deliberate, not harmonised", () => {
    const config = cloneSena();
    const image = config.media.images[0];
    if (!image) throw new Error("fixture needs an image");
    delete (image as { focalPoint?: unknown }).focalPoint;
    expectReject(config, /media\.images\.0\.focalPoint/);
  });

  it("accepts a maker-authored hero statement at exactly the 48-char cap (green)", () => {
    const config = cloneSena();
    heroBlock(config).props.statement = "a".repeat(48);
    expectGreen(config);

    const config2 = cloneSena();
    heroBlock(config2).props.statement = "Every glaze starts as swept ash.";
    expectGreen(config2);
  });

  it("rejects a 49-char statement, naming the cap", () => {
    const config = cloneSena();
    heroBlock(config).props.statement = "a".repeat(49);
    expectReject(config, /statement must be ≤ 48 chars/);
  });

  it('rejects an empty statement — omit the field rather than ""', () => {
    const config = cloneSena();
    heroBlock(config).props.statement = "";
    expectReject(config, /omit the field rather than ""/);
  });

  it("keeps hero-video props strict — an unknown key beside statement is still rejected", () => {
    const config = cloneSena();
    (heroBlock(config).props as Record<string, unknown>).aiStatement = "fabricated";
    expectReject(config, /aiStatement/);
  });
});

describe("theme — curated enum rails apply ONLY to kind:curated (D9/D15)", () => {
  it("rejects a non-enum curated paletteId, naming the key", () => {
    const config = cloneSena();
    (config.theme as { paletteId: string }).paletteId = "neon-vapor";
    expectReject(config, /theme\.paletteId must be a curated design-system v2 palette id/);
  });

  it("rejects a non-enum curated fontPairingId and motionPreset", () => {
    const config = cloneSena();
    (config.theme as { fontPairingId: string }).fontPairingId = "comic-sans-stack";
    expectReject(config, /theme\.fontPairingId/);

    const config2 = cloneSena();
    (config2.theme as { motionPreset: string }).motionPreset = "frantic";
    expectReject(config2, /theme\.motionPreset/);
  });

  it("never palette-caps a custom theme — any-hex roles outside curated palettes pass", () => {
    const config = cloneCustom();
    if (config.theme.kind !== "custom") throw new Error("fixture must be custom");
    config.theme.customPalette.roles.accent = "#FF00AA"; // nowhere near any curated set
    expectGreen(config);
  });

  it("rejects a non-hex custom palette role, naming the role", () => {
    const config = cloneCustom();
    if (config.theme.kind !== "custom") throw new Error("fixture must be custom");
    (config.theme.customPalette.roles as { accent: string }).accent = "ochre";
    expectReject(config, /theme\.customPalette\.roles\.accent.*hex color/);
  });
});

describe("structural invariant — exactly one hero-video", () => {
  it("rejects zero hero-video blocks", () => {
    const config = cloneSena();
    config.blocks = config.blocks.filter((b) => b.type !== "hero-video");
    expectReject(config, /exactly one hero-video block required.*found 0/);
  });

  it("rejects two hero-video blocks", () => {
    const config = cloneSena();
    const hero = config.blocks.find((b) => b.type === "hero-video");
    if (!hero) throw new Error("fixture must contain a hero");
    config.blocks.push({ ...structuredClone(hero), id: "b_hero_2", order: 99 });
    expectReject(config, /exactly one hero-video block required.*found 2/);
  });
});

describe("structural invariant — stable unique ids, order-significant blocks", () => {
  it("rejects duplicate block ids, naming the id", () => {
    const config = cloneSena();
    const cta = config.blocks.find((b) => b.type === "contact-cta");
    if (!cta) throw new Error("fixture must contain a cta");
    cta.id = "b_story";
    expectReject(config, /duplicate id "b_story" in blocks/);
  });

  it("rejects duplicate render order, naming both blocks", () => {
    const config = cloneSena();
    const cta = config.blocks.find((b) => b.type === "contact-cta");
    if (!cta) throw new Error("fixture must contain a cta");
    cta.order = 0;
    expectReject(config, /order 0 on block "b_cta" already used by block "b_hero"/);
  });

  it("keeps approvals pinned by id when blocks are reordered (green)", () => {
    const config = cloneSena();
    config.blocks = [...config.blocks].reverse().map((block, i) => ({ ...block, order: i }));
    expectGreen(config); // same ids, new order — approvedSections still resolve
  });
});

describe("referential integrity (OQ-2, validator-owned, in-object)", () => {
  it("rejects a dangling bindings.clipTags ref, naming clip + block", () => {
    const config = cloneSena();
    const hero = config.blocks.find((b) => b.type === "hero-video");
    if (!hero) throw new Error("fixture must contain a hero");
    hero.bindings.clipTags = ["clip_ghost"];
    expectReject(config, /"clip_ghost" does not resolve to any media\.clips\[\]\.id \(block "b_hero"\)/);
  });

  it("rejects a dangling bindings.productIds ref", () => {
    const config = cloneSena();
    const showcase = config.blocks.find((b) => b.type === "product-showcase");
    if (!showcase) throw new Error("fixture must contain a showcase");
    showcase.bindings.productIds = ["p_ridge_tumbler", "p_vanished"];
    expectReject(config, /"p_vanished" does not resolve to any products\[\]\.id/);
  });

  it("rejects a dangling clip videoProfile.productLinks ref", () => {
    const config = cloneSena();
    const clip = config.media.clips.find((c) => c.id === "clip_tumbler");
    if (!clip) throw new Error("fixture must contain clip_tumbler");
    clip.videoProfile.productLinks = ["p_deleted"];
    expectReject(config, /"p_deleted" does not resolve to any products\[\]\.id \(clip "clip_tumbler"\)/);
  });

  it("rejects a dangling product mediaIds / narrationClipTags ref", () => {
    const config = cloneSena();
    const product = config.products.find((p) => p.id === "p_ridge_tumbler");
    if (!product) throw new Error("fixture must contain the tumbler");
    product.mediaIds = ["img_missing"];
    expectReject(config, /"img_missing" does not resolve to any media\.images\[\]\.id/);

    const config2 = cloneSena();
    const product2 = config2.products.find((p) => p.id === "p_ridge_tumbler");
    if (!product2) throw new Error("fixture must contain the tumbler");
    product2.narrationClipTags = ["clip_missing"];
    expectReject(config2, /"clip_missing" does not resolve to any media\.clips\[\]\.id/);
  });

  it("rejects a dangling maker.avatarMediaId and voiceAnchorClipId", () => {
    const config = cloneSena();
    config.maker.avatarMediaId = "img_ghost";
    expectReject(config, /maker\.avatarMediaId "img_ghost" does not resolve/);

    const config2 = cloneSena();
    config2.maker.trust.realMaker.voiceAnchorClipId = "clip_ghost";
    expectReject(config2, /voiceAnchorClipId "clip_ghost" does not resolve/);
  });

  it('rejects realMaker.status "verified" with no voice anchor (D7 — never a false claim)', () => {
    const config = cloneSena();
    config.maker.trust.realMaker.voiceAnchorClipId = null;
    expectReject(config, /"verified" requires a resolved voiceAnchorClipId/);
  });

  it("rejects a dangling voiceovers[].elementRef block ref", () => {
    const config = cloneCustom();
    const vo = config.voiceovers[0];
    if (!vo) throw new Error("fixture must contain a voiceover");
    vo.elementRef = { kind: "block", id: "b_gone", field: null };
    expectReject(config, /voiceover "vo_vat" elementRef "b_gone" does not resolve to any blocks\[\]\.id/);
  });

  it("rejects a dangling meta.approvedSections id (approvals pin by block id)", () => {
    const config = cloneSena();
    config.meta.approvedSections = [...config.meta.approvedSections, "b_deleted"];
    expectReject(config, /"b_deleted" does not resolve to any blocks\[\]\.id/);
  });

  it("rejects duplicate media/product ids (references must resolve unambiguously)", () => {
    const config = cloneSena();
    const clip = config.media.clips[1];
    if (!clip) throw new Error("fixture must contain clips");
    clip.id = "clip_intro";
    expectReject(config, /duplicate id "clip_intro" in media\.clips/);
  });

  it("allows empty-of-media where optional — an unbound clip is fine (green)", () => {
    // clip_thanks is bound to no block in the sena fixture by design (D4×D5).
    expectGreen(cloneSena());
  });
});

describe('AA block-ground rule — midtone "c" is display-only', () => {
  it('rejects blockGround "c" on craft-story (body copy), naming the rule', () => {
    const config = cloneSena();
    const story = config.blocks.find((b) => b.type === "craft-story");
    if (!story) throw new Error("fixture must contain a craft-story");
    (story.props as { blockGround: string }).blockGround = "c";
    expectReject(config, /midtone "c" is display-only \(AA\)/);
  });

  it('rejects blockGround "c" on contact-cta (body copy)', () => {
    const config = cloneSena();
    const cta = config.blocks.find((b) => b.type === "contact-cta");
    if (!cta) throw new Error("fixture must contain a contact-cta");
    (cta.props as { blockGround: string }).blockGround = "c";
    expectReject(config, /midtone "c" is display-only \(AA\)/);
  });

  it('accepts blockGround "c" on display blocks (voice-quote, atmosphere)', () => {
    const config = cloneSena();
    const quote = config.blocks.find((b) => b.type === "voice-quote");
    const atmosphere = config.blocks.find((b) => b.type === "atmosphere");
    if (!quote || quote.type !== "voice-quote") throw new Error("fixture must contain a voice-quote");
    if (!atmosphere || atmosphere.type !== "atmosphere") throw new Error("fixture must contain an atmosphere");
    quote.props.blockGround = "c";
    atmosphere.props.blockGround = "c";
    expectGreen(config);
  });
});

describe("custom-theme gate — kind:custom cannot leave draft uncritiqued (D9→D15)", () => {
  it("rejects a custom theme leaving draft with a failing criticScore", () => {
    const config = cloneCustom();
    config.meta.status = "in_review";
    config.meta.criticScore = CRITIC_PASS_THRESHOLD - 0.01;
    expectReject(config, /may not leave meta\.status "draft" without a passing meta\.criticScore/);
  });

  it("accepts a custom theme still in draft with a failing criticScore (green)", () => {
    const config = cloneCustom();
    config.meta.status = "draft";
    config.meta.criticScore = 0;
    expectGreen(config);
  });

  it("accepts a custom theme leaving draft at exactly the pass threshold (green)", () => {
    const config = cloneCustom();
    config.meta.status = "published";
    config.meta.criticScore = CRITIC_PASS_THRESHOLD;
    expectGreen(config);
  });

  it("does not apply the gate to curated themes (green)", () => {
    const config = cloneSena();
    config.meta.status = "published";
    config.meta.criticScore = 0.1; // curated rails carry the guarantee, not the critic
    expectGreen(config);
  });
});

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstClip(config: StoreConfig) {
  const clip = config.media.clips[0];
  if (!clip) throw new Error("fixture needs a clip");
  return clip;
}

function firstImage(config: StoreConfig) {
  const image = config.media.images[0];
  if (!image) throw new Error("fixture needs an image");
  return image;
}

function firstVoiceover(config: StoreConfig) {
  const vo = config.voiceovers[0];
  if (!vo) throw new Error("fixture needs a voiceover");
  return vo;
}

describe("asset URL allowlist — https:// or root-relative only (QA cycle-2 F1)", () => {
  const maliciousUrls = [
    "javascript:alert(1)",
    "data:text/html,x",
    "vbscript:x",
    "//evil.com/x",
  ] as const;

  const urlFields: { key: string; set: (config: StoreConfig, value: string) => void }[] = [
    { key: "media.clips.0.src", set: (c, v) => { firstClip(c).src = v; } },
    { key: "media.clips.0.poster", set: (c, v) => { firstClip(c).poster = v; } },
    { key: "media.clips.0.captionsSrc", set: (c, v) => { firstClip(c).captionsSrc = v; } },
    { key: "media.images.0.src", set: (c, v) => { firstImage(c).src = v; } },
    { key: "voiceovers.0.src", set: (c, v) => { firstVoiceover(c).src = v; } },
  ];

  for (const { key, set } of urlFields) {
    for (const url of maliciousUrls) {
      it(`rejects "${url}" at ${key}, naming the exact key`, () => {
        const config = cloneSena();
        set(config, url);
        expectReject(config, new RegExp(`^${escapeRegExp(key)}: .*rejected`, "m"));
      });
    }
  }

  it("accepts https:// absolute URLs on all five fields (green)", () => {
    const config = cloneSena();
    for (const { set } of urlFields) set(config, "https://cdn.kol.example/media/a.mp4");
    expectGreen(config);
  });

  it("keeps captionsSrc nullable (green)", () => {
    const config = cloneSena();
    firstClip(config).captionsSrc = null;
    expectGreen(config);
  });

  it("still accepts root-relative fixture URLs (green — sena + custom unchanged)", () => {
    expectGreen(cloneSena());
    expectGreen(cloneCustom());
  });
});

describe("font family charset — no CSS metacharacters (QA cycle-2 F2)", () => {
  const injections = [
    "x; } body{display:none} .a{",
    "Arial'; background:url(//evil.com)",
  ] as const;

  function setFamily(
    config: StoreConfig,
    field: "displayFamily" | "textFamily",
    value: string,
  ): void {
    if (config.theme.kind !== "custom") throw new Error("fixture must be custom");
    config.theme.customPairing[field] = value;
  }

  for (const field of ["displayFamily", "textFamily"] as const) {
    for (const payload of injections) {
      it(`rejects CSS injection in ${field}, naming the field`, () => {
        const config = cloneCustom();
        setFamily(config, field, payload);
        expectReject(
          config,
          new RegExp(
            `^theme\\.customPairing\\.${field}: .*letters, digits, spaces, hyphens, or quotes`,
            "m",
          ),
        );
      });
    }
  }

  it('accepts catalog families "Fraunces" and "General Sans" (green)', () => {
    const config = cloneCustom();
    setFamily(config, "displayFamily", "Fraunces");
    setFamily(config, "textFamily", "General Sans");
    expectGreen(config);
  });

  // D15: international/foundry names are legitimate — Unicode letters pass.
  const foundryNames = [
    "Söhne",
    "Ogg",
    "Neue Größe",
    "Noto Sans JP",
    "Fraunces",
    "General Sans",
  ] as const;
  for (const name of foundryNames) {
    it(`accepts foundry name "${name}" on both fields (green)`, () => {
      const config = cloneCustom();
      setFamily(config, "displayFamily", name);
      setFamily(config, "textFamily", name);
      expectGreen(config);
    });
  }

  // Every CSS-breakout metacharacter stays blocked even next to Unicode letters.
  const cssMetachars = [";", "{", "}", "(", ")", ":", "<", ">", "/", "\\", "`", ","] as const;
  for (const ch of cssMetachars) {
    it(`rejects a family containing ${JSON.stringify(ch)}, naming the field`, () => {
      const config = cloneCustom();
      setFamily(config, "displayFamily", `Söhne${ch}X`);
      expectReject(
        config,
        /^theme\.customPairing\.displayFamily: .*letters, digits, spaces, hyphens, or quotes/m,
      );
    });
  }

  it("rejects a CSS font stack — comma means stack injection, makers give ONE family", () => {
    const config = cloneCustom();
    setFamily(config, "textFamily", "Arial, sans-serif");
    expectReject(
      config,
      /^theme\.customPairing\.textFamily: .*letters, digits, spaces, hyphens, or quotes/m,
    );
  });

  it("rejects a family name over 64 chars, naming the field", () => {
    const config = cloneCustom();
    setFamily(config, "displayFamily", "A".repeat(65));
    expectReject(config, /^theme\.customPairing\.displayFamily: .*64 chars/m);
  });
});
