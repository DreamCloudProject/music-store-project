import { useQuery } from "@tanstack/react-query";

import { HeaderSearch, SearchStoreProvider } from "@/widgets/header-search";
import {
  TracksFiltersPanel,
  TracksFiltersStoreProvider,
} from "@/widgets/tracks-filters";

import { getTracks } from "./api/tracks";

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
    <main className="min-h-screen bg-[#181818] text-white">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-10">
        <header className="flex items-center justify-between gap-6">
          <div className="w-full max-w-[700px]">
            <SearchStoreProvider>
              <HeaderSearch />
            </SearchStoreProvider>
          </div>
        </header>

        <div className="mt-8">
          <section>
            <h1 className="text-3xl font-semibold leading-tight">Треки</h1>

            <div className="mt-6">
              <TracksFiltersStoreProvider>
                <TracksFiltersPanel />
              </TracksFiltersStoreProvider>
            </div>

            {isLoading ? (
              <p className="mt-6 text-white/70">Loading tracks...</p>
            ) : null}
            {isError ? (
              <p className="mt-6 text-red-500">Failed to load tracks</p>
            ) : null}

            {tracks ? (
              <ul className="mt-6 space-y-2">
                {tracks.map((track) => (
                  <li
                    key={track._id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="font-semibold">{track.name}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {track.author} · {track.album}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

export default App;
