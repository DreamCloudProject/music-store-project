import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier";
import checkFile from "eslint-plugin-check-file";
import path from "node:path";

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
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    plugins: {
      "fsd-imports": {
        rules: {
          "no-cross-slice-relative-import": {
            meta: {
              type: "problem",
              docs: {
                description:
                  "Disallow relative imports that escape src/<layer>/<slice> boundary.",
              },
              schema: [],
              messages: {
                escape:
                  "Relative import escapes current slice ({{fromSlice}} → {{toSlice}}). Use an alias import instead (e.g. @/{{toSlice}}) and follow public API.",
              },
            },
            create(context) {
              const filename = context.filename;
              if (!filename || filename === "<input>") return {};

              const normalizedFilename = filename.split(path.sep).join("/");
              const srcIdx = normalizedFilename.lastIndexOf("/src/");
              if (srcIdx === -1) return {};

              const afterSrc = normalizedFilename.slice(
                srcIdx + "/src/".length,
              );
              const parts = afterSrc.split("/").filter(Boolean);
              const [layer, slice] = parts;
              if (!layer) return {};

              const isLayerRoot = layer === "app" || layer === "shared";
              if (!isLayerRoot && !slice) return {};

              const fromSlice = isLayerRoot ? layer : `${layer}/${slice}`;
              const sliceRoot =
                normalizedFilename.slice(0, srcIdx + "/src/".length) +
                fromSlice;

              const resolveTo = (source) => {
                const baseDir = path.posix.dirname(normalizedFilename);
                return path.posix.normalize(path.posix.join(baseDir, source));
              };

              const toSliceOf = (absPath) => {
                const n = absPath.split(path.sep).join("/");
                const i = n.lastIndexOf("/src/");
                if (i === -1) return null;
                const rest = n.slice(i + "/src/".length);
                const [l, s] = rest.split("/").filter(Boolean);
                if (!l || !s) return null;
                return `${l}/${s}`;
              };

              const isInsideSliceRoot = (absPath) =>
                absPath === sliceRoot || absPath.startsWith(`${sliceRoot}/`);

              return {
                ImportDeclaration(node) {
                  const source = node.source?.value;
                  if (typeof source !== "string") return;
                  if (!source.startsWith(".")) return;

                  const toAbs = resolveTo(source);
                  if (isInsideSliceRoot(toAbs)) return;

                  const toSlice = toSliceOf(toAbs) ?? "unknown";
                  context.report({
                    node: node.source,
                    messageId: "escape",
                    data: { fromSlice, toSlice },
                  });
                },
                ExportNamedDeclaration(node) {
                  const source = node.source?.value;
                  if (typeof source !== "string") return;
                  if (!source.startsWith(".")) return;

                  const toAbs = resolveTo(source);
                  if (isInsideSliceRoot(toAbs)) return;

                  const toSlice = toSliceOf(toAbs) ?? "unknown";
                  context.report({
                    node: node.source,
                    messageId: "escape",
                    data: { fromSlice, toSlice },
                  });
                },
                ExportAllDeclaration(node) {
                  const source = node.source?.value;
                  if (typeof source !== "string") return;
                  if (!source.startsWith(".")) return;

                  const toAbs = resolveTo(source);
                  if (isInsideSliceRoot(toAbs)) return;

                  const toSlice = toSliceOf(toAbs) ?? "unknown";
                  context.report({
                    node: node.source,
                    messageId: "escape",
                    data: { fromSlice, toSlice },
                  });
                },
              };
            },
          },
          "relative-import-prefix-must-target-slice-root": {
            meta: {
              type: "problem",
              docs: {
                description:
                  'For relative imports, the leading "../" prefix must resolve to the current slice root (or layer root for app/shared).',
              },
              schema: [],
              messages: {
                prefix:
                  'Relative import prefix "{{prefix}}" must resolve to slice root "{{expected}}", but resolves to "{{actual}}".',
              },
            },
            create(context) {
              const filename = context.filename;
              if (!filename || filename === "<input>") return {};

              const normalizedFilename = filename.split(path.sep).join("/");
              const srcIdx = normalizedFilename.lastIndexOf("/src/");
              if (srcIdx === -1) return {};

              const afterSrc = normalizedFilename.slice(
                srcIdx + "/src/".length,
              );
              const parts = afterSrc.split("/").filter(Boolean);
              const [layer, slice] = parts;
              if (!layer) return {};

              const isLayerRoot = layer === "app" || layer === "shared";
              if (!isLayerRoot && !slice) return {};

              const fromSlice = isLayerRoot ? layer : `${layer}/${slice}`;
              const sliceRoot =
                normalizedFilename.slice(0, srcIdx + "/src/".length) +
                fromSlice;

              const baseDir = path.posix.dirname(normalizedFilename);

              const check = (node, source) => {
                if (typeof source !== "string") return;
                if (!source.startsWith(".")) return;

                const m = source.startsWith("./")
                  ? ["./"]
                  : source.match(/^(\.\.\/)+/);
                if (!m) return;

                const prefix = m[0];
                const actual = path.posix
                  .normalize(path.posix.join(baseDir, prefix))
                  .replace(/\/$/, "");
                const expected = sliceRoot;

                if (actual !== expected) {
                  context.report({
                    node,
                    messageId: "prefix",
                    data: { prefix, expected, actual },
                  });
                }
              };

              return {
                ImportDeclaration(node) {
                  check(node.source, node.source?.value);
                },
                ExportNamedDeclaration(node) {
                  if (!node.source) return;
                  check(node.source, node.source.value);
                },
                ExportAllDeclaration(node) {
                  if (!node.source) return;
                  check(node.source, node.source.value);
                },
              };
            },
          },
          "prefer-relative-import-within-slice": {
            meta: {
              type: "suggestion",
              docs: {
                description:
                  "Require relative imports when importing within the same slice/layer; use alias only when crossing slice/layer.",
              },
              schema: [],
              messages: {
                relative:
                  'Import stays within current slice "{{fromSlice}}". Use a relative path instead of "{{source}}".',
              },
            },
            create(context) {
              const filename = context.filename;
              if (!filename || filename === "<input>") return {};

              const normalizedFilename = filename.split(path.sep).join("/");
              const srcIdx = normalizedFilename.lastIndexOf("/src/");
              if (srcIdx === -1) return {};

              const afterSrc = normalizedFilename.slice(
                srcIdx + "/src/".length,
              );
              const parts = afterSrc.split("/").filter(Boolean);
              const [layer, slice] = parts;
              if (!layer) return {};

              const isLayerRoot = layer === "app" || layer === "shared";
              if (!isLayerRoot && !slice) return {};

              const fromSlice = isLayerRoot ? layer : `${layer}/${slice}`;
              const sliceRoot =
                normalizedFilename.slice(0, srcIdx + "/src/".length) +
                fromSlice;

              const resolveAliasToAbs = (source) => {
                if (typeof source !== "string") return null;
                if (!source.startsWith("@/")) return null;
                return (
                  normalizedFilename.slice(0, srcIdx + "/src/".length) +
                  source.slice(2)
                );
              };

              const isInsideSliceRoot = (absPath) =>
                absPath === sliceRoot || absPath.startsWith(`${sliceRoot}/`);

              const check = (node, source) => {
                const toAbs = resolveAliasToAbs(source);
                if (!toAbs) return;
                if (!isInsideSliceRoot(toAbs)) return;

                context.report({
                  node,
                  messageId: "relative",
                  data: { fromSlice, source },
                });
              };

              return {
                ImportDeclaration(node) {
                  check(node.source, node.source?.value);
                },
                ExportNamedDeclaration(node) {
                  if (!node.source) return;
                  check(node.source, node.source.value);
                },
                ExportAllDeclaration(node) {
                  if (!node.source) return;
                  check(node.source, node.source.value);
                },
              };
            },
          },
        },
      },
    },
    rules: {
      "fsd-imports/no-cross-slice-relative-import": "error",
      "fsd-imports/relative-import-prefix-must-target-slice-root": "error",
      "fsd-imports/prefer-relative-import-within-slice": "error",
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
