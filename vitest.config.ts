import { mergeConfig } from "vitest/config";

import vitestSharedConfig from "./vitest.shared";

export default mergeConfig(vitestSharedConfig, {
  test: {
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.unit.test.ts",
      "src/**/*.unit.test.tsx",
      "src/**/*.integration.test.ts",
      "src/**/*.integration.test.tsx",
    ],
  },
});
