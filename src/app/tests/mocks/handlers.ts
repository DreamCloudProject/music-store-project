import { http, HttpResponse } from "msw";
import { z } from "zod";

import { parseTracksRequestBody } from "../../api/tracks.api";
import type { CmsSearchResultPayload } from "../../api/tracks.types";
import { filterTracksForUi } from "../../lib/filter-tracks-for-ui";

async function loadCmsCatalogFromPublic(): Promise<
  CmsSearchResultPayload & {
    genreLabels?: Record<string, string>;
  }
> {
  const base = new URL(import.meta.env.BASE_URL, location.origin);
  const primary = await fetch(new URL("tracks.json", base));
  if (primary.ok) {
    return (await primary.json()) as CmsSearchResultPayload & {
      genreLabels?: Record<string, string>;
    };
  }
  const sample = await fetch(new URL("tracks.sample.json", base));
  if (!sample.ok) {
    throw new Error(`Failed to load tracks catalog: ${primary.status}`);
  }
  return (await sample.json()) as CmsSearchResultPayload & {
    genreLabels?: Record<string, string>;
  };
}

async function loadPlaylistsFromPublic(): Promise<unknown> {
  const response = await fetch(
    new URL(
      "playlists.json",
      new URL(import.meta.env.BASE_URL, location.origin),
    ),
  );
  return response.json();
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
    playlistSkuIds: [],
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
        beanId: z.string().optional(),
        functionName: z.string().optional(),
        args: z.array(z.unknown()).optional(),
      })
      .safeParse(body).data;

    if (
      bean?.functionName === "searchProducts" ||
      bean?.beanId === "productServiceImpl"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      return HttpResponse.json(
        (await loadPlaylistsFromPublic()) as Record<string, unknown>,
      );
    }

    if (bean?.functionName === "simpleFilterValues") {
      const attributeId = z
        .looseObject({
          args: z
            .array(z.looseObject({ "0": z.string().optional() }))
            .optional(),
        })
        .safeParse(body).data?.args?.[0]?.["0"];
      if (attributeId) {
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
    }

    if (bean?.functionName === "listFilterValues") {
      const cmsPayload = await loadCmsCatalogFromPublic();
      const cmsItems = cmsPayload.result?.data?.content ?? [];
      const genreLabels = cmsPayload.genreLabels ?? {};
      const genreSet = new Set<string>();
      for (const item of cmsItems) {
        const genre = item.attributeValues?.find(
          (av) => av.attributeId === "genre",
        )?.value;
        if (genre) genreSet.add(genre);
      }
      return HttpResponse.json({
        result: [...genreSet]
          .sort((a, b) =>
            (genreLabels[a] ?? a).localeCompare(genreLabels[b] ?? b, "ru"),
          )
          .map((id) => {
            const label =
              genreLabels[id] ??
              id
                .split("-")
                .filter(Boolean)
                .map((w) => w[0]!.toUpperCase() + w.slice(1))
                .join(" ");
            return {
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
                searchTerms: `${label},${label}`,
                imageURLs: [],
                translations: [
                  {
                    id: `translation-${id}-ru`,
                    text: label,
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
            };
          }),
      });
    }

    if (bean?.functionName === "searchSKUs") {
      const productId = z
        .looseObject({
          args: z
            .array(
              z.looseObject({
                "0": z
                  .looseObject({
                    query: z
                      .looseObject({
                        "fallIntoProducts._id": z
                          .looseObject({
                            $in: z.array(z.string()).optional(),
                          })
                          .optional(),
                      })
                      .optional(),
                  })
                  .optional(),
              }),
            )
            .optional(),
        })
        .safeParse(body).data?.args?.[0]?.["0"]?.query?.["fallIntoProducts._id"]
        ?.$in?.[0];

      const playlists = z
        .looseObject({
          result: z
            .looseObject({
              data: z
                .looseObject({
                  content: z
                    .array(
                      z.looseObject({
                        id: z.string(),
                        skuIds: z.array(z.string()).default([]),
                      }),
                    )
                    .default([]),
                })
                .optional(),
            })
            .optional(),
        })
        .safeParse(await loadPlaylistsFromPublic());

      const skuIds = new Set(
        playlists.data?.result?.data?.content.find((p) => p.id === productId)
          ?.skuIds ?? [],
      );
      const cmsItems =
        (await loadCmsCatalogFromPublic()).result?.data?.content ?? [];
      const content = cmsItems
        .filter((item) => {
          const skuId = item.embeddedSku?.id;
          return skuId ? skuIds.has(skuId) : false;
        })
        .map((item) => ({
          id: item.embeddedSku?.id ?? item.id,
          name: null,
          active: true,
          searchTerms: item.searchTerms ?? "",
          text: item.searchTerms ?? item.embeddedSku?.id ?? item.id,
          translation: item.searchTerms ?? "",
          alias: "SKU",
          parentProducts: productId ? [productId] : [],
          sellerSkuIds: [item.id],
          documentURLs: [],
          imageURLs: item.imageURLs ?? [],
        }));

      return HttpResponse.json({
        result: {
          pages: [],
          data: {
            content,
            totalElements: content.length,
            last: true,
            number: 0,
            size: content.length,
          },
        },
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
