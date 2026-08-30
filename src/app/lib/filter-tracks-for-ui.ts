import type { CmsSellerSkuItem, GetTracksParams } from "../api/tracks.types";

export function filterTracksForUi(
  tracks: CmsSellerSkuItem[],
  params: Required<
    Pick<GetTracksParams, "artists" | "genres" | "search" | "playlistSkuIds">
  > &
    Pick<GetTracksParams, "year">,
): CmsSellerSkuItem[] {
  return Object.entries({
    playlist: (out: CmsSellerSkuItem[]) => {
      if (!params.playlistSkuIds.length) return out;
      const allowed = new Set(params.playlistSkuIds);
      return out.filter((t) => {
        const skuId = t.embeddedSku?.id?.trim();
        return skuId ? allowed.has(skuId) : false;
      });
    },
    artists: (out: CmsSellerSkuItem[]) => {
      if (!params.artists.length) return out;
      const allowed = new Set(params.artists);
      return out.filter((t) =>
        allowed.has(
          t.attributeValues
            ?.find((av) => av.attributeId === "artist")
            ?.value?.trim() ?? "",
        ),
      );
    },
    genres: (out: CmsSellerSkuItem[]) => {
      if (!params.genres.length) return out;
      const allowed = new Set(params.genres);
      return out.filter((t) =>
        allowed.has(
          t.attributeValues?.find((av) => av.attributeId === "genre")?.value ??
            "",
        ),
      );
    },
    search: (out: CmsSellerSkuItem[]) => {
      if (!params.search.length) return out;
      const needle = params.search.toLowerCase();
      return out.filter((t) => {
        const album =
          t.attributeValues?.find((av) => av.attributeId === "album")?.value ??
          "";
        const artist =
          t.attributeValues?.find((av) => av.attributeId === "artist")?.value ??
          "";
        return `${t.searchTerms ?? ""}\u0000${t.name ?? ""}\u0000${artist}\u0000${album}`
          .toLowerCase()
          .includes(needle);
      });
    },
    year: (out: CmsSellerSkuItem[]) => {
      if (!params.year) return out;
      return out.toSorted((a, b) => {
        const ay = a.createdDate ?? a.lastModifiedDate ?? 0;
        const by = b.createdDate ?? b.lastModifiedDate ?? 0;
        if (params.year === "newer") return by - ay;
        if (params.year === "older") return ay - by;
        return 0;
      });
    },
  }).reduce<CmsSellerSkuItem[]>((out, [, step]) => step(out), tracks);
}
