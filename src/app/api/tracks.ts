import { apiClient } from "./client";

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

export async function getTracks(): Promise<Track[]> {
  const { data } = await apiClient.get<Track[]>("/tracks/");
  return data;
}
