import { describe, expect, it } from "vitest";

import { fetchTracksPage } from "../../api/tracks.api";

describe("fetchTracksPage", () => {
  it("returns tracks from the mocked CMS bean API", async () => {
    const page = await fetchTracksPage({
      offset: 0,
      limit: 10,
    });

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
      }),
    );
  });
});
