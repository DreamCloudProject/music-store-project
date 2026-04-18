import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "@/shared/testing/setup";

import { getTracks } from "../../api/tracks";

describe("getTracks", () => {
  it("returns tracks from the mocked API", async () => {
    server.use(
      http.get("*/track", () =>
        HttpResponse.json([
          {
            _id: "1",
            name: "Faded",
            author: "Zhu",
            releaseDate: "2024-01-01",
            genre: "techno",
            durationInSeconds: 180,
            album: "Test album",
            previewUrl: "/preview.mp3",
            trackUrl: "/track.mp3",
          },
        ]),
      ),
    );

    await expect(getTracks()).resolves.toEqual([
      {
        _id: "1",
        name: "Faded",
        author: "Zhu",
        releaseDate: "2024-01-01",
        genre: "techno",
        durationInSeconds: 180,
        album: "Test album",
        previewUrl: "/preview.mp3",
        trackUrl: "/track.mp3",
      },
    ]);
  });
});
