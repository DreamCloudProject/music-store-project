import { useQuery } from "@tanstack/react-query";

import { fetchPlaylists } from "../api/playlists.api";
import type { PlaylistsResponse } from "../api/playlists.types";

export function usePlaylistsQuery() {
  return useQuery<
    PlaylistsResponse,
    Error,
    PlaylistsResponse,
    readonly ["playlists"]
  >({
    queryKey: ["playlists"],
    queryFn: fetchPlaylists,
    placeholderData: [],
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
