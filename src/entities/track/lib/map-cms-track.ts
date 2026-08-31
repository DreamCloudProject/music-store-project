import { z } from "zod";

import type { Track } from "../model/types";

const cmsTrackSchema = z
  .looseObject({
    id: z.string(),
    name: z.string().nullish(),
    searchTerms: z.string().optional(),
    imageURLs: z.array(z.string()).optional(),
    documentURLs: z
      .array(
        z.looseObject({
          url: z.string(),
          name: z.string().optional(),
          type: z.string().optional(),
        }),
      )
      .optional(),
    favorite: z.boolean().optional(),
    attributeValues: z
      .array(
        z.object({
          attributeId: z.string(),
          value: z.string().nullish(),
        }),
      )
      .optional(),
  })
  .transform((item) => {
    const searchTerms = item.searchTerms?.trim() ?? "";
    const dashIdx = searchTerms.indexOf(" - ");
    const title =
      (dashIdx >= 0 ? searchTerms.slice(dashIdx + 3).trim() : searchTerms) ||
      item.name?.trim() ||
      item.id;
    const attributeValue = (attributeId: string) =>
      item.attributeValues
        ?.find((av) => av.attributeId === attributeId)
        ?.value?.trim() ?? "";
    const toAbs = (raw?: string) => {
      const url = raw?.trim();
      if (!url) return undefined;
      if (/^https?:\/\//i.test(url)) return url;
      return new URL(
        url.startsWith("/") ? url : `/${url}`,
        `${new URL(String(import.meta.env.VITE_API_BASE_URL), location.origin).origin}/`,
      ).href;
    };
    const coverUrl = toAbs(item.imageURLs?.find((url) => url.trim()));
    const audioUrl = toAbs(
      (
        item.documentURLs?.find((doc) =>
          /\.mp3(?:[?#]|$)/i.test(`${doc.url} ${doc.name ?? ""}`),
        ) ?? item.documentURLs?.[0]
      )?.url,
    );
    const durationRaw = attributeValue("duration");
    const favoriteAttr = attributeValue("favorite");
    return {
      id: item.id,
      title,
      artist: attributeValue("artist"),
      album: attributeValue("album"),
      favorite:
        item.favorite === true ||
        favoriteAttr === "true" ||
        favoriteAttr === "1",
      ...(coverUrl ? { coverUrl } : {}),
      ...(audioUrl ? { audioUrl } : {}),
      ...(durationRaw ? { duration: durationRaw } : {}),
    } satisfies Track;
  });

export function mapCmsTrack(raw: unknown): Track {
  return cmsTrackSchema.parse(raw);
}

export function mapCmsTracks(raw: unknown[]): Track[] {
  return z.array(cmsTrackSchema).parse(raw);
}
