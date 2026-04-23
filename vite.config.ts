import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { normalizeString } from "./src/shared/lib/utils";

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
      react({
        babel: {
          plugins: [["babel-plugin-react-compiler"]],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
