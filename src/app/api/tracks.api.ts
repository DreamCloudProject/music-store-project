import { z } from "zod";

import type {
  CmsSellerSkuItem,
  CmsSellerSkuSearchArgs,
  TracksPageResponse,
} from "../api/tracks.types";

interface FetchTracksPageInput {
  offset: number;
  limit: number;
  search?: string;
  artists?: string[];
  genres?: string[];
  year?: string;
}

export async function fetchTracksPage(
  input: FetchTracksPageInput,
): Promise<TracksPageResponse> {
  const { offset, limit } = input;
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;
  const response = await fetch(
    new URL(
      "request",
      new URL(import.meta.env.VITE_API_BASE_URL, location.origin),
    ),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Site-Context": "site",
        "Lang-Context": "ru",
      },
      body: JSON.stringify({
        beanId: "searchManagerServiceImpl",
        scope: "PROTOTYPE",
        functionName: "search",
        args: [
          {
            "0": ((page) =>
              z
                .object({
                  offset: z.number(),
                  limit: z.number(),
                  search: z.string().optional(),
                  artists: z.array(z.string()).default([]),
                  genres: z.array(z.string()).default([]),
                  year: z.string().optional(),
                })
                .transform((argsInput): CmsSellerSkuSearchArgs => {
                  const artists = argsInput.artists.filter(Boolean);
                  const genres = argsInput.genres.filter(Boolean);
                  const search = argsInput.search?.trim();
                  return {
                    type: "SellerSKU",
                    query: {
                      isPublishedForSale: true,
                      ...(artists.length ? { artist: artists.join("|") } : {}),
                      ...(genres.length ? { genre: genres.join("|") } : {}),
                    },
                    ignoreRegexWrap: [
                      "name",
                      "embeddedSku",
                      "productsRef",
                      "isPublishedForSale",
                    ],
                    offset: argsInput.offset,
                    limit: argsInput.limit,
                    visiblePages: 10,
                    page,
                    ...(search
                      ? { searchTerm: search, filteringStrategy: "EXCLUDE" }
                      : artists.length || genres.length
                        ? { filteringStrategy: "INCLUDE" }
                        : {}),
                    ...(argsInput.year === "newer" || argsInput.year === "older"
                      ? {
                          sortName: "lastModifiedDate",
                          sortDirection:
                            argsInput.year === "older" ? "ASC" : "DESC",
                        }
                      : {}),
                  };
                })
                .parse(input))(page),
          },
        ],
      }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const raw: unknown = await response.json();
  return ((offset, limit) =>
    z
      .looseObject({
        result: z
          .object({
            data: z
              .object({
                content: z
                  .array(
                    z.looseObject({
                      id: z.string(),
                      name: z.string().nullish(),
                      searchTerms: z.string().optional(),
                      attributeValues: z
                        .array(
                          z.object({
                            attributeId: z.string(),
                            value: z.string().nullish(),
                          }),
                        )
                        .optional(),
                    }),
                  )
                  .default([]),
                totalElements: z.number().default(0),
              })
              .default({ content: [], totalElements: 0 }),
          })
          .default({ data: { content: [], totalElements: 0 } }),
      })
      .transform(
        ({ result }): TracksPageResponse => ({
          items: result.data.content,
          nextOffset:
            offset + result.data.content.length < result.data.totalElements
              ? offset + limit
              : null,
        }),
      )
      .safeParse(raw).data ?? { items: [], nextOffset: null })(offset, limit);
}

export async function fetchTracksCatalogAll(): Promise<CmsSellerSkuItem[]> {
  const page = await fetchTracksPage({
    offset: 0,
    limit: Number.MAX_SAFE_INTEGER,
  });
  return page.items;
}

/** Разбор тела POST bean `searchManagerServiceImpl` — для MSW и тестов. */
export function parseTracksRequestBody(body: unknown): FetchTracksPageInput {
  const defaults: FetchTracksPageInput = {
    offset: 0,
    limit: 10,
    artists: [],
    genres: [],
  };
  return (
    z
      .looseObject({
        args: z
          .array(
            z.object({
              "0": z
                .looseObject({
                  searchTerm: z.string().optional(),
                  offset: z.number().optional(),
                  limit: z.number().optional(),
                  sortDirection: z.enum(["ASC", "DESC"]).optional(),
                  query: z
                    .looseObject({
                      artist: z.string().optional(),
                      genre: z.string().optional(),
                    })
                    .optional(),
                })
                .optional(),
            }),
          )
          .optional(),
      })
      .transform((bean) => {
        const inner = bean.args?.[0]?.["0"];
        if (!inner) return defaults;
        const splitPipe = (raw?: string) =>
          raw
            ?.split("|")
            .map((part) => part.trim())
            .filter(Boolean) ?? [];
        return {
          offset: inner.offset ?? defaults.offset,
          limit: inner.limit ?? defaults.limit,
          search: inner.searchTerm,
          artists: splitPipe(inner.query?.artist),
          genres: splitPipe(inner.query?.genre),
          year:
            inner.sortDirection === "ASC"
              ? "older"
              : inner.sortDirection === "DESC"
                ? "newer"
                : undefined,
        };
      })
      .safeParse(body).data ?? defaults
  );
}
