import { TracksFiltersPanel } from "@/widgets/tracks-filters"

import { HeaderSearch } from "./ui/HeaderSearch"

function App() {
  return (
    <div className="musiclab-layout min-h-screen bg-[#181818] text-white">
      <header className="flex items-center justify-between gap-4 pt-[23px] px-9 pb-0 mb-[50px]">
        <HeaderSearch />
      </header>

      <main className="px-9 pb-20">
        <h1 className="text-[60px] leading-[1.1] font-normal tracking-[-0.013em] mb-11">
          Треки
        </h1>

        <TracksFiltersPanel />
      </main>
    </div>
  )
}

export default App
