import { expect, test } from "bun:test";
import { musicAccountKey, musicResourceKey } from "@scopify/music-domain/identity";
import { accountTrackStateKey } from "@scopify/music-domain/library";
import { adaptNeteaseTrack } from "../../lib/music/providers/neteaseTrackAdapter";
import { adaptQqTrack } from "../../lib/music/providers/qqTrackAdapter";
import type { NeteaseTrackDto } from "../../types/providers/netease/trackApi";
import type { QqTrackDto } from "../../types/providers/qq/trackApi";

const netease: NeteaseTrackDto = {
  id: 101,
  name: "Fixture",
  dt: 195000,
  ar: [{ id: 201, name: "Artist" }],
  al: { id: 301, name: "Album", picUrl: "" },
};
const qq: QqTrackDto = {
  id: 101,
  mid: "demoQqTrack101",
  name: "Fixture",
  interval: 195,
  singer: [{ id: 201, mid: "demoQqArtist201", name: "Artist" }],
  album: { id: 301, mid: "demoQqAlbum301", name: "Album" },
};

test("platform DTOs normalize duration units while retaining independent native identities", () => {
  const left = adaptNeteaseTrack(netease);
  const right = adaptQqTrack(qq);
  expect(left.durationMs).toBe(right.durationMs);
  expect(left.ref).toEqual({ provider: "netease", kind: "track", id: "101" });
  expect(right.ref).toEqual({ provider: "qq", kind: "track", id: "demoQqTrack101" });
  expect(right.artists[0].ref.id).toBe("demoQqArtist201");
  expect(right.album?.ref.id).toBe("demoQqAlbum301");
  expect(left.album?.coverUrl).toBeNull();
  expect(right.album?.coverUrl).toBeNull();
});

test("native numeric ID collisions do not collide across provider or resource kind", () => {
  const track = { provider: "netease", kind: "track", id: "101" } as const;
  expect(musicResourceKey(track)).not.toBe(musicResourceKey({ ...track, provider: "qq" }));
  expect(musicResourceKey(track)).not.toBe(musicResourceKey({ ...track, kind: "album" }));
});

test("personal cache keys isolate both account and provider", () => {
  const account = { provider: "netease", accountId: "101" } as const;
  const track = adaptNeteaseTrack(netease).ref;
  expect(musicAccountKey(account)).not.toBe(musicAccountKey({ ...account, provider: "qq" }));
  expect(accountTrackStateKey(account, track)).not.toBe(
    accountTrackStateKey({ ...account, accountId: "102" }, track),
  );
});

test("normalization does not mutate cached API responses or retain raw objects", () => {
  const original = structuredClone(qq);
  const track = adaptQqTrack(qq);
  qq.singer[0].name = "Changed upstream";
  expect(track.artists[0].name).toBe("Artist");
  qq.singer[0].name = original.singer[0].name;
  expect(qq).toEqual(original);
});
