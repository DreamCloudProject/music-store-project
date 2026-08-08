import { z } from "zod";

import type {
  CmsSellerSkuItem,
  CmsSellerSkuSearchArgs,
  TracksPageResponse,
} from "../api/tracks.types";

interface FetchTracksFilters {
  search?: string;
  artists?: string[];
  genres?: string[];
  year?: string;
}

export interface FetchTracksPageInput extends FetchTracksFilters {
  offset: number;
  limit: number;
}

export interface ParsedTracksRequest extends FetchTracksPageInput {
  catalogAll: boolean;
}

const tracksSearchFiltersSchema = z.object({
  search: z.string().optional(),
  artists: z.array(z.string()).default([]),
  genres: z.array(z.string()).default([]),
  year: z.string().optional(),
});

export const tracksCatalogCacheTtlMs = 1000 * 60 * 30;

const cmsSellerSkuItemSchema = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  searchTerms: z.string().optional(),
  createdDate: z.number().optional(),
  lastModifiedDate: z.number().optional(),
  embeddedSku: z.looseObject({ id: z.string() }).nullish(),
  imageURLs: z.array(z.string()).optional(),
  documentURLs: z.array(z.looseObject({ url: z.string() })).optional(),
  attributeValues: z
    .array(
      z.object({
        id: z.string().optional(),
        attributeId: z.string(),
        value: z.string().nullish(),
      }),
    )
    .optional(),
});

const catalogStorageSchema = z.object({
  cachedAt: z.number(),
  items: z.array(cmsSellerSkuItemSchema),
});

function catalogStorageKey(): string {
  return `music-store:catalog:${import.meta.env.VITE_API_BASE_URL}`;
}

function readCachedTracksCatalog(): CmsSellerSkuItem[] | null {
  try {
    const raw = localStorage.getItem(catalogStorageKey());
    if (!raw) return null;
    const parsed = catalogStorageSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    if (Date.now() - parsed.data.cachedAt > tracksCatalogCacheTtlMs)
      return null;
    if (!parsed.data.items.length) return null;
    return parsed.data.items;
  } catch {
    return null;
  }
}

function writeCachedTracksCatalog(items: CmsSellerSkuItem[]): void {
  if (!items.length) return;
  try {
    localStorage.setItem(
      catalogStorageKey(),
      JSON.stringify({ cachedAt: Date.now(), items }),
    );
  } catch {
    // quota / private mode — без кеша, запрос с сети
  }
}

function buildCmsSearchArgs(
  filters: z.infer<typeof tracksSearchFiltersSchema>,
  pagination?: { offset: number; limit: number; page: number },
): CmsSellerSkuSearchArgs {
  const artists = filters.artists.filter(Boolean);
  const genres = filters.genres.filter(Boolean);
  const search = filters.search?.trim();
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
    ...(pagination
      ? {
          offset: pagination.offset,
          limit: pagination.limit,
          visiblePages: 10,
          page: pagination.page,
        }
      : {}),
    ...(search
      ? { searchTerm: search, filteringStrategy: "EXCLUDE" }
      : artists.length || genres.length
        ? { filteringStrategy: "INCLUDE" }
        : {}),
    ...(filters.year === "newer" || filters.year === "older"
      ? {
          sortName: "lastModifiedDate",
          sortDirection: filters.year === "older" ? "ASC" : "DESC",
        }
      : {}),
  };
}

function parseTracksSearchResponse(
  raw: unknown,
  pagination?: { offset: number; limit: number },
): TracksPageResponse {
  return ((offset, limit) =>
    z
      .looseObject({
        result: z
          .object({
            data: z
              .object({
                content: z.array(cmsSellerSkuItemSchema).default([]),
                totalElements: z.number().default(0),
              })
              .default({ content: [], totalElements: 0 }),
          })
          .default({ data: { content: [], totalElements: 0 } }),
      })
      .transform(({ result }): TracksPageResponse => {
        const items = result.data.content;
        if (pagination == null) {
          return { items, nextOffset: null };
        }
        return {
          items,
          nextOffset:
            offset + items.length < result.data.totalElements
              ? offset + limit
              : null,
        };
      })
      .safeParse(raw).data ?? { items: [], nextOffset: null })(
    pagination?.offset ?? 0,
    pagination?.limit ?? 0,
  );
}

async function postTracksSearch(
  searchArgs: CmsSellerSkuSearchArgs,
  pagination?: { offset: number; limit: number },
): Promise<TracksPageResponse> {
  const response = await fetch(
    new URL(
      `${String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")}/request`,
      location.origin,
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
        args: [{ "0": searchArgs }],
      }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const raw: unknown = await response.json();
  if (
    typeof raw === "object" &&
    raw !== null &&
    "result" in raw &&
    (raw as { result: unknown }).result === null
  ) {
    throw new Error("CMS search returned null result");
  }
  return parseTracksSearchResponse(raw, pagination);
}

export async function fetchTracksPage(
  input: FetchTracksPageInput,
): Promise<TracksPageResponse> {
  const { offset, limit } = input;
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;
  const filters = tracksSearchFiltersSchema.parse(input);
  return postTracksSearch(
    buildCmsSearchArgs(filters, { offset, limit, page }),
    { offset, limit },
  );
}

export async function fetchTracksCatalogAll(): Promise<CmsSellerSkuItem[]> {
  const cached = readCachedTracksCatalog();
  if (cached) return cached;

  const filters = tracksSearchFiltersSchema.parse({});
  const page = await postTracksSearch(buildCmsSearchArgs(filters));
  writeCachedTracksCatalog(page.items);
  return page.items;
}

/** Разбор тела POST bean `searchManagerServiceImpl` — для MSW и тестов. */
export function parseTracksRequestBody(body: unknown): ParsedTracksRequest {
  const defaults: ParsedTracksRequest = {
    offset: 0,
    limit: 10,
    artists: [],
    genres: [],
    catalogAll: false,
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
                  page: z.number().optional(),
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
        const catalogAll =
          inner.offset === undefined &&
          inner.limit === undefined &&
          inner.page === undefined;
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
          catalogAll,
        };
      })
      .safeParse(body).data ?? defaults
  );
}
