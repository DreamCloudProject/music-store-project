export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  coverUrl?: string;
  audioUrl?: string;
  duration?: string;
  favorite: boolean;
}
