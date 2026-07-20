import type { Config } from "tailwindcss";

/**
 * token name → `rgb(from var(--name) r g b / <alpha-value>)` color entries.
 *
 * BROWSER FLOOR: CSS relative color (`rgb(from …)`) needs Chrome/Edge 119+,
 * Safari 16.4+, Firefox 128+. Acceptable for the desktop-first MVP (concept
 * lock D1); revisit with a channel-triplet fallback if analytics ever show
 * older engines.
 */
function tokenColors(names: string[]): Record<string, string> {
  return Object.fromEntries(
    names.map((name) => [name, `rgb(from var(--${name}) r g b / <alpha-value>)`]),
  );
}

/**
 * KOL Tailwind theme — every utility maps onto the design-system-v2 CSS custom
 * properties (docs/03-system-design/KOL-design-system.md). Per-world values
 * (palette, pairing, radius identity, density) are applied at the world root by
 * `applyTheme` (src/lib/theme/apply-theme.ts); global tokens live in globals.css.
 * Curated and custom themes converge on the SAME variable names, so utilities
 * never know which kind of world they are painting.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // palette contract (design-system §2 token contract).
        // CSS relative color wraps every var so Tailwind slash-opacity
        // (bg-surface/85, text-on-media/90, hover:bg-accent/90 …) composes
        // with the runtime hex vars from BOTH theme paths — a bare var()
        // silently drops every alpha modifier in Tailwind 3.4.
        ...tokenColors([
          "ground",
          "surface",
          "ink",
          "muted",
          "line",
          "accent",
          "accent-2",
          "accent-3",
          "accent-cta",
          "accent-ink",
          "on-media",
          // block-ground set (the Faire color-block move, §2 / P2-a)
          "block-a",
          "block-b",
          "block-c",
          "on-block-a",
          "on-block-b",
          "on-block-c",
        ]),
      },
      fontFamily: {
        display: "var(--font-display)",
        text: "var(--font-text)",
        mono: "var(--font-mono)",
      },
      fontSize: {
        // type scale §1.1 — fluid roles incl. the cinematic display-hero tier
        "display-hero": [
          "var(--fs-display-hero)",
          { lineHeight: "0.92", letterSpacing: "-0.03em", fontWeight: "700" },
        ],
        display: [
          "var(--fs-display)",
          { lineHeight: "0.95", letterSpacing: "-0.02em", fontWeight: "700" },
        ],
        h1: ["var(--fs-h1)", { lineHeight: "1.0", letterSpacing: "-0.015em", fontWeight: "700" }],
        h2: ["var(--fs-h2)", { lineHeight: "1.08", letterSpacing: "-0.01em", fontWeight: "600" }],
        h3: ["var(--fs-h3)", { lineHeight: "1.22", letterSpacing: "-0.005em", fontWeight: "600" }],
        "body-lg": ["var(--fs-body-lg)", { lineHeight: "1.6" }],
        body: ["var(--fs-body)", { lineHeight: "1.55" }],
        caption: ["var(--fs-caption)", { lineHeight: "1.4", letterSpacing: "0.04em" }],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        overlay: "var(--shadow-overlay)",
        depth: "var(--shadow-depth)",
      },
      transitionTimingFunction: {
        kol: "var(--ease-kol)",
        cinematic: "var(--ease-cinematic)",
      },
      transitionDuration: {
        tap: "var(--dur-tap)",
        state: "var(--dur-state)",
        enter: "var(--dur-enter)",
        reveal: "var(--dur-reveal)",
        unfold: "var(--dur-unfold)",
        cinema: "var(--dur-cinema)",
      },
      maxWidth: {
        measure: "68ch",
        page: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
