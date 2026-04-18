import axios from "axios";

export interface Track {
  _id: string;
  name: string;
  author: string;
  releaseDate: string;
  genre: string;
  durationInSeconds: number;
  album: string;
  previewUrl: string;
  trackUrl: string;
}

function buildTracksUrl() {
  return "/track";
}

export async function getTracks(): Promise<Track[]> {
  const { data } = await axios.get<Track[]>(buildTracksUrl());
  return data;
}
