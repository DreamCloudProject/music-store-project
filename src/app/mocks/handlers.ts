import { http, HttpResponse } from "msw"

import type { Track } from "../api/tracks"

export const handlers = [
  http.get("*/track", async () => {
    const response = await fetch("/tracks.json")
    const tracks = (await response.json()) as Track[]
    return HttpResponse.json(tracks)
  }),
]
