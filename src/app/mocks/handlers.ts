import { http, HttpResponse } from "msw";
import { z } from "zod";

import { parseTracksRequestBody } from "../api/tracks.api";
import type {
  CmsSearchResultPayload,
  CmsSellerSkuItem,
} from "../api/tracks.types";
import { filterTracksForUi } from "../lib/filter-tracks-for-ui";

const favoriteIds = new Set<string>();

async function loadCmsCatalogFromPublic(): Promise<CmsSearchResultPayload> {
  const response = await fetch(
    new URL("tracks.json", new URL(import.meta.env.BASE_URL, location.origin)),
  );
  return (await response.json()) as CmsSearchResultPayload;
}

function withFavorite(item: CmsSellerSkuItem): CmsSellerSkuItem {
  const favorite = favoriteIds.has(item.id);
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

function filterAndPaginate(
  cmsPayload: CmsSearchResultPayload,
  parsed: ReturnType<typeof parseTracksRequestBody>,
) {
  const cmsItems = (cmsPayload.result?.data?.content ?? []).map(withFavorite);
  const filtered = filterTracksForUi(cmsItems, {
    artists: parsed.artists ?? [],
    genres: parsed.genres ?? [],
    year: parsed.year ?? "",
    search: parsed.search ?? "",
  });

  if (parsed.catalogAll) {
    return {
      content: filtered,
      totalElements: filtered.length,
      nextOffset: null as number | null,
    };
  }

  const content = filtered.slice(parsed.offset, parsed.offset + parsed.limit);
  const nextOffset =
    parsed.offset + content.length < filtered.length
      ? parsed.offset + parsed.limit
      : null;
  return { content, totalElements: filtered.length, nextOffset };
}

export const handlers = [
  http.post("*/api/v1/bean/request", async ({ request }) => {
    const body: unknown = await request.json();
    const bean = z
      .looseObject({
        functionName: z.string().optional(),
        args: z
          .array(
            z.looseObject({
              "0": z.union([z.string(), z.boolean()]).optional(),
              "1": z.boolean().optional(),
            }),
          )
          .optional(),
      })
      .safeParse(body).data;

    if (bean?.functionName === "setFavorite") {
      const id = z.string().safeParse(bean.args?.[0]?.["0"]).data;
      const favorite = z.boolean().safeParse(bean.args?.[0]?.["1"]).data;
      if (!id || favorite == null) {
        return HttpResponse.json({ result: null }, { status: 400 });
      }
      if (favorite) favoriteIds.add(id);
      else favoriteIds.delete(id);

      const cmsItems =
        (await loadCmsCatalogFromPublic()).result?.data?.content ?? [];
      const found = cmsItems.find((item) => item.id === id);
      if (!found) {
        return HttpResponse.json({ result: null }, { status: 404 });
      }
      return HttpResponse.json({ result: withFavorite(found) });
    }

    if (
      bean?.functionName === "simpleFilterValues" &&
      typeof bean.args?.[0]?.["0"] === "string" &&
      bean.args[0]["0"]
    ) {
      const cmsItems =
        (await loadCmsCatalogFromPublic()).result?.data?.content ?? [];
      const byId = new Map<string, string>();
      for (const item of cmsItems) {
        const artistAv = item.attributeValues?.find(
          (av) => av.attributeId === "artist",
        );
        if (artistAv?.id && artistAv.value) {
          byId.set(artistAv.id, artistAv.value);
        }
      }
      return HttpResponse.json({
        result: [...byId.entries()]
          .map(([id, value]) => ({
            id,
            filterId: "artist",
            count: null,
            value,
            step: null,
            min: null,
            max: null,
          }))
          .sort((a, b) => a.value.localeCompare(b.value, "ru")),
      });
    }

    if (
      bean?.functionName === "listFilterValues" &&
      typeof bean.args?.[0]?.["0"] === "string" &&
      bean.args[0]["0"]
    ) {
      const cmsItems =
        (await loadCmsCatalogFromPublic()).result?.data?.content ?? [];
      const genreLabels: Record<string, string> = {
        edm: "EDM",
        rock: "Рок",
        pop: "Поп",
      };
      const genreSet = new Set<string>();
      for (const item of cmsItems) {
        const genre = item.attributeValues?.find(
          (av) => av.attributeId === "genre",
        )?.value;
        if (genre) genreSet.add(genre);
      }
      return HttpResponse.json({
        result: [...genreSet]
          .sort((a, b) => a.localeCompare(b, "ru"))
          .map((id) => ({
            id,
            filterId: null,
            count: "1",
            value: {
              id,
              fallIntoAttributes: [
                {
                  id: "genre",
                  name: "",
                  repositoryName: "attributeRepository",
                },
              ],
              searchTerms: `${genreLabels[id] ?? id},${genreLabels[id] ?? id}`,
              imageURLs: [],
              translations: [
                {
                  id: `translation-${id}-ru`,
                  text: genreLabels[id] ?? id,
                  lang: {
                    id: "lang3",
                    name: "Russian",
                    isoCode: "ru",
                    translations: [],
                    fallIntoObjects: [],
                  },
                  fallIntoObjects: [
                    {
                      id,
                      name: null,
                      repositoryName: "categoryRepository",
                    },
                  ],
                },
              ],
            },
            step: null,
            min: null,
            max: null,
          })),
      });
    }

    const parsed = parseTracksRequestBody(body);
    const cmsPayload = await loadCmsCatalogFromPublic();
    const { content, totalElements, nextOffset } = filterAndPaginate(
      cmsPayload,
      parsed,
    );

    return HttpResponse.json({
      result: {
        data: {
          content,
          totalElements,
          last: nextOffset === null,
          number: parsed.catalogAll
            ? 0
            : parsed.limit > 0
              ? Math.floor(parsed.offset / parsed.limit)
              : 0,
          size: parsed.catalogAll ? totalElements : parsed.limit,
        },
      },
    } satisfies CmsSearchResultPayload);
  }),
];
