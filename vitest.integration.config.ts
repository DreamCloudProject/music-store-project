import { mergeConfig } from "vitest/config";

import vitestSharedConfig from "./vitest.shared";

export default mergeConfig(vitestSharedConfig, {
  test: {
    setupFiles: ["./src/app/tests/setup.ts"],
    include: ["src/**/*.integration.test.ts", "src/**/*.integration.test.tsx"],
  },
});
