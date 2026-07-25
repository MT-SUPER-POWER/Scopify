import { expect, test } from "bun:test";

import { prunePlaylistTracks } from "@/types/api/playlist";

test("joins playlist track privileges by song ID", () => {
  const [track] = prunePlaylistTracks({
    code: 200,
    songs: [
      {
        id: 1336864197,
        name: "Lights",
        fee: 0,
        dt: 200_000,
        ar: [{ id: 1064078, name: "Xeuphoria" }],
        al: { id: 1, name: "Soul", picUrl: "cover" },
      },
    ],
    privileges: [{ id: 1336864197, fee: 1, maxBrLevel: "jymaster" }],
  });

  expect(track?.fee).toBe(1);
  expect(track?.privilege?.maxBrLevel).toBe("jymaster");
});
