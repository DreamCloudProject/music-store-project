import { SearchField } from "@/shared/ui/search-field"

import { useAppContext } from "../context/AppContext"

const searchFieldClassName =
  "text-white placeholder:text-[#4e4e4e] border-[#4e4e4e] hover:shadow-[inset_0_-1px_0_0_#4e4e4e] focus-visible:shadow-[inset_0_-1px_0_0_#4e4e4e]"

export function HeaderSearch() {
  const { searchQuery, setSearchQuery } = useAppContext()

  return (
    <form className="flex-1 flex max-w-[1200px]" role="search">
      <SearchField
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={searchFieldClassName}
      />
    </form>
  )
}
