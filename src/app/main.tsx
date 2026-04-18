import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppProviders } from "./providers/AppProviders";
import App from "./App.tsx";
import "./styles/index.css";

const { worker } = await import("./mocks/browser");
await worker.start({ onUnhandledRequest: "bypass" });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
