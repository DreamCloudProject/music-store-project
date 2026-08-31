import {
  useMutation,
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  fetchAddFavoriteSellerSku,
  fetchFavoriteSellerSkuIds,
  fetchRemoveFavoriteSellerSku,
} from "../api/favorite-tracks.api";

function patchFavoriteIds(
  old: string[] | null | undefined,
  id: string,
  favorite: boolean,
) {
  const current = old ?? [];
  return favorite
    ? current.includes(id)
      ? current
      : [...current, id]
    : current.filter((item) => item !== id);
}

export function useFavoriteSellerSkuIdsQuery() {
  return useQuery({
    queryKey: ["tracks", "favorites"],
    queryFn: async () => {
      try {
        return await fetchFavoriteSellerSkuIds();
      } catch {
        return null;
      }
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useToggleTrackFavoriteMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["tracks", "favorite-toggle"],
    mutationFn: async ({
      id,
      favorite,
    }: {
      id: string;
      favorite: boolean;
    }) => {
      if (favorite) {
        await fetchAddFavoriteSellerSku(id);
        return { id, favorite: true };
      }
      await fetchRemoveFavoriteSellerSku(id);
      return { id, favorite: false };
    },
    onMutate: async ({ id, favorite }) => {
      await queryClient.cancelQueries({ queryKey: ["tracks", "favorites"] });
      queryClient.setQueryData<string[] | null>(["tracks", "favorites"], (old) =>
        patchFavoriteIds(old, id, favorite),
      );
    },
    onError: (_error, { id, favorite }) => {
      queryClient.setQueryData<string[] | null>(["tracks", "favorites"], (old) =>
        patchFavoriteIds(old, id, !favorite),
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tracks", "favorites"] });
      await queryClient.invalidateQueries({
        queryKey: ["tracks", "favorites-skus"],
      });
    },
  });
}

export function useFavoritePulse(trackId: string): "add" | "remove" | null {
  const pending = useMutationState({
    filters: { mutationKey: ["tracks", "favorite-toggle"], status: "pending" },
    select: (mutation) =>
      mutation.state.variables as
        | { id?: string; favorite?: boolean }
        | undefined,
  }).find((variables) => variables?.id === trackId);
  if (!pending) return null;
  return pending.favorite ? "add" : "remove";
}
