import { FilterSelect } from "@/shared/ui/filter-select"

export type YearOrder = "newer" | "older"

const YEAR_OPTIONS = [
  { value: "newer" as YearOrder, label: "Более новые" },
  { value: "older" as YearOrder, label: "Более старые" },
]

export interface FilterByYearProps {
  value: YearOrder
  onValueChange: (value: YearOrder) => void
  "aria-label"?: string
  className?: string
}

export function FilterByYear({
  value,
  onValueChange,
  "aria-label": ariaLabel = "Выбрать порядок по году выпуска",
  className,
}: FilterByYearProps) {
  return (
    <FilterSelect
      multiselect={false}
      showControls
      options={YEAR_OPTIONS}
      value={value}
      onValueChange={(v) => onValueChange(v as YearOrder)}
      triggerLabel="году выпуска"
      horizontal
      aria-label={ariaLabel}
      className={className}
    />
  )
}
