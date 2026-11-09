import { expect, test } from "bun:test";

import { adaptNeteaseLibraryPlaylist } from "@/lib/providers/netease/adapters/library";
import { adaptQqLibraryAlbum, adaptQqLibraryPlaylist } from "@/lib/providers/qq/adapters/library";

const qqAccount = { provider: "qq", accountId: "10000" } as const;

test("QQ tells created playlists from saved ones and finds the liked list", () => {
  const liked = adaptQqLibraryPlaylist(
    { tid: 9001, dirId: 201, dirName: "我喜欢", songNum: 3, dirShow: 1, uin: "0", nick: "Me" },
    qqAccount,
  );
  expect(liked.relation).toBe("created");
  expect(liked.isLikedList).toBe(true);
  expect(liked.playlist.ref).toEqual({ provider: "qq", kind: "playlist", id: "9001" });
  expect(liked.playlist.trackCount).toBe(3);

  const saved = adaptQqLibraryPlaylist(
    { tid: 9002, dirId: 11, name: "Saved", songnum: 5, nickname: "Other", logo: "http://x/y.jpg" },
    qqAccount,
  );
  expect(saved.relation).toBe("subscribed");
  expect(saved.isLikedList).toBe(false);
  expect(saved.playlist.coverUrl).toBe("https://x/y.jpg");
});

test("QQ leaves out a saved album without an identity", () => {
  expect(adaptQqLibraryAlbum({ albumname: "No MID" })).toBeNull();
  expect(adaptQqLibraryAlbum({ albummid: "abc", albumname: "A", ordertime: 10 })?.savedAt).toBe(
    10000,
  );
});

test("NetEase marks created playlists by their creator", () => {
  const account = { provider: "netease", accountId: "7" } as const;
  const own = adaptNeteaseLibraryPlaylist(
    { id: 1, name: "Mine", creator: { userId: 7, nickname: "Me" }, privacy: 10 },
    account,
  );
  const other = adaptNeteaseLibraryPlaylist(
    { id: 2, name: "Theirs", creator: { userId: 8, nickname: "You" } },
    account,
  );
  expect(own.relation).toBe("created");
  expect(own.visibility).toBe("private");
  expect(other.relation).toBe("subscribed");
});
