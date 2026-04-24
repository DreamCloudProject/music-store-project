import { useState } from "react";
import {
  createRouter,
  createRoute,
  createRootRoute,
  RouterProvider,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import Layout from "@/widgets/layout/Layout";
import LoginPage from "@/pages/login/LoginPage";
import TracksPage from "@/pages/tracks/TracksPage";
import PlaylistPage from "@/pages/playlist/PlaylistPage";

// ── Route tree ────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const layoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "layout",
  component: Layout,
});

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/tracks" });
  },
});

const tracksRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/tracks",
  component: TracksPage,
});

const playlistRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: "/playlist/$id",
  component: PlaylistPage,
});

const routeTree = rootRoute.addChildren([
  layoutRoute.addChildren([indexRoute, tracksRoute, playlistRoute]),
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [isAuthed, setIsAuthed] = useState(false);

  if (!isAuthed) {
    return <LoginPage onLogin={() => setIsAuthed(true)} />;
  }

  return <RouterProvider router={router} />;
}
