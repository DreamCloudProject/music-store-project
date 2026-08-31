import { http, HttpResponse } from "msw";
import { z } from "zod";

import { parseTracksRequestBody } from "../../api/tracks.api";
import type { CmsSearchResultPayload } from "../../api/tracks.types";
import { filterTracksForUi } from "../../lib/filter-tracks-for-ui";

import {
  authHttpHandlers,
  handleAuthBean,
  unauthorizedIfInvalidBearer,
} from "../../tests/mocks/auth.handlers";

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
  ...authHttpHandlers,
  http.post("*/api/v1/bean/request", async ({ request }) => {
    const body: unknown = await request.json();

    const authResponse = handleAuthBean(body);
    if (authResponse) return authResponse;

    const unauthorized = unauthorizedIfInvalidBearer(request);
    if (unauthorized) return unauthorized;

    const bean = z
      .looseObject({
        beanId: z.string().optional(),
        functionName: z.string().optional(),
        args: z.array(z.unknown()).optional(),
      })
      .safeParse(body).data;
    const arg0 = z
      .looseObject({ "0": z.unknown().optional() })
      .safeParse(bean?.args?.[0]).data?.["0"];

    if (
      bean?.functionName === "searchProducts" ||
      bean?.beanId === "productServiceImpl"
    ) {
      const inner = z
        .looseObject({
          offset: z.number().optional(),
          limit: z.number().optional(),
          query: z
            .looseObject({
              "fallIntoCategories._id": z
                .looseObject({
                  $in: z.array(z.string()).optional(),
                })
                .optional(),
            })
            .optional(),
        })
        .safeParse(arg0).data;
      const categoryId = inner?.query?.["fallIntoCategories._id"]?.$in?.[0];
      const offset = inner?.offset ?? 0;
      const limit = inner?.limit ?? 50;
      if (categoryId === "artists") {
        const cmsItems =
          (await loadCmsCatalogFromPublic()).result?.data?.content ?? [];
        const byId = new Map<string, string>();
        for (const item of cmsItems) {
          for (const ref of item.productsRef ?? []) {
            const name = ref.name?.trim();
            if (ref.id && name) byId.set(ref.id, name);
          }
        }
        const all = [...byId.entries()]
          .map(([id, name]) => ({
            id,
            text: name,
            searchTerms: `${name},${name}`,
            translations: [{ text: name, lang: { isoCode: "ru" as const } }],
            skuIds: [] as string[],
          }))
          .sort((a, b) => a.text.localeCompare(b.text, "ru"));
        const content = all.slice(offset, offset + limit);
        const totalElements = all.length;
        return HttpResponse.json({
          result: {
            data: {
              content,
              totalElements,
              last: offset + content.length >= totalElements,
              number: limit > 0 ? Math.floor(offset / limit) : 0,
              size: limit,
            },
          },
        });
      }
      return HttpResponse.json({
        result: {
          data: {
            content: [],
            totalElements: 0,
            last: true,
            number: 0,
            size: limit,
          },
        },
      });
    }

    const attributeId = z.string().safeParse(arg0).data;

    if (bean?.functionName === "simpleFilterValues" && attributeId) {
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

    if (bean?.functionName === "listFilterValues" && attributeId) {
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
