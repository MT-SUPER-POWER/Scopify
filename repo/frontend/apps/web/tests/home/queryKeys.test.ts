import { expect, it } from "bun:test";
import { musicQueryKeys } from "@/lib/query/queryKeys";

it("isolates home account regions across users without splitting numeric and string IDs", () => {
  const keys = musicQueryKeys.home;
  expect(keys.recommendedPlaylists(1)).not.toEqual(keys.recommendedPlaylists(2));
  expect(keys.recentPlaylists(20, 1)).not.toEqual(keys.recentPlaylists(20, 2));
  expect(keys.followedArtists(30, 1)).not.toEqual(keys.followedArtists(30, 2));
  expect(keys.followedArtistAlbums(20, 1)).not.toEqual(keys.followedArtistAlbums(20, 2));
  expect(keys.recommendedPlaylists(1)).toEqual(keys.recommendedPlaylists("1"));
});
