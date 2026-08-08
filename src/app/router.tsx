import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
  parseSearchWith,
  stringifySearchWith,
} from "@tanstack/react-router";
import { z } from "zod";

import { normalizeString } from "@/shared/lib";

function validateTracksSearch(raw: unknown) {
  return z
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
    .parse(raw);
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

/** Pathless layout: общий search для `/` и `/playlist/$playlistId`. */
const tracksLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "/_tracks",
  validateSearch: validateTracksSearch,
  component: () => <Outlet />,
});

const homeRoute = createRoute({
  getParentRoute: () => tracksLayoutRoute,
  path: "/",
  component: lazyRouteComponent(() => import("./App")),
});

const playlistRoute = createRoute({
  getParentRoute: () => tracksLayoutRoute,
  path: "/playlist/$playlistId",
  component: lazyRouteComponent(() => import("./App")),
});

export const router = createRouter({
  basepath: normalizeString("/", "/", import.meta.env.BASE_URL, "/", ""),
  routeTree: rootRoute.addChildren([
    tracksLayoutRoute.addChildren([homeRoute, playlistRoute]),
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

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
