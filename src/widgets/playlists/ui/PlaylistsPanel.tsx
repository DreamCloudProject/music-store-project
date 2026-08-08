import * as React from "react";
import { Link, useParams, useSearch } from "@tanstack/react-router";

import { cn } from "@/shared/lib";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/shared/ui/carousel";
import { Skeleton } from "@/shared/ui/skeleton";

import { usePlaylistsQuery } from "../api/playlists.query";
import type { Playlist } from "../api/playlists.types";

const cardClassName = cn(
  "flex h-[150px] w-[250px] cursor-pointer items-center justify-center",
  "bg-linear-to-b from-[#271a58] to-[#7868cc] opacity-80",
  "px-[22px] text-center text-2xl leading-[1.33] tracking-[-0.005em] text-white no-underline",
  "transition-shadow duration-200",
  "hover:shadow-[0_0_24px_6px_rgba(80,65,146,0.55)]",
  "active:shadow-[0_0_8px_2px_rgba(80,65,146,0.85)]",
);

function PlaylistCard({
  playlist,
  search,
}: {
  playlist: Playlist;
  search: string;
}) {
  return (
    <Link
      to="/playlist/$playlistId"
      params={{ playlistId: playlist.id }}
      search={{
        search,
        artists: [],
        genres: [],
        year: undefined,
      }}
      className={cardClassName}
      title={playlist.title}
    >
      {playlist.title}
    </Link>
  );
}

function PlaylistsSkeleton({ className }: { className?: string }) {
  return (
    <ul className={cn("m-0 flex list-none flex-col gap-[30px] p-0", className)}>
      {[0, 1, 2].map((key) => (
        <li key={key}>
          <Skeleton className="h-[150px] w-[250px] rounded-none" />
        </li>
      ))}
    </ul>
  );
}

function PlaylistsSkeletonCarousel() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[0, 1, 2].map((key) => (
        <Skeleton
          key={key}
          className="h-[150px] w-[250px] shrink-0 rounded-none"
        />
      ))}
    </div>
  );
}

/** Колонка справа от 1300px; ниже — Carousel под фильтрами. */
export function PlaylistsPanel({
  className,
  layout,
}: {
  className?: string;
  layout: "desktop" | "mobile";
}) {
  const { data: playlists = [], isPending, isError } = usePlaylistsQuery();
  const { search = "" } = useSearch({ strict: false }) as {
    search?: string;
  };
  const { playlistId } = useParams({ strict: false }) as {
    playlistId?: string;
  };
  const [api, setApi] = React.useState<CarouselApi>();
  const activeSlide = Math.max(
    0,
    playlists.findIndex((playlist) => playlist.id === playlistId),
  );

  React.useEffect(() => {
    if (!api || layout !== "mobile" || playlists.length === 0) return;
    api.scrollTo(activeSlide);
  }, [api, activeSlide, playlists.length, layout]);

  if (layout === "desktop") {
    return (
      <aside
        className={cn(
          "hidden flex-1 justify-center pt-[232px] pl-[70px] min-[1300px]:flex",
          className,
        )}
      >
        <nav aria-label="Плейлисты">
          {isPending || isError ? (
            <PlaylistsSkeleton />
          ) : (
            <ul className="m-0 flex list-none flex-col gap-[30px] p-0">
              {playlists.map((playlist) => (
                <li key={playlist.id}>
                  <PlaylistCard playlist={playlist} search={search} />
                </li>
              ))}
            </ul>
          )}
        </nav>
      </aside>
    );
  }

  return (
    <nav
      aria-label="Плейлисты"
      className={cn("my-[25.5px] min-[1300px]:hidden", className)}
    >
      {isPending || isError ? (
        <PlaylistsSkeletonCarousel />
      ) : (
        <Carousel
          opts={{ align: "center", containScroll: "trimSnaps" }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {playlists.map((playlist) => (
              <CarouselItem key={playlist.id} className="basis-auto pl-4">
                <PlaylistCard playlist={playlist} search={search} />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
    </nav>
  );
}
