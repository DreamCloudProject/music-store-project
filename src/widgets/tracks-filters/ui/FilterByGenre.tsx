import { FilterSelect } from "@/shared/ui/filter-select";

export interface GenreOption {
  value: string;
  label: string;
}

export interface FilterByGenreProps {
  options: GenreOption[];
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  "aria-label"?: string;
  className?: string;
}

export function FilterByGenre({
  options,
  selected,
  onSelectedChange,
  "aria-label": ariaLabel,
  className,
}: FilterByGenreProps) {
  return (
    <FilterSelect
      multiselect
      options={options}
      selected={selected}
      onSelectedChange={onSelectedChange}
      triggerLabel="жанру"
      aria-label={
        ariaLabel ??
        (selected.length
          ? `Выбрать жанр, ${selected.length} в наборе`
          : "Выбрать жанр")
      }
      className={className}
    />
  );
}
