import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupWorker, type StartOptions } from "msw/browser";

import { handlers } from "./mocks/handlers";
import App from "./App.tsx";
import "./styles/index.css";

const worker = setupWorker(...handlers);

async function startMsw() {
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: new URL(
        "mockServiceWorker.js",
        new URL(import.meta.env.BASE_URL, location.origin),
      ).href,
    },
    quiet: true,
  } satisfies StartOptions);
}

await startMsw();

globalThis.addEventListener("focus", () => startMsw());
document.addEventListener(
  "visibilitychange",
  () => document.visibilityState === "visible" && startMsw(),
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
