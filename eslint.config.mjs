import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      // Reference design bundle imported from Claude Design — not application code.
      "design-system-review-request/**"
    ]
  },
  ...nextVitals,
  ...nextTs
];

export default eslintConfig;
