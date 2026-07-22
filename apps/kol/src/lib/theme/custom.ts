/**
 * Custom theme path — D15 seller-brand freedom. The 7 any-hex roles +
 * customPairing are emitted onto the SAME variable names the curated path
 * uses, so blocks are agnostic to theme.kind. Roles map:
 *   bg→--ground · surface→--surface · ink→--ink · inkMuted→--muted ·
 *   border→--line · accent→--accent · accentInk→--accent-ink
 *
 * Vars the 7-role palette doesn't carry are DERIVED deterministically here
 * (documented fallbacks — the AI pipeline §5.4 may later emit richer sets,
 * and the AA gate, not this file, is the accessibility guarantee for custom):
 *   --accent-2      → accent (single-accent brand until the pipeline derives more)
 *   --on-media      → the palette's lightest text role (over a dark scrim)
 *   --block-a       → accent ground with accentInk type
 *   --block-b       → inverted band (ink ground, bg type)
 *   --block-c       → accent again (no third ground in a 7-role brand)
 */

import type { CustomTheme } from "@/lib/store-config/types";
import type { ThemeVars } from "./curated";
import { densitySectionGap, nameplateRegisters, radiusIdentities } from "./tokens";

/**
 * Hosted-font-catalog family → the stack that actually resolves at runtime.
 * next/font-loaded faces register under hashed family names, so a raw
 * `"Fraunces"` would silently fall back to system-ui — those map to their
 * next/font CSS variables. Fontshare-CSS faces register under their real
 * names and pass through quoted. Unknown families (catalog grows with the
 * pipeline §5.5) pass through quoted too — worst case is the system stack.
 */
export const fontCatalog: Record<string, string> = {
  Fraunces: "var(--font-fraunces)",
  "Bricolage Grotesque": "var(--font-bricolage)",
  "Geist Mono": "var(--font-geist-mono)",
  "JetBrains Mono": "var(--font-jetbrains-mono)",
  "Space Mono": "var(--font-space-mono)",
  "Clash Display": '"Clash Display"',
  "General Sans": '"General Sans"',
  Satoshi: '"Satoshi"',
  "Cabinet Grotesk": '"Cabinet Grotesk"',
};

export function resolveFamily(family: string, fallback: string): string {
  const resolved = fontCatalog[family] ?? `"${family}"`;
  return `${resolved}, ${fallback}`;
}

export function customThemeVars(theme: CustomTheme): ThemeVars {
  const { mode, roles } = theme.customPalette;
  const pairing = theme.customPairing;
  const radius = radiusIdentities[theme.radiusIdentity];

  // Over film sits behind a dark scrim → use the light-reading role:
  // dark-mode ink is light; light-mode surface is near-white.
  const onMedia = mode === "dark" ? roles.ink : roles.surface;

  return {
    "--ground": roles.bg,
    "--surface": roles.surface,
    "--ink": roles.ink,
    "--muted": roles.inkMuted,
    "--line": roles.border,
    "--accent": roles.accent,
    "--accent-2": roles.accent,
    // accent/accentInk is a pipeline-derived pair — the deterministic WCAG-AA
    // gate (schema §2.2) guarantees it, so the CTA uses it untouched
    "--accent-cta": roles.accent,
    "--accent-ink": roles.accentInk,
    "--on-media": onMedia,
    "--block-a": roles.accent,
    "--on-block-a": roles.accentInk,
    "--block-b": roles.ink,
    "--on-block-b": roles.bg,
    "--block-c": roles.accent,
    "--on-block-c": roles.accentInk,
    "--scrim": `linear-gradient(to top, color-mix(in oklab, ${roles.bg} 45%, black) 0%, transparent 55%)`,
    // solid text-backdrop scrim — same contract as the curated path (the
    // hero chrome band paints this opaque under set lines; gate-2 / I5).
    // keep=40% in oklab bounds the result's luminance ≤ ~0.06 for ANY hex
    // bg, so the custom AA gate on on-media is what carries the guarantee.
    "--scrim-strong": `color-mix(in oklab, ${roles.bg} 40%, black)`,
    // customPairing — families from the hosted font catalog (pipeline §5.5),
    // mapped through the catalog so next/font faces actually resolve
    "--font-display": resolveFamily(pairing.displayFamily, "system-ui, sans-serif"),
    "--font-text": resolveFamily(pairing.textFamily, "system-ui, sans-serif"),
    "--font-mono": "var(--font-geist-mono), ui-monospace, monospace",
    "--weight-display": String(pairing.displayWeight),
    "--weight-text": String(pairing.textWeight),
    // nameplate register (§2.1a): custom pairings MAY declare strokeClass
    // at authoring time (v1.3 additive-optional field); absent takes the
    // `uniform` fail-safe — the LOWER-mass treatment (an undeclared seller
    // face that turns out modulated renders slightly quieter than it could;
    // the reverse miss is the logotype-stamp failure §2.1a exists to
    // prevent). Never a renderer branch on a font name.
    "--nameplate-size": nameplateRegisters[pairing.strokeClass ?? "uniform"].size,
    "--nameplate-weight": nameplateRegisters[pairing.strokeClass ?? "uniform"].weight,
    "--nameplate-tracking": nameplateRegisters[pairing.strokeClass ?? "uniform"].tracking,
    "--radius-sm": radius.sm,
    "--radius-md": radius.md,
    "--radius-lg": radius.lg,
    "--space-section": densitySectionGap[theme.density],
  };
}
