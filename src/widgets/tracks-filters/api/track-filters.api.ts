import { apiFetch } from "@/features/auth";
import { z } from "zod";

import type {
  FilterOption,
  TrackFiltersResponse,
} from "../api/track-filters.types";

async function fetchFilterValues(
  functionName: "simpleFilterValues" | "listFilterValues",
  attributeId: string,
): Promise<FilterOption[]> {
  const response = await apiFetch(
    new URL(
      `${String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, "")}/bean/request`,
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
        beanId: "searchManagerServiceImpl",
        scope: "PROTOTYPE",
        functionName,
        args: [{ "0": attributeId }],
      }),
    },
  );
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }
  const raw: unknown = await response.json();

  if (functionName === "simpleFilterValues") {
    return (
      z
        .looseObject({
          result: z
            .array(
              z.looseObject({
                id: z.string(),
                value: z.string(),
              }),
            )
            .default([]),
        })
        .transform(({ result }) =>
          result
            .map((entry) => ({
              value: entry.value.trim(),
              label: entry.value.trim(),
            }))
            .filter((o) => o.value && o.label)
            .sort((a, b) => a.label.localeCompare(b.label, "ru")),
        )
        .safeParse(raw).data ?? []
    );
  }

  return (
    z
      .looseObject({
        result: z
          .array(
            z.looseObject({
              id: z.string(),
              value: z
                .looseObject({
                  id: z.string().optional(),
                  translations: z
                    .array(
                      z.looseObject({
                        text: z.string(),
                        lang: z
                          .looseObject({
                            isoCode: z.string().optional(),
                          })
                          .optional(),
                      }),
                    )
                    .default([]),
                })
                .optional(),
            }),
          )
          .default([]),
      })
      .transform(({ result }) =>
        result
          .map((entry) => {
            const translations = entry.value?.translations ?? [];
            const label =
              translations
                .find((t) => t.lang?.isoCode === "ru")
                ?.text?.trim() ||
              translations
                .find((t) => t.lang?.isoCode === "en")
                ?.text?.trim() ||
              entry.value?.id ||
              entry.id;
            return { value: entry.id, label };
          })
          .filter((o) => o.value && o.label)
          .sort((a, b) => a.label.localeCompare(b.label, "ru")),
      )
      .safeParse(raw).data ?? []
  );
}

export async function fetchTrackFilters(): Promise<TrackFiltersResponse> {
  const [artists, genres] = await Promise.all([
    fetchFilterValues("simpleFilterValues", "artist"),
    fetchFilterValues("listFilterValues", "genre"),
  ]);
  return {
    artists,
    genres,
    years: [
      { value: "newer", label: "Более новые" },
      { value: "older", label: "Более старые" },
    ],
  };
}
