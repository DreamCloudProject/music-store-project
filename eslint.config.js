import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import checkFile from "eslint-plugin-check-file";

export default defineConfig([
  globalIgnores(["dist", "public/mockServiceWorker.js"]),
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      {
        plugins: { "react-refresh": reactRefresh },
        rules: {
          "react-refresh/only-export-components": [
            "warn",
            { allowConstantExport: true },
          ],
        },
      },
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-console": "warn",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    files: ["src/**/ui/**/*.tsx", "src/app/*.tsx"],
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/ui/**/*.tsx": "PASCAL_CASE", "src/app/*.tsx": "PASCAL_CASE" },
        { ignoreMiddleExtensions: true },
      ],
    },
    plugins: {
      "check-file": checkFile,
    },
  },
  {
    files: [
      "src/**/{model,lib,api,config}/**/*.{ts,tsx}",
      "!src/**/index.{ts,tsx}",
      "!src/**/*.d.ts",
    ],
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        { "src/**/{model,lib,api,config}/**/*.{ts,tsx}": "KEBAB_CASE" },
        { ignoreMiddleExtensions: true },
      ],
    },
    plugins: {
      "check-file": checkFile,
    },
  },
  {
    files: ["src/shared/ui/*.tsx"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },
]);
