import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "@/shared/lib/utils"

export interface SearchFieldProps
  extends React.ComponentPropsWithoutRef<"input"> {
  /** Доступная подпись для поля поиска */
  "aria-label"?: string
}

/** Стили по макету .main__search: нативный input без дефолтов UI-компонента. Крестик очистки (Chrome): белый через filter. */
const searchInputClasses =
  "w-full h-auto min-h-0 py-[15px] px-0 pl-[1.5em] rounded-none border-0 border-b border-[#4e4e4e] bg-transparent shadow-none text-[16px] font-normal leading-[1.15] tracking-[0.001em] text-white placeholder:text-[#4e4e4e] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:shadow-[inset_0_-1px_0_0_#4e4e4e] focus-visible:shadow-[inset_0_-1px_0_0_#4e4e4e] transition-shadow [&::-webkit-search-cancel-button]:[filter:brightness(0)_invert(1)] [&::-webkit-search-cancel-button]:cursor-pointer"

const SearchField = React.forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, "aria-label": ariaLabel = "Поиск по трекам", ...props }, ref) => {
    return (
      <div className={cn("search-field", "relative flex flex-1 group", className)}>
        {/* было: group-focus-within:text-white — лупа белая при фокусе */}
        <span className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#4e4e4e] transition-colors">
          <Search className="size-4 shrink-0 stroke-current pointer-events-none" aria-hidden />
        </span>
        <input
          ref={ref}
          type="search"
          placeholder="Поиск"
          aria-label={ariaLabel}
          className={cn(searchInputClasses, className)}
          {...props}
        />
      </div>
    )
  }
)
SearchField.displayName = "SearchField"

export { SearchField }
