import { http, HttpResponse } from "msw";
import { z } from "zod";

import { parseTracksRequestBody } from "../api/tracks.api";
import type { CmsSearchResultPayload } from "../api/tracks.types";
import { filterTracksForUi } from "../lib/filter-tracks-for-ui";

async function loadCmsCatalogFromPublic(): Promise<CmsSearchResultPayload> {
  const response = await fetch(
    new URL("tracks.json", new URL(import.meta.env.BASE_URL, location.origin)),
  );
  return (await response.json()) as CmsSearchResultPayload;
}

function filterAndPaginate(
  cmsPayload: CmsSearchResultPayload,
  parsed: ReturnType<typeof parseTracksRequestBody>,
) {
  const cmsItems = cmsPayload.result?.data?.content ?? [];
  const filtered = filterTracksForUi(cmsItems, {
    artists: parsed.artists ?? [],
    genres: parsed.genres ?? [],
    year: parsed.year ?? "",
    search: parsed.search ?? "",
  });

  if (parsed.limit >= Number.MAX_SAFE_INTEGER / 2) {
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
        args: z.array(z.object({ "0": z.string().optional() })).optional(),
      })
      .safeParse(body).data;

    if (bean?.functionName === "simpleFilterValues" && bean.args?.[0]?.["0"]) {
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

    if (bean?.functionName === "listFilterValues" && bean.args?.[0]?.["0"]) {
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
          number:
            parsed.limit > 0 ? Math.floor(parsed.offset / parsed.limit) : 0,
          size: parsed.limit,
        },
      },
    } satisfies CmsSearchResultPayload);
  }),
];
