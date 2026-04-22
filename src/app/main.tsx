import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import { setupWorker } from "msw/browser";

import { handlers } from "./mocks/handlers";
import { SearchStoreProvider } from "@/widgets/header-search";
import { TracksFiltersStoreProvider } from "@/widgets/tracks-filters";
import App from "./App.tsx";
import "./styles/index.css";

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const worker = setupWorker(...handlers);
await worker.start({
  onUnhandledRequest: "bypass",
  serviceWorker: {
    url: new URL(
      "mockServiceWorker.js",
      new URL(import.meta.env.BASE_URL, location.origin),
    ).href,
  },
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SearchStoreProvider>
        <TracksFiltersStoreProvider>
          <App />
        </TracksFiltersStoreProvider>
      </SearchStoreProvider>
    </QueryClientProvider>
  </StrictMode>,
);
