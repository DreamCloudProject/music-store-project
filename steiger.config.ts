import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

export default defineConfig([
  ...fsd.configs.recommended,
  {
    ignores: ["**/vite-env.d.ts"],
    // Фича часто стартует с одного виджета; слой features всё равно нужен для UX-действий.
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
]);
