import type { Config } from "tailwindcss";

/**
 * "The Maker's Issue" tokens (see DESIGN.md). Warm ink + brave color-blocked
 * grounds — deliberately not the cream/serif/terracotta AI default.
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
        plum: "#43223B",
        olive: "#4E5A2A",
        clay: {
          DEFAULT: "#B4462A",
          // AA-safe (~6.4:1 on ink) tint for small accent text on dark grounds.
          bright: "#E08462",
        },
        sky: {
          DEFAULT: "#557E8F",
          // AA-safe (~6.8:1 on ink) tint for small accent text on dark grounds.
          bright: "#7FA6B8",
        },
        marigold: {
          DEFAULT: "#E4922C",
          bright: "#F2A93B",
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
