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
        clay: "#B4462A",
        sky: "#557E8F",
        marigold: {
          DEFAULT: "#E4922C",
          bright: "#F2A93B",
        },
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
      },
      animation: {
        shimmer: "shimmer 1.8s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
