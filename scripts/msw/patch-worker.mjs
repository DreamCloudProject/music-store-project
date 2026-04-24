import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const patchSpecPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "worker-fetch-patch.js",
);

const workerPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "public",
  "mockServiceWorker.js",
);

function parsePatchSpec(raw) {
  const beginIdx = raw.indexOf("// @begin");
  if (beginIdx === -1) {
    throw new Error(
      "patch-worker: worker-fetch-patch.js must contain // @begin",
    );
  }
  const header = raw.slice(0, beginIdx);
  const markerMatch = header.match(/@marker\s+(.+)/);
  const PATCH_MARKER = markerMatch ? markerMatch[1].trim() : "";
  if (!PATCH_MARKER) {
    throw new Error(
      "patch-worker: expected // @marker <text> before // @begin",
    );
  }

  const rest = raw.slice(beginIdx);

  function section(name) {
    const re = new RegExp(
      `^\\s*// @begin ${name}\\r?\\n([\\s\\S]*?)^// @end ${name}`,
      "m",
    );
    const m = rest.match(re);
    if (!m) {
      throw new Error(
        `patch-worker: missing // @begin ${name} ... // @end ${name}`,
      );
    }
    return m[1];
  }

  const normalize = (s) => s.replace(/\r\n/g, "\n");

  return {
    PATCH_MARKER,
    FETCH_HOOK_PREFIX: normalize(section("fetch-hook-prefix")),
    FETCH_HOOK_BODY: normalize(section("fetch-hook-body")),
    FETCH_HOOK_SUFFIX: normalize(section("fetch-hook-suffix")),
  };
}

const spec = parsePatchSpec(readFileSync(patchSpecPath, "utf8"));
const { PATCH_MARKER, FETCH_HOOK_PREFIX, FETCH_HOOK_BODY, FETCH_HOOK_SUFFIX } =
  spec;

let workerContent = readFileSync(workerPath, "utf8");

const anchor = FETCH_HOOK_PREFIX + FETCH_HOOK_SUFFIX;

if (!workerContent.includes(PATCH_MARKER)) {
  if (!workerContent.includes(anchor)) {
    console.error(
      "patch-worker: anchor missing; update fetch-hook-prefix/suffix in worker-fetch-patch.js",
    );
    process.exit(1);
  }
  const gap = FETCH_HOOK_BODY.trim() === "" ? "" : "\n\n";
  workerContent = workerContent.replace(
    anchor,
    FETCH_HOOK_PREFIX + FETCH_HOOK_BODY + gap + FETCH_HOOK_SUFFIX,
  );
}

writeFileSync(workerPath, workerContent, "utf8");
console.log("worker patched:", workerPath);
