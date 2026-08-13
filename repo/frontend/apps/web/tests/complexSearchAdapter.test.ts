import { expect, test } from "bun:test";

import { mapComplexSearchResponse } from "@/lib/search/complexSearchAdapter";
import type { ComplexSearchResponse } from "@/types/api/search";

test("maps the supported blocks from a complex search response", () => {
  const response: ComplexSearchResponse = {
    code: 200,
    data: {
      blocks: [
        {
          blockCode: "search_block_best_match",
          resources: [
            {
              baseInfo: {
                artistDTO: { id: 1, name: "Best Artist", picUrl: "https://image.test/a" },
              },
              resourceType: "artist",
            },
          ],
        },
        {
          blockCode: "search_block_song",
          resources: [
            {
              baseInfo: {
                simpleSongData: {
                  al: { id: 2, name: "Song Album", picUrl: "https://image.test/song" },
                  ar: [{ id: 1, name: "Best Artist", picUrl: "https://image.test/a" }],
                  dt: 180_000,
                  fee: 1,
                  id: 3,
                  name: "A Song",
                },
              },
              resourceType: "song",
            },
          ],
        },
        {
          blockCode: "search_block_artist",
          resources: [
            {
              baseInfo: {
                artistDTO: { id: 4, name: "Another Artist", picUrl: "https://image.test/b" },
              },
              resourceType: "artist",
            },
          ],
        },
        {
          blockCode: "search_block_album",
          resources: [
            {
              baseInfo: {
                albumData: {
                  artists: [{ id: 4, name: "Another Artist" }],
                  id: 5,
                  name: "An Album",
                  picUrl: "https://image.test/album",
                  publishTime: 1_700_000_000_000,
                  size: 12,
                },
              },
              resourceType: "album",
            },
          ],
        },
        {
          blockCode: "search_block_playlist",
          resources: [
            {
              baseInfo: {
                pubPlaylistData: {
                  coverImgUrl: "https://image.test/playlist",
                  creator: { nickname: "Creator" },
                  id: 6,
                  name: "A Playlist",
                  trackCount: 8,
                },
              },
              resourceType: "playlist",
            },
          ],
        },
        {
          blockCode: "search_block_unsupported",
          resources: [{ resourceType: "voice" }],
        },
        {
          blockCode: "search_block_voicelist",
          resources: [
            {
              baseInfo: {
                pubDJRadioData: {
                  category: "Music",
                  dj: { nickname: "Podcast Host" },
                  id: 7,
                  name: "A Podcast",
                  picUrl: "https://image.test/podcast",
                  programCount: 16,
                  subCount: 42,
                },
              },
              resourceType: "voicelist",
            },
          ],
        },
        {
          blockCode: "search_block_voice",
          resources: [
            {
              baseInfo: {
                pubDJProgramData: {
                  coverUrl: "https://image.test/voice",
                  dj: { nickname: "Voice Host" },
                  duration: 72_000,
                  id: 8,
                  mainSong: {
                    album: { id: 0, name: "Podcast Album", picUrl: "https://image.test/voice" },
                    artists: [{ id: 9, name: "Voice Host" }],
                    duration: 72_000,
                    id: 10,
                    name: "A Voice",
                  },
                  name: "A Voice",
                  radio: { id: 7, name: "A Podcast" },
                },
              },
              resourceType: "voice",
            },
          ],
        },
      ],
    },
  };

  const result = mapComplexSearchResponse(response, "Unknown Album", "Unknown Song");

  expect(result.bestMatch).toEqual({
    artist: { id: 1, name: "Best Artist", picUrl: "https://image.test/a" },
    kind: "artist",
  });
  expect(result.songs).toHaveLength(1);
  expect(result.songs[0]).toMatchObject({
    album: { id: 2, name: "Song Album", picUrl: "https://image.test/song" },
    artists: [{ id: 1, name: "Best Artist", picUrl: "https://image.test/a" }],
    duration: 180_000,
    fee: 1,
    id: 3,
    name: "A Song",
  });
  expect(result.artists).toEqual([
    { id: 4, name: "Another Artist", picUrl: "https://image.test/b" },
  ]);
  expect(result.albums).toMatchObject([
    { artist: { id: 4, name: "Another Artist" }, id: 5, name: "An Album", size: 12 },
  ]);
  expect(result.playlists).toMatchObject([
    { creator: { nickname: "Creator" }, id: 6, name: "A Playlist", trackCount: 8 },
  ]);
  expect(result.podcasts).toMatchObject([
    {
      category: "Music",
      coverUrl: "https://image.test/podcast",
      hostName: "Podcast Host",
      id: 7,
      name: "A Podcast",
      programCount: 16,
      source: "dj-radio",
      subscriberCount: 42,
    },
  ]);
  expect(result.voices).toMatchObject([
    {
      coverUrl: "https://image.test/voice",
      duration: 72_000,
      hostName: "Voice Host",
      id: 8,
      name: "A Voice",
      podcastName: "A Podcast",
      mainSong: { id: 10, name: "A Voice" },
    },
  ]);
});

test("uses the first supported best-match resource", () => {
  const response: ComplexSearchResponse = {
    code: 200,
    data: {
      blocks: [
        {
          blockCode: "search_block_best_match",
          resources: [
            { resourceType: "orpheus" },
            {
              baseInfo: {
                simpleSongData: { id: 7, name: "Fallback Song" },
              },
              resourceType: "song",
            },
          ],
        },
      ],
    },
  };

  expect(
    mapComplexSearchResponse(response, "Unknown Album", "Unknown Song").bestMatch,
  ).toMatchObject({
    kind: "song",
    song: { id: 7, name: "Fallback Song" },
  });
});
