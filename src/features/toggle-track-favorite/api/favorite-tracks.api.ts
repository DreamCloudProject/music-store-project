import { z } from "zod";

import { apiFetch } from "@/features/auth";

function beanRequestUrl() {
  return new URL(
    `${String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")}/bean/request`,
    location.origin,
  );
}

async function postSellerFavorite(
  functionName: string,
  sellerSkuId?: string,
): Promise<unknown> {
  const response = await apiFetch(beanRequestUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Site-Context": "site",
      "Lang-Context": "ru",
    },
    body: JSON.stringify({
      beanId: "sellerRegistrationServiceImpl",
      scope: "PROTOTYPE",
      functionName,
      args: sellerSkuId == null ? [] : [{ "0": sellerSkuId }],
    }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const text = await response.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/** Непонятный / пустой / null-ответ CMS — пустой список, не ошибка. */
function parseFavoriteSkuIds(raw: unknown): string[] {
  const fromUnknown = (value: unknown): string[] => {
    const parsed = z
      .union([
        z.null().transform(() => [] as string[]),
        z.undefined().transform(() => [] as string[]),
        z.string().transform((id) => {
          const trimmed = id.trim();
          return trimmed ? [trimmed] : [];
        }),
        z.array(z.unknown()).transform((items) => items.flatMap(fromUnknown)),
        z
          .looseObject({
            id: z.string().optional(),
            result: z.unknown().optional(),
            data: z.unknown().optional(),
            content: z.unknown().optional(),
            items: z.unknown().optional(),
          })
          .transform((obj) => [
            ...(obj.id?.trim() ? [obj.id.trim()] : []),
            ...fromUnknown(obj.result),
            ...fromUnknown(obj.data),
            ...fromUnknown(obj.content),
            ...fromUnknown(obj.items),
          ]),
      ])
      .safeParse(value);
    return parsed.success ? parsed.data : [];
  };
  return [...new Set(fromUnknown(raw))];
}

export async function fetchFavoriteSellerSkuIds(): Promise<string[]> {
  return parseFavoriteSkuIds(await postSellerFavorite("getFavoriteSellerSKUs"));
}

export async function fetchAddFavoriteSellerSku(
  sellerSkuId: string,
): Promise<string[]> {
  const ids = parseFavoriteSkuIds(
    await postSellerFavorite("addFavoriteSellerSKU", sellerSkuId),
  );
  return ids.includes(sellerSkuId) ? ids : [...ids, sellerSkuId];
}

export async function fetchRemoveFavoriteSellerSku(
  sellerSkuId: string,
): Promise<void> {
  await postSellerFavorite("removeFavoriteSellerSKU", sellerSkuId);
}
