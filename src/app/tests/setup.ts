import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll } from "vitest";

import "@/shared/tests/setup";

import { handlers } from "./index";

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

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
