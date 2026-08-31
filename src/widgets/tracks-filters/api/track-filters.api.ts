import { z } from "zod";

import { apiFetch } from "@/features/auth";

import type {
  ArtistProductsPage,
  FilterOption,
  TrackFiltersResponse,
} from "../api/track-filters.types";

async function fetchFilterValues(
  functionName: "simpleFilterValues" | "listFilterValues",
  attributeId: string,
): Promise<FilterOption[]> {
  const response = await apiFetch(
    new URL(
      `${String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")}/bean/request`,
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
        functionName,
        args: [{ "0": attributeId }],
      }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const raw: unknown = await response.json();

  if (functionName === "simpleFilterValues") {
    return (
      z
        .looseObject({
          result: z
            .array(
              z.looseObject({
                id: z.string(),
                value: z.string(),
              }),
            )
            .default([]),
        })
        .transform(({ result }) =>
          result
            .map((entry) => ({
              value: entry.value.trim(),
              label: entry.value.trim(),
            }))
            .filter((o) => o.value && o.label)
            .sort((a, b) => a.label.localeCompare(b.label, "ru")),
        )
        .safeParse(raw).data ?? []
    );
  }

  return (
    z
      .looseObject({
        result: z
          .array(
            z.looseObject({
              id: z.string(),
              value: z
                .looseObject({
                  id: z.string().optional(),
                  translations: z
                    .array(
                      z.looseObject({
                        text: z.string(),
                        lang: z
                          .looseObject({
                            isoCode: z.string().optional(),
                          })
                          .optional(),
                      }),
                    )
                    .default([]),
                })
                .optional(),
            }),
          )
          .default([]),
      })
      .transform(({ result }) =>
        result
          .map((entry) => {
            const translations = entry.value?.translations ?? [];
            const label =
              translations
                .find((t) => t.lang?.isoCode === "ru")
                ?.text?.trim() ||
              translations
                .find((t) => t.lang?.isoCode === "en")
                ?.text?.trim() ||
              entry.value?.id ||
              entry.id;
            return { value: entry.id, label };
          })
          .filter((o) => o.value && o.label)
          .sort((a, b) => a.label.localeCompare(b.label, "ru")),
      )
      .safeParse(raw).data ?? []
  );
}

function titleFromArtistProduct(product: {
  id: string;
  text?: string | null;
  searchTerms?: string;
  translations: { text?: string; lang?: { isoCode?: string } }[];
}): string {
  const ru = product.translations.find((t) => t.lang?.isoCode === "ru")?.text;
  const en = product.translations.find((t) => t.lang?.isoCode === "en")?.text;
  return (
    product.text?.trim() ||
    ru?.trim() ||
    en?.trim() ||
    product.searchTerms?.split(",")[0]?.trim() ||
    product.id
  );
}

/** CMS: productServiceImpl.searchProducts в category `artists`. */
export async function fetchArtistProductsPage(input: {
  offset: number;
  limit: number;
}): Promise<ArtistProductsPage> {
  const { offset, limit } = input;
  const page = limit > 0 ? Math.floor(offset / limit) + 1 : 1;
  const response = await apiFetch(
    new URL(
      `${String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")}/bean/request`,
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
        beanId: "productServiceImpl",
        scope: "PROTOTYPE",
        functionName: "searchProducts",
        args: [
          {
            "0": {
              query: {
                "fallIntoCategories._id": { $in: ["artists"] },
              },
              ignoreRegexWrap: [],
              offset,
              limit,
              visiblePages: 10,
              page,
              sortName: "text",
              sortDirection: "ASC",
            },
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
  return (
    z
      .looseObject({
        result: z
          .looseObject({
            data: z
              .looseObject({
                content: z
                  .array(
                    z.looseObject({
                      id: z.string(),
                      text: z.string().nullish(),
                      searchTerms: z.string().optional(),
                      translations: z
                        .array(
                          z.looseObject({
                            text: z.string().optional(),
                            lang: z
                              .looseObject({
                                isoCode: z.string().optional(),
                              })
                              .optional(),
                          }),
                        )
                        .default([]),
                    }),
                  )
                  .default([]),
                totalElements: z.number().optional(),
                last: z.boolean().optional(),
              })
              .optional(),
          })
          .optional(),
      })
      .transform(({ result }): ArtistProductsPage => {
        const data = result?.data;
        const items = (data?.content ?? []).map((product) => ({
          value: product.id.trim(),
          label: titleFromArtistProduct(product),
        }));
        const total = data?.totalElements ?? items.length;
        const nextOffset =
          data?.last === true || offset + items.length >= total
            ? null
            : offset + limit;
        return { items, nextOffset };
      })
      .safeParse(raw).data ?? { items: [], nextOffset: null }
  );
}

export async function fetchTrackFilters(): Promise<TrackFiltersResponse> {
  const genres = await fetchFilterValues("listFilterValues", "genre");
  return {
    genres,
    years: [
      { value: "newer", label: "Более новые" },
      { value: "older", label: "Более старые" },
    ],
  };
}
