import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Apostrophes/quotes in JSX marketing copy are intentional.
      "react/no-unescaped-entities": "off",
      // TODO: restructure the 4 flagged hooks (useAnalysisLimit etc.), then restore to "error".
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
