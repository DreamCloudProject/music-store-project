import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: [
      "**/vite-env.d.ts",
      "**/*.unit.test.ts",
      "**/*.unit.test.tsx",
      "**/*.integration.test.ts",
      "**/*.integration.test.tsx",
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.stories.ts",
      "**/*.stories.tsx",
      "**/tests/setup.ts",
      "**/tests/e2e/**",
      "**/tests/mocks/**",
    ],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
