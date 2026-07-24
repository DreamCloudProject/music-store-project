import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

import { handlers } from "@/app/tests";

const tracksCatalog = JSON.parse(
  readFileSync(resolve(process.cwd(), "public/tracks.json"), "utf-8"),
) as Record<string, unknown>;

export const server = setupServer(
  http.get(/\/tracks\.json$/, () => HttpResponse.json(tracksCatalog)),
  ...handlers,
);

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
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
