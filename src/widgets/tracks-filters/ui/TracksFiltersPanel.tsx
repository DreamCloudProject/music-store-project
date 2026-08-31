import * as React from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { cn } from "@/shared/lib";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/shared/ui/carousel";
import { FilterSelect } from "@/shared/ui/filter-select";

import {
  useArtistProductsQuery,
  useTrackFiltersQuery,
} from "../api/track-filters.query";

export interface TracksFiltersPanelProps {
  label?: string;
  className?: string;
}

function ArtistFilter({ preferDrag }: { preferDrag?: boolean }) {
  const navigate = useNavigate();
  const { artists: selectedArtists = [] } = useSearch({
    strict: false,
  }) as { artists?: string[] };
  const artistsQuery = useArtistProductsQuery();
  const artists = artistsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <FilterSelect
      preferDrag={preferDrag}
      multiselect
      options={artists}
      selected={selectedArtists}
      hasNextPage={artistsQuery.hasNextPage}
      isFetchingNextPage={artistsQuery.isFetchingNextPage}
      onLoadMore={() => {
        void artistsQuery.fetchNextPage();
      }}
      onSelectedChange={(next) =>
        void navigate({
          to: ".",
          search: ((prev: Record<string, unknown>) => ({
            ...prev,
            artists: next,
          })) as never,
          replace: true,
        })
      }
      triggerLabel="исполнителю"
      aria-label={
        selectedArtists.length
          ? `Выбрать исполнителя, ${selectedArtists.length} в наборе`
          : "Выбрать исполнителя"
      }
    />
  );
}

function YearFilter({ preferDrag }: { preferDrag?: boolean }) {
  const navigate = useNavigate();
  const { year: selectedYear } = useSearch({ strict: false }) as {
    year?: string;
  };
  const { data: { years = [] } = {} } = useTrackFiltersQuery();

  return (
    <FilterSelect
      preferDrag={preferDrag}
      multiselect={false}
      showControls
      options={years}
      value={selectedYear}
      onValueChange={(next) =>
        void navigate({
          to: ".",
          search: ((prev: Record<string, unknown>) => ({
            ...prev,
            year: next,
          })) as never,
          replace: true,
        })
      }
      triggerLabel="году выпуска"
      horizontal
      aria-label="Выбрать порядок по году выпуска"
    />
  );
}

function GenreFilter({ preferDrag }: { preferDrag?: boolean }) {
  const navigate = useNavigate();
  const { genres: selectedGenres = [] } = useSearch({
    strict: false,
  }) as { genres?: string[] };
  const { data: { genres = [] } = {} } = useTrackFiltersQuery();

  return (
    <FilterSelect
      preferDrag={preferDrag}
      multiselect
      options={genres}
      selected={selectedGenres}
      onSelectedChange={(next) =>
        void navigate({
          to: ".",
          search: ((prev: Record<string, unknown>) => ({
            ...prev,
            genres: next,
          })) as never,
          replace: true,
        })
      }
      triggerLabel="жанру"
      aria-label={
        selectedGenres.length
          ? `Выбрать жанр, ${selectedGenres.length} в наборе`
          : "Выбрать жанр"
      }
    />
  );
}

export function TracksFiltersPanel({
  label = "Искать по:",
  className,
}: TracksFiltersPanelProps) {
  const {
    artists: selectedArtists = [],
    genres: selectedGenres = [],
    year: selectedYear,
  } = useSearch({ strict: false }) as {
    artists?: string[];
    genres?: string[];
    year?: string;
  };

  const [api, setApi] = React.useState<CarouselApi>();
  const activeSlide =
    selectedArtists.length > 0
      ? 0
      : selectedYear
        ? 1
        : selectedGenres.length > 0
          ? 2
          : 0;

  React.useEffect(() => {
    if (!api) return;
    api.scrollTo(activeSlide);
  }, [api, activeSlide]);

  return (
    <>
      <div
        className={cn(
          "mb-[51px] hidden items-center gap-[15px] md:flex",
          className,
        )}
        role="toolbar"
        aria-label="Фильтры по трекам"
      >
        <span className="text-base font-normal leading-[1.15] tracking-[0.001em] text-fg">
          {label}
        </span>
        <div className="flex gap-[10px]">
          <ArtistFilter />
          <YearFilter />
          <GenreFilter />
        </div>
      </div>

      <div
        className={cn(
          "mb-[51px] flex min-w-0 flex-col gap-[15px] md:hidden",
          className,
        )}
        role="toolbar"
        aria-label="Фильтры по трекам"
      >
        <span className="text-base font-normal leading-[1.15] tracking-[0.001em] text-fg">
          {label}
        </span>
        <Carousel
          opts={{ align: "center", containScroll: "trimSnaps" }}
          setApi={setApi}
          className="w-full"
        >
          <CarouselContent className="-ml-[10px]">
            <CarouselItem className="basis-auto pl-[10px]">
              <ArtistFilter preferDrag />
            </CarouselItem>
            <CarouselItem className="basis-auto pl-[10px]">
              <YearFilter preferDrag />
            </CarouselItem>
            <CarouselItem className="basis-auto pl-[10px]">
              <GenreFilter preferDrag />
            </CarouselItem>
          </CarouselContent>
        </Carousel>
      </div>
    </>
  );
}
