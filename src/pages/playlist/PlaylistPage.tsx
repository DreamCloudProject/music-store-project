import { PLAYLIST_DAY_TRACKS } from "@/entities/track/model/data";
import TrackRow from "@/entities/track/ui/TrackRow";

export default function PlaylistPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Плейлист</h1>

      <div className="flex flex-col gap-2">
        {PLAYLIST_DAY_TRACKS?.map((t) => (
          <TrackRow key={t.id} track={t} />
        ))}
      </div>
    </div>
  );
}
