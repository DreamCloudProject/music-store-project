import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { z } from "zod";

export interface TrackFavoriteResult {
  id: string;
  name?: string | null;
  searchTerms?: string;
  favorite?: boolean;
  imageURLs?: string[];
  attributeValues?: {
    id?: string;
    attributeId: string;
    value?: string | null;
  }[];
}

function beanRequestUrl() {
  return new URL(
    `${String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")}/request`,
    location.origin,
  );
}

function applyFavorite(
  item: TrackFavoriteResult,
  favorite: boolean,
): TrackFavoriteResult {
  const attributeValues = [
    ...(item.attributeValues ?? []).filter(
      (av) => av.attributeId !== "favorite",
    ),
    {
      attributeId: "favorite",
      value: favorite ? "true" : "false",
    },
  ];
  return { ...item, favorite, attributeValues };
}

/** Bean `setFavorite` — возвращает обновлённый SellerSKU. */
export async function fetchSetTrackFavorite(input: {
  id: string;
  favorite: boolean;
}): Promise<TrackFavoriteResult> {
  const response = await fetch(beanRequestUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    body: JSON.stringify({
      beanId: "searchManagerServiceImpl",
      scope: "PROTOTYPE",
      functionName: "setFavorite",
      args: [{ "0": input.id, "1": input.favorite }],
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const raw: unknown = await response.json();
  return z
    .looseObject({
      result: z.looseObject({
        id: z.string(),
        name: z.string().nullish(),
        searchTerms: z.string().optional(),
        favorite: z.boolean().optional(),
        imageURLs: z.array(z.string()).optional(),
        attributeValues: z
          .array(
            z.object({
              id: z.string().optional(),
              attributeId: z.string(),
              value: z.string().nullish(),
            }),
          )
          .optional(),
      }),
    })
    .transform(({ result }) => applyFavorite(result, input.favorite))
    .parse(raw);
}

type TracksPageCache = {
  items: TrackFavoriteResult[];
  nextOffset: number | null;
};

function patchItemInList(
  items: TrackFavoriteResult[],
  next: TrackFavoriteResult,
): TrackFavoriteResult[] {
  return items.map((item) =>
    item.id === next.id ? { ...item, ...next } : item,
  );
}

function optimisticFavorite(
  item: TrackFavoriteResult,
  id: string,
  favorite: boolean,
): TrackFavoriteResult {
  if (item.id !== id) return item;
  return applyFavorite(item, favorite);
}

export function useToggleTrackFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchSetTrackFavorite,
    onMutate: async ({ id, favorite }) => {
      await queryClient.cancelQueries({ queryKey: ["tracks"] });

      const previousCatalog = queryClient.getQueryData<TrackFavoriteResult[]>([
        "tracks",
        "catalog-full",
      ]);
      const previousPaged = queryClient.getQueriesData<
        InfiniteData<TracksPageCache>
      >({
        queryKey: ["tracks", "paged"],
      });

      if (previousCatalog) {
        queryClient.setQueryData(
          ["tracks", "catalog-full"],
          previousCatalog.map((item) => optimisticFavorite(item, id, favorite)),
        );
      }

      for (const [key, data] of previousPaged) {
        if (!data) continue;
        queryClient.setQueryData(key, {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              optimisticFavorite(item, id, favorite),
            ),
          })),
        });
      }

      return { previousCatalog, previousPaged };
    },
    onError: (_error, _vars, context) => {
      if (!context) return;
      if (context.previousCatalog) {
        queryClient.setQueryData(
          ["tracks", "catalog-full"],
          context.previousCatalog,
        );
      }
      for (const [key, data] of context.previousPaged) {
        queryClient.setQueryData(key, data);
      }
    },
    onSuccess: (cmsItem) => {
      queryClient.setQueryData<TrackFavoriteResult[]>(
        ["tracks", "catalog-full"],
        (old) => (old ? patchItemInList(old, cmsItem) : old),
      );

      queryClient.setQueriesData<InfiniteData<TracksPageCache>>(
        { queryKey: ["tracks", "paged"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: patchItemInList(page.items, cmsItem),
            })),
          };
        },
      );
    },
  });
}
