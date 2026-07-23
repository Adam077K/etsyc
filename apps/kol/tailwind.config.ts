import type { Config } from "tailwindcss";

/**
 * "The Maker's Issue" tokens (see DESIGN.md).
 *
 * ETSY BRAND SKIN (Founder directive, 2026-07-23, pre-pitch): the accent system
 * is re-badged to Etsy's palette — signal = Etsy Orange, grounds remapped into
 * Etsy's Collage family (terracotta / fig / moss / denim). The espresso-ink
 * ground and bone text system are unchanged (the dark editorial world is the
 * product's identity). Every accent pairing is scripted-AA verified; see the
 * mapping table in DECISIONS.md.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1C1613",
          soft: "#241B16",
          raise: "#2E241E",
        },
        bone: {
          DEFAULT: "#EFE6D6",
          dim: "#CDBFA6",
          deep: "#B7A98C",
        },
        // Fig — Etsy bubblegum/lavender family, darkened to a bone-legible ground.
        plum: "#4C2740",
        // Moss — Etsy slime-green family, kept dark for the craft/values spread.
        olive: "#4E5A2A",
        clay: {
          // Rust/sienna — Etsy earth family. Deepened well below the accent
          // orange's value so the stat spread reads two-colour (blobs separate
          // from the ground) instead of monochrome; also lifts bone body to ~7.6:1.
          DEFAULT: "#7C2D12",
          // AA-safe (~6.5:1 on ink) tint for small accent text on dark grounds.
          bright: "#E08462",
        },
        sky: {
          // Denim — Etsy's brand blue (replaces the pool-blue; higher bone contrast).
          DEFAULT: "#41628C",
          // AA-safe (~7:1 on ink) tint for small accent text on dark grounds.
          bright: "#7FA6C8",
        },
        marigold: {
          // Etsy Orange — THE signal (CTA / active / link-hover / one display accent).
          DEFAULT: "#F1641E",
          // Lightened Etsy Orange for the sanctioned display accent + focus ring.
          bright: "#FF7A3C",
        },
        // Form validation — a warm coral that stays within the palette family.
        error: "#F0876B",
        line: "rgba(239,230,214,0.14)",
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        ui: ["var(--font-ui)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        meta: "0.16em",
      },
      maxWidth: {
        issue: "96rem",
        measure: "38rem",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        drift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(0,-1.5%,0) scale(1.06)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)", opacity: "0.5" },
          "50%": { transform: "translateY(6px)", opacity: "0.9" },
        },
      },
      animation: {
        shimmer: "shimmer 1.8s infinite",
        float: "float 2.4s cubic-bezier(0.16,1,0.3,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
