import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

import { AppProviders } from "@/app/providers/AppProviders";

function ProvidersWrapper({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, {
    wrapper: ProvidersWrapper,
    ...options,
  });
}

export * from "@testing-library/react";
