import { useQuery } from "@tanstack/react-query";

import { getTracks } from "./api/tracks";
import { HeaderSearch } from "@/widgets/header-search";
import { TracksFiltersPanel } from "@/widgets/tracks-filters";

function App() {
  const {
    data: tracks,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tracks"],
    queryFn: getTracks,
  });

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

        {isLoading ? <p className="mt-8">Loading tracks...</p> : null}
        {isError ? (
          <p className="mt-8 text-red-400">Failed to load tracks</p>
        ) : null}

        {tracks ? (
          <ul className="mt-8 space-y-2">
            {tracks.map((track) => (
              <li
                key={track._id}
                className="rounded border border-white/10 bg-white/5 p-3"
              >
                <p className="font-medium">{track.name}</p>
                <p className="text-sm text-white/60">
                  {track.author} · {track.album}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    </div>
  );
}

export default App;
