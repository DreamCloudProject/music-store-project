import { z } from "zod";

import type { Track } from "../model/types";

const cmsTrackSchema = z
  .looseObject({
    id: z.string(),
    name: z.string().nullish(),
    searchTerms: z.string().optional(),
    imageURLs: z.array(z.string()).optional(),
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
    const coverUrl = item.imageURLs?.find((url) => url.trim())?.trim();
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
      ...(durationRaw ? { duration: durationRaw } : {}),
    } satisfies Track;
  });

export function mapCmsTrack(raw: unknown): Track {
  return cmsTrackSchema.parse(raw);
}

export function mapCmsTracks(raw: unknown[]): Track[] {
  return z.array(cmsTrackSchema).parse(raw);
}
