import type { CmsSellerSkuItem, Track } from "../api/tracks.types";

function cmsOrigin(): string {
  try {
    const base = String(import.meta.env.VITE_API_BASE_URL ?? "");
    if (/^https?:\/\//i.test(base)) return new URL(base).origin;
  } catch {
    /* ignore */
  }
  return location.origin;
}

/** Относительные CDN-пути CMS → абсолютный URL. */
export function resolveCmsAssetUrl(
  path: string | undefined | null,
): string | undefined {
  const raw = path?.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  const origin = cmsOrigin();
  return raw.startsWith("/") ? `${origin}${raw}` : `${origin}/${raw}`;
}

function attributeValue(item: CmsSellerSkuItem, attributeId: string): string {
  return (
    item.attributeValues
      ?.find((av) => av.attributeId === attributeId)
      ?.value?.trim() ?? ""
  );
}

function titleFromSellerSku(item: CmsSellerSkuItem): string {
  const searchTerms = item.searchTerms?.trim() ?? "";
  const dashIdx = searchTerms.indexOf(" - ");
  return (
    (dashIdx >= 0 ? searchTerms.slice(dashIdx + 3).trim() : searchTerms) ||
    item.name?.trim() ||
    item.embeddedSku?.id ||
    item.id
  );
}

/** SellerSKU (+ опциональные поля SKU) → единый Track для UI. */
export function mapSellerSkuToTrack(item: CmsSellerSkuItem): Track {
  const durationRaw = attributeValue(item, "track-duration");
  const durationSec = durationRaw ? Number(durationRaw) : undefined;
  return {
    id: item.id,
    skuId: item.embeddedSku?.id?.trim() || item.id,
    title: titleFromSellerSku(item),
    artist: attributeValue(item, "artist"),
    album: attributeValue(item, "album"),
    genre: attributeValue(item, "genre"),
    coverUrl: resolveCmsAssetUrl(item.imageURLs?.[0]),
    audioUrl: resolveCmsAssetUrl(item.documentURLs?.[0]?.url),
    durationSec:
      durationSec != null && Number.isFinite(durationSec)
        ? durationSec
        : undefined,
  };
}
