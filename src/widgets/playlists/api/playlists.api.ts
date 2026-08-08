import { z } from "zod";

import type { PlaylistsResponse } from "../api/playlists.types";

const cmsProductSchema = z.looseObject({
  id: z.string(),
  text: z.string().nullish(),
  searchTerms: z.string().optional(),
  skuIds: z.array(z.string()).default([]),
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
});

function titleFromProduct(product: z.infer<typeof cmsProductSchema>): string {
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

function parsePlaylistsPayload(raw: unknown): PlaylistsResponse {
  const page = z
    .looseObject({
      result: z
        .looseObject({
          data: z
            .looseObject({
              content: z.array(cmsProductSchema).default([]),
            })
            .optional(),
        })
        .optional(),
    })
    .safeParse(raw);

  if (page.success && page.data.result?.data?.content) {
    return page.data.result.data.content.map((product) => ({
      id: product.id.trim(),
      title: titleFromProduct(product),
      skuIds: product.skuIds.map((id) => id.trim()).filter(Boolean),
    }));
  }

  return (
    z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          skuIds: z.array(z.string()).default([]),
        }),
      )
      .transform((items) =>
        items.map((item) => ({
          id: item.id.trim(),
          title: item.title.trim(),
          skuIds: item.skuIds.map((id) => id.trim()).filter(Boolean),
        })),
      )
      .safeParse(raw).data ?? []
  );
}

/** CMS: productServiceImpl.searchProducts в category `playlists`. */
export async function fetchPlaylists(): Promise<PlaylistsResponse> {
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
        beanId: "productServiceImpl",
        scope: "PROTOTYPE",
        functionName: "searchProducts",
        args: [
          {
            "0": {
              query: {
                "fallIntoCategories._id": { $in: ["playlists"] },
              },
              ignoreRegexWrap: [],
              offset: 0,
              limit: 50,
              visiblePages: 10,
              page: 1,
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
  return parsePlaylistsPayload(await response.json());
}
