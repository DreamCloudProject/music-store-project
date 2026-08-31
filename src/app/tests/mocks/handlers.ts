import { http, HttpResponse } from "msw";
import { z } from "zod";

import {
  filterTracksForUi,
  parseTracksRequestBody,
  type CmsSearchResultPayload,
  type CmsSellerSkuItem,
} from "@/widgets/tracks-catalog";
import {
  authHttpHandlers,
  handleAuthBean,
  requestUserEmail,
  unauthorizedIfInvalidBearer,
} from "../../tests/mocks/auth.handlers";

const favoritesByUser = new Map<string, Set<string>>();

function persistFavorites() {
  if (import.meta.env.MODE === "test") return;
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    "msw-favorites",
    JSON.stringify(
      [...favoritesByUser.entries()].map(([email, ids]) => [email, [...ids]]),
    ),
  );
}

(() => {
  if (import.meta.env.MODE === "test") return;
  if (typeof sessionStorage === "undefined") return;
  const stored = z
    .array(z.tuple([z.string(), z.array(z.string())]))
    .safeParse(
      JSON.parse(sessionStorage.getItem("msw-favorites") ?? "[]"),
    ).data;
  for (const [email, ids] of stored ?? []) {
    favoritesByUser.set(email, new Set(ids));
  }
})();

function favoriteIdsFor(request: Request) {
  const email = requestUserEmail(request) ?? "";
  const existing = favoritesByUser.get(email);
  if (existing) return existing;
  const created = new Set<string>();
  favoritesByUser.set(email, created);
  return created;
}

async function loadCmsCatalogFromPublic(): Promise<CmsSearchResultPayload> {
  const response = await fetch(
    new URL("tracks.json", new URL(import.meta.env.BASE_URL, location.origin)),
  );
  return (await response.json()) as CmsSearchResultPayload;
}

function withDemoAudio(item: CmsSellerSkuItem): CmsSellerSkuItem {
  if (item.documentURLs?.some((doc) => doc.url?.trim())) return item;
  return {
    ...item,
    documentURLs: [
      {
        url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        name: "demo.mp3",
        type: "audio/mpeg",
      },
    ],
  };
}

function withFavorite(
  item: CmsSellerSkuItem,
  favoriteIds: Set<string>,
): CmsSellerSkuItem {
  const withAudio = withDemoAudio(item);
  const favorite = favoriteIds.has(withAudio.id);
  const attributeValues = [
    ...(withAudio.attributeValues ?? []).filter(
      (av) => av.attributeId !== "favorite",
    ),
    {
      attributeId: "favorite",
      value: favorite ? "true" : "false",
    },
  ];
  return { ...withAudio, favorite, attributeValues };
}

function filterAndPaginate(
  cmsPayload: CmsSearchResultPayload,
  parsed: ReturnType<typeof parseTracksRequestBody>,
  favoriteIds: Set<string>,
) {
  let cmsItems = (cmsPayload.result?.data?.content ?? []).map((item) =>
    withFavorite(item, favoriteIds),
  );
  if (parsed.ids?.length) {
    const byId = new Map(cmsItems.map((item) => [item.id, item]));
    cmsItems = parsed.ids.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });
  }
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

    const favoriteIds = favoriteIdsFor(request);

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

    if (bean?.functionName === "getFavoriteSellerSKUs") {
      const cmsItems =
        (await loadCmsCatalogFromPublic()).result?.data?.content ?? [];
      const byId = new Map(cmsItems.map((item) => [item.id, item]));
      return HttpResponse.json({
        result: [...favoriteIds].map((id) =>
          withFavorite(byId.get(id) ?? { id }, favoriteIds),
        ),
      });
    }

    if (bean?.functionName === "addFavoriteSellerSKU") {
      const id = z.string().safeParse(arg0).data;
      if (!id) {
        return HttpResponse.json({ result: null }, { status: 400 });
      }
      favoriteIds.add(id);
      persistFavorites();
      return HttpResponse.json({ result: [...favoriteIds] });
    }

    if (bean?.functionName === "removeFavoriteSellerSKU") {
      const id = z.string().safeParse(arg0).data;
      if (!id) {
        return HttpResponse.json({ result: null }, { status: 400 });
      }
      favoriteIds.delete(id);
      persistFavorites();
      return HttpResponse.json({ result: null });
    }

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
      favoriteIds,
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
