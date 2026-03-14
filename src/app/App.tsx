import { Button } from "@/shared/ui/button";
import { useQuery } from "@tanstack/react-query";

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
    <div className="p-10">
      <h1 className="text-4xl text-green-500">Music store</h1>
      <Button>Click me</Button>
      {isLoading ? <p className="mt-4">Loading tracks...</p> : null}
      {isError ? <p className="mt-4 text-red-500">Failed to load tracks</p> : null}

      {tracks ? (
        <ul className="mt-4 space-y-2">
          {tracks.map((track) => (
            <li key={track._id} className="rounded border p-3">
              <p className="font-semibold">{track.name}</p>
              <p className="text-sm text-neutral-400">
                {track.author} · {track.album}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default App;
