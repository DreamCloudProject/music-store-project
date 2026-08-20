import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

import { handlers } from "@/app/tests";

(() => {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, String(value));
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    clear: () => {
      memory.clear();
    },
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
})();

const tracksPath = (() => {
  const full = resolve(process.cwd(), "public/tracks.json");
  if (existsSync(full)) return full;
  return resolve(process.cwd(), "public/tracks.sample.json");
})();

const tracksCatalog = JSON.parse(readFileSync(tracksPath, "utf-8")) as Record<
  string,
  unknown
>;

export const server = setupServer(
  http.get(/\/tracks\.json$/, () => HttpResponse.json(tracksCatalog)),
  http.get(/\/tracks\.sample\.json$/, () => HttpResponse.json(tracksCatalog)),
  ...handlers,
);

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof document.elementFromPoint !== "function") {
  document.elementFromPoint = () => null;
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  window.history.replaceState({}, "", "/");
});

afterAll(() => {
  server.close();
});
