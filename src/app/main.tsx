import "array.prototype.tosorted/auto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { AsyncQueuer } from "@tanstack/pacer";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupWorker, type StartOptions } from "msw/browser";

import { handlers } from "./mocks/handlers";
import { router } from "./router";
import "./styles/index.css";

const worker = setupWorker(...handlers);

const enableMsw = import.meta.env.VITE_ENABLE_MSW === "true";
let mswStarted = false;

const mswRestartQueue = new AsyncQueuer<StartOptions | null>(
  async (options) => {
    if (!enableMsw) return;
    if (mswStarted) worker.stop();
    await worker.start(
      options ??
        ({
          onUnhandledRequest: "bypass" as const,
          serviceWorker: {
            url: new URL(
              "mockServiceWorker.js",
              new URL(import.meta.env.BASE_URL, location.origin),
            ).href,
          },
          quiet: true,
        } satisfies StartOptions),
    );
    mswStarted = true;
  },
  {
    key: "msw-restart",
    concurrency: 1,
    maxSize: 1,
    started: true,
    throwOnError: false,
    getPriority: () => 0,
    asyncRetryerOptions: {
      maxAttempts: 2,
      backoff: "fixed",
      baseWait: 0,
    },
  },
);

mswRestartQueue.addItem(null);
await mswRestartQueue.flush(1);

globalThis.addEventListener("focus", () => mswRestartQueue.addItem(null));
document.addEventListener(
  "visibilitychange",
  () => document.visibilityState === "visible" && mswRestartQueue.addItem(null),
);

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
