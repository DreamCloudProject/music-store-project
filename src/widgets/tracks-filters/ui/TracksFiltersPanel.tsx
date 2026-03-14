import { useAppContext } from "@/app/context/AppContext";
import { cn } from "@/shared/lib/utils";

import { FilterByArtist } from "./FilterByArtist";
import { FilterByGenre } from "./FilterByGenre";
import { FilterByYear } from "./FilterByYear";

export interface TracksFiltersPanelProps {
  label?: string;
  className?: string;
}

export function TracksFiltersPanel({
  label = "Искать по:",
  className,
}: TracksFiltersPanelProps) {
  const {
    artistOptions,
    selectedArtists,
    setSelectedArtists,
    genreOptions,
    selectedGenres,
    setSelectedGenres,
    yearOrder,
    setYearOrder,
  } = useAppContext();

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
        <FilterByArtist
          options={artistOptions}
          selected={selectedArtists}
          onSelectedChange={setSelectedArtists}
        />
        <FilterByYear value={yearOrder} onValueChange={setYearOrder} />
        <FilterByGenre
          options={genreOptions}
          selected={selectedGenres}
          onSelectedChange={setSelectedGenres}
        />
      </div>
    </div>
  );
}
