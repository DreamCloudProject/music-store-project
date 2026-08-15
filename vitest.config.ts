import path from "node:path";
import { fileURLToPath } from "node:url";

import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, mergeConfig } from "vitest/config";

import vitestSharedConfig from "./vitest.shared";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default mergeConfig(
  vitestSharedConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: "unit",
            setupFiles: ["./src/shared/tests/setup.ts"],
            include: [
              "src/**/*.test.ts",
              "src/**/*.test.tsx",
              "src/**/*.unit.test.ts",
              "src/**/*.unit.test.tsx",
              "src/**/*.integration.test.ts",
              "src/**/*.integration.test.tsx",
            ],
          },
        },
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
              storybookScript: "npm run storybook -- --no-open",
            }),
          ],
          test: {
            name: "storybook",
            setupFiles: ["./.storybook/vitest.setup.ts"],
            browser: {
              enabled: true,
              headless: true,
              provider: playwright({}),
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
);
