import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  parseSearchWith,
  redirect,
  stringifySearchWith,
} from "@tanstack/react-router";
import { z } from "zod";

import { useAuthStore } from "@/features/auth";
import { MyTracksPage } from "@/pages/my-tracks";
import { NotFoundPage } from "@/pages/not-found";
import { SignInPage } from "@/pages/sign-in";
import { SignUpPage } from "@/pages/sign-up";
import { TracksPage } from "@/pages/tracks";
import { VerifyCodePage } from "@/pages/verify-code";
import { normalizeString } from "@/shared/lib";

import { StudioLayout } from "./layouts/studio-layout";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  beforeLoad: () => {
    const session = useAuthStore.getState().session;
    if (session)
      throw redirect({
        to: "/",
        search: { search: "", year: undefined, artists: [], genres: [] },
      });
  },
  component: SignInPage,
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-up",
  beforeLoad: () => {
    const session = useAuthStore.getState().session;
    if (session)
      throw redirect({
        to: "/",
        search: { search: "", year: undefined, artists: [], genres: [] },
      });
  },
  component: SignUpPage,
});

const verifyCodeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/verify-code",
  validateSearch: (search: Record<string, unknown>) => ({
    username: (search.username as string) ?? "",
  }),
  beforeLoad: ({ search }) => {
    if (!search.username) throw redirect({ to: "/sign-in" });
  },
  component: VerifyCodePage,
});

const studioRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "_studio",
  beforeLoad: () => {
    const session = useAuthStore.getState().session;
    if (!session) throw redirect({ to: "/sign-in" });
  },
  component: StudioLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => studioRoute,
  path: "/",
  validateSearch: (raw) =>
    z
      .object({
        ...((queryString) => ({
          ...{
            search: queryString.optional().default(""),
            year: queryString
              .optional()
              .default("")
              .transform((s) => s.trim() || undefined),
          },
          ...((multiSelect) => ({
            artists: multiSelect.optional().default([]),
            genres: multiSelect.optional().default([]),
          }))(
            queryString.transform((s) =>
              [
                ...new Set(
                  s
                    .split(",")
                    .map((p) => p.trim())
                    .filter(Boolean),
                ),
              ].sort(),
            ),
          ),
        }))(
          z.union([
            z.undefined().transform(() => ""),
            z.null().transform(() => ""),
            z.string(),
            z.array(z.unknown()).transform((arr) =>
              arr
                .map((item) => z.string().safeParse(item))
                .filter((r) => r.success)
                .map((r) => r.data)
                .join(","),
            ),
            z.unknown().transform(() => ""),
          ]),
        ),
      })
      .strip()
      .parse(raw),
  component: TracksPage,
});

const myTracksRoute = createRoute({
  getParentRoute: () => studioRoute,
  path: "/my-tracks",
  validateSearch: (raw) =>
    z
      .object({
        search: z
          .union([
            z.undefined().transform(() => ""),
            z.null().transform(() => ""),
            z.string(),
          ])
          .optional()
          .default(""),
      })
      .strip()
      .parse(raw),
  component: MyTracksPage,
});

export const router = createRouter({
  defaultNotFoundComponent: NotFoundPage,
  basepath: normalizeString("/", "/", import.meta.env.BASE_URL, "/", ""),
  routeTree: rootRoute.addChildren([
    signInRoute,
    signUpRoute,
    verifyCodeRoute,
    studioRoute.addChildren([indexRoute, myTracksRoute]),
  ]),
  parseSearch: parseSearchWith(JSON.parse),
  stringifySearch: (search) =>
    stringifySearchWith(
      (val: unknown): string =>
        z
          .union([
            z.array(z.unknown()).transform((arr) =>
              [
                ...new Set(
                  arr
                    .map((item) => z.string().safeParse(item))
                    .filter((r) => r.success)
                    .map((r) => r.data)
                    .map((s) => s.trim())
                    .filter(Boolean),
                ),
              ]
                .sort()
                .join(","),
            ),
            z.string().transform((s) => JSON.stringify(s.trim())),
            z.unknown().transform((v) => JSON.stringify(v)),
          ])
          .parse(val),
      JSON.parse,
    )(
      Object.fromEntries(
        Object.entries(search as Record<string, unknown>).filter(
          (
            (emptyValueSchema) =>
            ([, val]) =>
              !emptyValueSchema.safeParse(val).success
          )(
            z.union([
              z.undefined(),
              z.null(),
              z.string().refine((s) => s.trim() === ""),
              z.array(z.unknown()).refine((a) => a.length === 0),
            ]),
          ),
        ),
      ),
    ),
});

/** Сброс сессии (logout / apiFetch) → beforeLoad защищённых маршрутов уводит на /sign-in. */
useAuthStore.subscribe((state, prev) => {
  if (state.session === prev.session) return;
  void router.invalidate();
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
