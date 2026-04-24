import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import { normalizeString } from "./src/shared/lib/utils";

type ManualChunkEntry = {
  chunk: string | undefined;
  data: unknown;
  predicate: (item: string, data: unknown) => boolean;
};

function pickManualChunkForRollupModuleId(
  entries: ReadonlyArray<ManualChunkEntry>,
  id: string,
): string | undefined {
  const normalizedId = id.replace(/\\/g, "/");
  return entries.find((item) => item.predicate(normalizedId, item.data))?.chunk;
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  env.VITE_APP_BASE_URL = normalizeString(
    "/",
    "/",
    env.VITE_APP_BASE_URL || "/",
    "/",
    "/",
  );
  env.VITE_API_BASE_URL = normalizeString(
    "",
    "",
    env.VITE_API_BASE_URL || env.VITE_APP_BASE_URL,
    "/",
    "/",
  );

  return {
    base: env.VITE_APP_BASE_URL,
    define: {
      "import.meta.env.VITE_APP_BASE_URL": JSON.stringify(
        env.VITE_APP_BASE_URL,
      ),
      "import.meta.env.VITE_API_BASE_URL": JSON.stringify(
        env.VITE_API_BASE_URL,
      ),
    },
    plugins: [
      tailwindcss(),
      react(),
      mode === "analyze" &&
        visualizer({
          filename: "dist/stats.html",
          gzipSize: true,
          brotliSize: true,
          template: "treemap",
          title: "music-store bundle",
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: pickManualChunkForRollupModuleId.bind(null, [
            {
              chunk: undefined,
              data: "/node_modules/",
              predicate: (item, data) =>
                typeof data === "string" && !item.includes(data),
            },
            {
              chunk: "vendor-react",
              data: [/\/node_modules\/(react|react-dom|scheduler)(\/|$)/],
              predicate: (item, data) =>
                Array.isArray(data) && data.some((re) => re.test(item)),
            },
            {
              chunk: "vendor-msw",
              data: [
                /\/node_modules\/(msw|tough-cookie|tldts|tldts-core)(\/|$)/,
                /\/node_modules\/@mswjs\//,
              ],
              predicate: (item, data) =>
                Array.isArray(data) && data.some((re) => re.test(item)),
            },
            {
              chunk: "vendor",
              data: true,
              predicate: (_item, data) => !!data,
            },
          ]),
        },
      },
    },
  };
});
