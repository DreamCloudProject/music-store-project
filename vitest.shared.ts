import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export const vitestSharedConfig = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  define: {
    "import.meta.env.VITE_APP_BASE_URL": JSON.stringify("/"),
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify("/api/v1/bean"),
    "import.meta.env.VITE_ENABLE_MSW": JSON.stringify("true"),
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/shared/testing/setup.ts"],
    css: true,
  },
});

export default vitestSharedConfig;
