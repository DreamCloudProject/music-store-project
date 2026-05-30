import { http, HttpResponse } from "msw";

import { parseTracksRequestBody } from "../api/tracks.api";
import type { CmsSearchResultPayload } from "../api/tracks.types";
import type { TrackFiltersResponse } from "@/widgets/tracks-filters";
import { filterTracksForUi } from "../lib/filter-tracks-for-ui";

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
  http.post("*/api/v1/bean/tracks/filters", async () => {
    const cmsPayload = await loadCmsCatalogFromPublic();
    const cmsItems = cmsPayload.result?.data?.content ?? [];
    const bySlug = new Map<string, string>();
    for (const item of cmsItems) {
      const slug =
        item.productsRef?.[0]?.id ??
        slugify(
          item.attributeValues?.find((av) => av.attributeId === "artist")
            ?.value ?? "",
        );
      const label =
        item.attributeValues?.find((av) => av.attributeId === "artist")
          ?.value ??
        item.productsRef?.[0]?.name ??
        slug;
      if (slug && !bySlug.has(slug)) bySlug.set(slug, label);
    }
    const artists = [...bySlug.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "ru"));

    const genreSet = new Set<string>();
    for (const item of cmsItems) {
      const genre = item.attributeValues?.find(
        (av) => av.attributeId === "genre",
      )?.value;
      if (genre) genreSet.add(genre);
    }
    const genres = [...genreSet]
      .sort((a, b) => a.localeCompare(b, "ru"))
      .map((value) => ({
        value,
        label:
          (
            {
              edm: "EDM",
            } as Record<string, string>
          )[value] ?? value,
      }));

    const payload: TrackFiltersResponse = {
      artists,
      genres,
      years: [
        { value: "newer", label: "Более новые" },
        { value: "older", label: "Более старые" },
      ],
    };
    return HttpResponse.json(payload);
  }),

  http.post("*/api/v1/bean/request", async ({ request }) => {
    const body = (await request.json()) as unknown;
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
