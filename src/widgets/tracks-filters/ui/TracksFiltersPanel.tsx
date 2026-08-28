import { useNavigate, useSearch } from "@tanstack/react-router";

import { cn } from "@/shared/lib";
import { FilterSelect } from "@/shared/ui/filter-select";

import { useTrackFiltersQuery } from "../api/track-filters.query";

export interface TracksFiltersPanelProps {
  label?: string;
  className?: string;
}

export function TracksFiltersPanel({
  label = "Искать по:",
  className,
}: TracksFiltersPanelProps) {
  const navigate = useNavigate();
  const {
    search: urlSearch,
    artists: selectedArtists,
    genres: selectedGenres,
    year: selectedYear,
  } = useSearch({
    from: "/_studio/",
  });

  const { data: { artists = [], genres = [], years = [] } = {} } =
    useTrackFiltersQuery();

  return (
    <div
      className={cn("flex gap-[15px] items-center mb-[51px]", className)}
      role="toolbar"
      aria-label="Фильтры по трекам"
    >
      <span className="text-base leading-[1.15] text-white font-normal tracking-[0.001em]">
        {label}
      </span>
      <div className="flex gap-[10px]">
        <FilterSelect
          multiselect
          options={artists}
          selected={selectedArtists}
          onSelectedChange={(next) =>
            void navigate({
              to: "/",
              search: {
                search: urlSearch,
                artists: next,
                genres: selectedGenres,
                year: selectedYear,
              },
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
        <FilterSelect
          multiselect={false}
          showControls
          options={years}
          value={selectedYear}
          onValueChange={(next) =>
            void navigate({
              to: "/",
              search: {
                search: urlSearch,
                artists: selectedArtists,
                genres: selectedGenres,
                year: next,
              },
              replace: true,
            })
          }
          triggerLabel="году выпуска"
          horizontal
          aria-label="Выбрать порядок по году выпуска"
        />
        <FilterSelect
          multiselect
          options={genres}
          selected={selectedGenres}
          onSelectedChange={(next) =>
            void navigate({
              to: "/",
              search: {
                search: urlSearch,
                artists: selectedArtists,
                genres: next,
                year: selectedYear,
              },
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
      </div>
    </div>
  );
}
