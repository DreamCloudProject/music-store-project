import type { MouseEvent } from "react";

import { cn } from "@/shared/lib";

import {
  useFavoritePulse,
  useFavoriteSellerSkuIdsQuery,
  useToggleTrackFavoriteMutation,
} from "../api/favorite-tracks.query";

export interface TrackFavoriteToggleProps {
  trackId: string;
  favorite: boolean;
  className?: string;
}

export function TrackFavoriteToggle({
  trackId,
  favorite,
  className,
}: TrackFavoriteToggleProps) {
  const toggleFavorite = useToggleTrackFavoriteMutation();
  const { data: favoriteIds } = useFavoriteSellerSkuIdsQuery();
  const isFavorite = favoriteIds ? favoriteIds.includes(trackId) : favorite;
  const pulse = useFavoritePulse(trackId);
  const locked = pulse != null;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (locked) return;
    toggleFavorite.mutate({ id: trackId, favorite: !isFavorite });
  };

  return (
    <button
      type="button"
      aria-label={
        isFavorite ? "Убрать из избранного" : "Добавить в избранное"
      }
      aria-pressed={isFavorite}
      aria-busy={locked}
      disabled={locked}
      onClick={handleClick}
      data-favorite={isFavorite ? "true" : "false"}
      {...(pulse ? { "data-pulse": pulse } : {})}
      className={cn(
        "track-fav-toggle flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent p-0",
        "focus-visible:outline-none",
        "disabled:pointer-events-none disabled:cursor-wait",
        className,
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="15"
        height="13"
        fill="none"
        aria-hidden="true"
        className="fav-icon"
        viewBox="0 0 15 13"
      >
        <path
          d="M7.5 1.8c1-.9 3.4-2.1 5.6-.5 3.4 2.4.3 7.7-5.6 11.2m0-10.7C6.5.9 4-.3 1.9 1.3-1.5 3.7 1.6 9 7.5 12.5"
          className="fav-icon__heart"
        />
        <path d="M.3.4 14 12.5" className="fav-icon__cross" />
      </svg>
    </button>
  );
}
