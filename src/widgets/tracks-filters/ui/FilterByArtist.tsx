import { FilterSelect } from "@/shared/ui/filter-select";

export interface ArtistOption {
  value: string;
  label: string;
}

export interface FilterByArtistProps {
  options: ArtistOption[];
  selected: string[];
  onSelectedChange: (values: string[]) => void;
  "aria-label"?: string;
  className?: string;
}

export function FilterByArtist({
  options,
  selected,
  onSelectedChange,
  "aria-label": ariaLabel,
  className,
}: FilterByArtistProps) {
  return (
    <FilterSelect
      multiselect
      options={options}
      selected={selected}
      onSelectedChange={onSelectedChange}
      triggerLabel="исполнителю"
      aria-label={
        ariaLabel ??
        (selected.length
          ? `Выбрать исполнителя, ${selected.length} в наборе`
          : "Выбрать исполнителя")
      }
      className={className}
    />
  );
}
