import { mergeConfig } from "vitest/config";

import vitestSharedConfig from "./vitest.shared";

export default mergeConfig(vitestSharedConfig, {
  test: {
    setupFiles: ["./src/shared/tests/setup.ts"],
    include: ["src/**/*.unit.test.ts", "src/**/*.unit.test.tsx"],
  },
});
