/** Внутренний объект поиска SellerSKU (тело search или args[0]["0"]). */
export interface CmsSellerSkuSearchArgs {
  type: "SellerSKU";
  searchTerm?: string;
  query: Record<string, unknown>;
  ignoreRegexWrap: string[];
  offset?: number;
  limit?: number;
  visiblePages?: number;
  page?: number;
  sortName?: string;
  sortDirection?: "ASC" | "DESC";
  filteringStrategy?: string;
}

export interface CmsBeanSearchRequest {
  beanId: string;
  scope: string;
  functionName: string;
  args: [{ "0": CmsSellerSkuSearchArgs }];
}

export interface CmsAttributeValue {
  id?: string;
  attributeId: string;
  value?: string | null;
}

/** Транспорт CMS SellerSKU (+ поля SKU при склейке). */
export interface CmsSellerSkuItem {
  id: string;
  name?: string | null;
  searchTerms?: string;
  createdDate?: number;
  lastModifiedDate?: number;
  productsRef?: { id: string; name: string }[];
  attributeValues?: CmsAttributeValue[];
  documentURLs?: { url: string; name?: string; type?: string }[];
  imageURLs?: string[];
  embeddedSku?: { id: string; name?: string | null } | null;
  publishedForSale?: boolean;
}

export interface CmsSearchResultPayload {
  result: {
    pages?: unknown[];
    data: {
      content: CmsSellerSkuItem[];
      totalElements: number;
      last: boolean;
      number: number;
      size: number;
    };
  };
}

export interface GetTracksParams {
  artists?: string[];
  genres?: string[];
  search?: string;
  year?: string;
  /** SKU.id из плейлиста (Product.skuIds); пустой = без фильтра плейлиста. */
  playlistSkuIds?: string[];
}

/** Параметры списка в UI. */
export type TracksUiParams = Required<
  Pick<GetTracksParams, "artists" | "genres" | "playlistSkuIds">
> & {
  search: string;
} & Pick<GetTracksParams, "year">;

export interface TracksPageResponse {
  items: CmsSellerSkuItem[];
  nextOffset: number | null;
}

/**
 * UI-трек: склейка SKU (карточка) + SellerSKU (офер/файл).
 * id = SellerSKU.id (ключ списка/плеера); skuId = стабильный id трека в CMS.
 */
export interface Track {
  id: string;
  skuId: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  coverUrl?: string;
  audioUrl?: string;
  durationSec?: number;
}
