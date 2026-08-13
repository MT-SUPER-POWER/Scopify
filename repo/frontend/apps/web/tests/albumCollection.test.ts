import { expect, test } from "bun:test";

import { getCollectedAlbumIds } from "@/hooks/album/useAlbumCollectionQuery";

test("includes saved album IDs returned by the account collection", () => {
  expect(
    getCollectedAlbumIds({
      code: 200,
      data: [
        { id: 101, name: "Saved album", picUrl: "cover-a", size: 10, subTime: 1 },
        { id: 202, name: "Another saved album", picUrl: "cover-b", size: 12, subTime: 2 },
      ],
    }),
  ).toEqual([101, 202]);
});
