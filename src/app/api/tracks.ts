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
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${baseUrl}/track`;
}

export async function getTracks(): Promise<Track[]> {
  const { data } = await axios.get<Track[]>(buildTracksUrl());
  return data;
}
