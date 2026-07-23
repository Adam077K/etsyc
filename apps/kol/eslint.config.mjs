import next from "eslint-config-next/core-web-vitals";

/** Flat config — eslint-config-next 16 ships a flat array natively. */
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "node_modules/**"],
  },
];

export default eslintConfig;
