/**
 * Design-system v2 curated token data — the 5 palettes (light+dark incl.
 * block-ground sets), 4 font pairings, 4 motion presets, 3 radius identities,
 * 2 densities. Source of truth: docs/03-system-design/KOL-design-system.md §§1–4.
 * Hex values are transcribed verbatim; AA notes carried where the doc scopes
 * a ground to large-text-only.
 *
 * THE D9→D15 REFRAME — read before "fixing" anything here:
 * These rails are FIXED for KOL's own product UI and hand-built curated
 * worlds, and STARTING POINTS for sellers — NOT a cap. Palette-capping a
 * `theme.kind:"custom"` shop is FORBIDDEN (D15); a custom shop's anti-slop
 * guarantee is the AA gate + auto-critic (P9) + maker approval (P10), never
 * these enums. Tokens live in `stores.config.theme` (jsonb) — there is NO
 * design_tokens table, and no table proposal is accepted.
 *
 * Enum membership is single-sourced from store-config v1.3: the id types come
 * from `@/lib/store-config/types` and the registries below are runtime-locked
 * against `@/lib/store-config/schema` tuples in `rails.test.ts` — no drift.
 */

import type {
  Density,
  FontPairingId,
  MotionPreset,
  PaletteId,
  RadiusIdentity,
  ThemeMode,
} from "@/lib/store-config/types";

// ---------------------------------------------------------------------------
// Palettes (§2)
// ---------------------------------------------------------------------------

export interface PaletteModeTokens {
  ground: string;
  surface: string;
  ink: string;
  muted: string;
  line: string;
  accent: string;
  accent2: string;
  /** Optional third accent — only palettes with three-way play (bazaar). */
  accent3?: string;
  onMedia: string;
}

export interface BlockGroundSet {
  blockA: string;
  onBlockA: string;
  blockB: string;
  onBlockB: string;
  /** Midtone -c grounds in sunbaked/cuberto-noir are LARGE-TEXT-ONLY (§2 AA note). */
  blockC: string;
  onBlockC: string;
}

export interface Palette {
  id: PaletteId;
  light: PaletteModeTokens;
  dark: PaletteModeTokens;
  /** One block set per palette, shared across modes (§2). */
  blocks: BlockGroundSet;
  /** The pairing bound to this palette (§3 — not a free cross-product). */
  boundPairing: FontPairingId;
}

export const palettes: Record<PaletteId, Palette> = {
  // §2.1 — warm, human, sun-drenched (Kotn × Faire)
  sunbaked: {
    id: "sunbaked",
    light: {
      ground: "#F6EFE3", surface: "#FFFBF3", ink: "#221C15", muted: "#6F6153",
      line: "#E7DCC8", accent: "#C64A2C", accent2: "#3E7E8C", onMedia: "#FBF3E8",
    },
    dark: {
      ground: "#191510", surface: "#221D16", ink: "#F1EADD", muted: "#A79A88",
      line: "#332C23", accent: "#E0714E", accent2: "#6FA9B4", onMedia: "#FBF3E8",
    },
    blocks: {
      blockA: "#B8452A", onBlockA: "#FBF3E8",
      blockB: "#5F6B33", onBlockB: "#FBF3E8",
      blockC: "#4C93A8", onBlockC: "#FBF3E8", // large-text-only (≈3.1:1)
    },
    boundPairing: "statement-grotesk",
  },
  // §2.2 — brave marketplace color-blocking (Faire)
  "market-plum": {
    id: "market-plum",
    light: {
      ground: "#F4EFE9", surface: "#FCF8F3", ink: "#2A1D22", muted: "#75655F",
      line: "#E6DBD0", accent: "#7A2E4A", accent2: "#C6902F", onMedia: "#FBF4EC",
    },
    dark: {
      ground: "#1B1418", surface: "#251B21", ink: "#F3E9E5", muted: "#B39EA0",
      line: "#38272F", accent: "#B85A76", accent2: "#DDA84E", onMedia: "#FBF4EC",
    },
    blocks: {
      blockA: "#4A2036", onBlockA: "#F3DCE6",
      blockB: "#C6902F", onBlockB: "#2A1D0A",
      blockC: "#E88B6E", onBlockC: "#3A160E",
    },
    boundPairing: "warm-serif",
  },
  // §2.3 — modern, dark↔light, 3D-forward (Cuberto/Lusion). Dark is primary.
  "cuberto-noir": {
    id: "cuberto-noir",
    light: {
      ground: "#F3F1EC", surface: "#FCFAF5", ink: "#16161A", muted: "#6C6A66",
      line: "#E4E1D9", accent: "#C6432A", accent2: "#3157C4", onMedia: "#F5F3EF",
    },
    dark: {
      ground: "#111113", surface: "#1B1C1F", ink: "#F2F0EC", muted: "#9A9791",
      line: "#2A2B2F", accent: "#E85C3A", accent2: "#3D6CE0", onMedia: "#F5F3EF",
    },
    blocks: {
      blockA: "#0E0E10", onBlockA: "#F2F0EC",
      blockB: "#F4F2ED", onBlockB: "#16161A",
      blockC: "#3D6CE0", onBlockC: "#F5F5FF", // large-text-only (≈4.4:1)
    },
    boundPairing: "modern-mono-grotesk",
  },
  // §2.4 — fresh, botanical, alive
  orchard: {
    id: "orchard",
    light: {
      ground: "#F1F5EC", surface: "#FBFCF7", ink: "#1D241A", muted: "#5E6B57",
      line: "#DDE5D3", accent: "#3F7A3E", accent2: "#A83B58", onMedia: "#F3F7EC",
    },
    dark: {
      ground: "#141A13", surface: "#1D251B", ink: "#E9EFE1", muted: "#93A08A",
      line: "#2A3327", accent: "#6FA35F", accent2: "#CE6A83", onMedia: "#F3F7EC",
    },
    blocks: {
      blockA: "#274A2A", onBlockA: "#E9F2E4",
      blockB: "#8E3B52", onBlockB: "#F7E4EA",
      blockC: "#C7D66A", onBlockC: "#26300E",
    },
    boundPairing: "statement-grotesk",
  },
  // §2.5 — saturated, ornate, maximal (the loud pole)
  bazaar: {
    id: "bazaar",
    light: {
      ground: "#F7ECE0", surface: "#FDF6EC", ink: "#2A1220", muted: "#7A5A54",
      line: "#E7D3C0", accent: "#C2452D", accent2: "#1F6F6B", accent3: "#D8A24A",
      onMedia: "#FBEFE0",
    },
    dark: {
      ground: "#241028", surface: "#31183A", ink: "#F6E9D8", muted: "#C7A6B8",
      line: "#43254D", accent: "#E0623F", accent2: "#2E9A93", accent3: "#E7B45C",
      onMedia: "#FBEFE0",
    },
    blocks: {
      blockA: "#7A1E3C", onBlockA: "#F9DCE6",
      blockB: "#1F6F6B", onBlockB: "#EAF7F5",
      blockC: "#D8A24A", onBlockC: "#2A1004",
    },
    boundPairing: "character-maximal",
  },
};

export function getPaletteTokens(id: PaletteId, mode: ThemeMode): PaletteModeTokens {
  return palettes[id][mode];
}

// ---------------------------------------------------------------------------
// Font pairings (§3) — display + text + mono. No Inter, anywhere.
// Families resolve via next/font CSS variables loaded in app/layout.tsx
// (Fontshare faces via their hosted CSS; Google faces via next/font/google).
// ---------------------------------------------------------------------------

export interface FontPairing {
  id: FontPairingId;
  /** font-family stacks referencing the loaded @font-face / next-font vars */
  display: string;
  text: string;
  mono: string;
  displayWeight: number;
  textWeight: number;
}

export const fontPairings: Record<FontPairingId, FontPairing> = {
  // §3.1 — Kotn energy. For sunbaked, orchard.
  "statement-grotesk": {
    id: "statement-grotesk",
    display: '"Clash Display", var(--font-bricolage), system-ui, sans-serif',
    text: '"General Sans", system-ui, sans-serif',
    mono: "var(--font-geist-mono), ui-monospace, monospace",
    displayWeight: 700,
    textWeight: 400,
  },
  // §3.2 — Faire warmth, Fraunces set BIG. For market-plum.
  "warm-serif": {
    id: "warm-serif",
    display: 'var(--font-fraunces), "Fraunces", Georgia, serif',
    text: '"Satoshi", system-ui, sans-serif',
    mono: "var(--font-geist-mono), ui-monospace, monospace",
    displayWeight: 650,
    textWeight: 400,
  },
  // §3.3 — Cuberto polish. For cuberto-noir.
  "modern-mono-grotesk": {
    id: "modern-mono-grotesk",
    display: '"Cabinet Grotesk", system-ui, sans-serif',
    text: '"Satoshi", system-ui, sans-serif',
    mono: "var(--font-jetbrains-mono), ui-monospace, monospace",
    displayWeight: 800,
    textWeight: 400,
  },
  // §3.4 — the maximal pole. For bazaar.
  "character-maximal": {
    id: "character-maximal",
    display: 'var(--font-bricolage), "Bricolage Grotesque", system-ui, sans-serif',
    text: '"Satoshi", system-ui, sans-serif',
    mono: "var(--font-space-mono), ui-monospace, monospace",
    displayWeight: 700,
    textWeight: 400,
  },
};

// ---------------------------------------------------------------------------
// Motion presets (§4.5) — a DIAL. The signature liquid/depth-3d beats are
// Phase 6; presets carry the fields now so `liquid`/`dimensional` worlds
// never error, with the beat stubbed to "none-yet".
// ---------------------------------------------------------------------------

export interface MotionPresetSpec {
  id: MotionPreset;
  /** MOTION_INTENSITY dial value (§0 baseline dials). */
  dial: 3 | 5 | 7 | 8;
  /** Scroll reveals (§4.2) — every preset has them. */
  reveals: boolean;
  /** The cinematic world-unfold (§4.3) — hushed skips it. */
  cinematicUnfold: boolean;
  /** The one signature beat per world (§4.5). Stubbed until Phase 6. */
  signature: "none" | "liquid" | "depth-3d";
  /** Phase-6 gate: signature beats are token-stubbed, not implemented. */
  signatureImplemented: false;
}

export const motionPresets: Record<MotionPreset, MotionPresetSpec> = {
  hushed: { id: "hushed", dial: 3, reveals: true, cinematicUnfold: false, signature: "none", signatureImplemented: false },
  fluid: { id: "fluid", dial: 5, reveals: true, cinematicUnfold: true, signature: "none", signatureImplemented: false },
  liquid: { id: "liquid", dial: 7, reveals: true, cinematicUnfold: true, signature: "liquid", signatureImplemented: false },
  dimensional: { id: "dimensional", dial: 8, reveals: true, cinematicUnfold: true, signature: "depth-3d", signatureImplemented: false },
};

// ---------------------------------------------------------------------------
// Radius identities (§1.3) + density (§1.2 rhythm)
// ---------------------------------------------------------------------------

export const radiusIdentities: Record<RadiusIdentity, { sm: string; md: string; lg: string }> = {
  sharp: { sm: "0px", md: "0px", lg: "2px" },
  soft: { sm: "8px", md: "16px", lg: "24px" },
  round: { sm: "12px", md: "24px", lg: "36px" },
};

/** Section vertical rhythm — airy breathes wider (§1.2). */
export const densitySectionGap: Record<Density, string> = {
  airy: "var(--space-20)",
  standard: "var(--space-16)",
};
