import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { z } from "zod";

const searchSchema = z.object({
  search: z.string().optional().default(""),
  year: z
    .string()
    .optional()
    .default("")
    .transform((s) => s.trim() || undefined),
  artists: z.array(z.string()).optional().default([]),
  genres: z.array(z.string()).optional().default([]),
});

export function createTestProviders({
  children,
  initialEntry = "/",
}: {
  children: ReactNode;
  initialEntry?: string;
}) {
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    validateSearch: (raw) => searchSchema.parse(raw),
    component: () => <>{children}</>,
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: rootRoute.addChildren([indexRoute]),
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { initialEntry?: string },
) {
  const { initialEntry, ...rest } = options ?? {};
  return render(createTestProviders({ children: ui, initialEntry }), rest);
}
