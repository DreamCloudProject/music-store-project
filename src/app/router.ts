import {
  createRouter,
  createRoute,
  createRootRoute,
  redirect,
} from "@tanstack/react-router";
import { SignInPage } from "@/pages/sign-in";
import { SignUpPage } from "@/pages/sign-up";
import App from "./App";
import { useAuthStore } from "./store/auth";

const rootRoute = createRootRoute();

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  component: SignInPage,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up",
  component: SignUpPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const { isInitializing, isAuthenticated } = useAuthStore.getState();
    if (isInitializing) return;
    if (!isAuthenticated) throw redirect({ to: "/sign-in" });
  },
  component: App,
});

const routeTree = rootRoute.addChildren([signInRoute, signUpRoute, indexRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
