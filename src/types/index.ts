export interface Track {
  id: number;
  title: string;
  subtitle?: string;
  artist: string;
  album: string;
  duration: string;
  liked: boolean;
  year: number;
  genre: string;
}

export interface Playlist {
  id: number;
  title: string;
  gradient: string;
}

export type SortYear = "newer" | "older";
export type FilterType = "artist" | "year" | "genre" | null;

export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isRepeat: boolean;
  isShuffle: boolean;
  volume: number;
  tracks: Track[];
}

export interface PlayerActions {
  setTracks: (tracks: Track[]) => void;
  playTrack: (track: Track) => void;
  togglePlay: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrev: () => void;
  toggleLike: (trackId: number) => void;
  setVolume: (volume: number) => void;
}

export type PlayerContextValue = PlayerState & PlayerActions;
