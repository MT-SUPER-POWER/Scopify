import { beforeEach, expect, mock, test } from "bun:test";

import { ApiError } from "@/lib/web/apiError";
import type { QqTrackDto } from "@/types/providers/qq/trackApi";

const qqBatch = mock(async (_mids: readonly string[], _signal?: AbortSignal) => ({}));
const neteaseRequest = mock(async (_config: unknown) => ({}));

mock.module("@/lib/providers/qq/api/track", () => ({
  QQ_SONG_BATCH_LIMIT: 20,
  getQqSongBatch: qqBatch,
}));
mock.module("@/lib/providers/netease/client", () => ({
  default: {},
  requestConfig: (config: unknown) => config,
  requestData: neteaseRequest,
}));

const { qqTrackSource: qqProvider } = await import("@/lib/providers/qq/track");
const { neteaseTrackSource: neteaseProvider } = await import("@/lib/providers/netease/track");

function qqSong(mid: string): QqTrackDto {
  return {
    id: 1,
    mid,
    name: mid,
    interval: 1,
    singer: [],
    album: { id: 1, mid: "a", name: "A" },
  };
}

beforeEach(() => {
  qqBatch.mockReset();
  neteaseRequest.mockReset();
});

test("QQ splits MIDs into batches of 20 and keeps request order", async () => {
  const mids = Array.from({ length: 25 }, (_, index) => `m${index}`);
  qqBatch.mockImplementation(async (batch) => ({
    code: 200,
    partial: false,
    results: batch.map((mid, index) => ({ index, code: 200, song: qqSong(mid), info: {} })),
  }));

  const tracks = await qqProvider.getTracks(mids);

  expect(qqBatch.mock.calls.map(([batch]) => batch.length)).toEqual([20, 5]);
  expect(tracks.map((track) => track.ref.id)).toEqual(mids);
});

test("QQ leaves out songs that fail and batches where none resolve", async () => {
  // First batch: one song resolves, one fails. Second batch: nothing resolves (HTTP 404).
  const mids = [...Array.from({ length: 19 }, (_, index) => `gone${index}`), "ok", "missing"];
  qqBatch
    .mockResolvedValueOnce({
      code: 200,
      partial: true,
      results: [
        { index: 0, code: 404, kind: "not-found" },
        { index: 19, code: 200, song: qqSong("ok"), info: {} },
      ],
    })
    .mockRejectedValueOnce(new ApiError({ kind: "business", message: "not found", status: 404 }));

  const tracks = await qqProvider.getTracks(mids);
  expect(tracks.map((track) => track.ref.id)).toEqual(["ok"]);
});

test("QQ still surfaces failures other than not-found", async () => {
  qqBatch.mockRejectedValueOnce(new ApiError({ kind: "network", message: "offline" }));
  await expect(qqProvider.getTracks(["m"])).rejects.toBeInstanceOf(ApiError);
});

test("NetEase returns tracks in request order and skips unknown IDs", async () => {
  const song = (id: number) => ({
    id,
    name: `s${id}`,
    dt: 1000,
    ar: [],
    al: { id: 1, name: "A", picUrl: "" },
  });
  neteaseRequest.mockResolvedValueOnce({ code: 200, songs: [song(2), song(1)] });

  const tracks = await neteaseProvider.getTracks(["1", "3", "2"]);

  expect(tracks.map((track) => track.ref.id)).toEqual(["1", "2"]);
  expect(neteaseRequest.mock.calls[0][0]).toMatchObject({ params: { ids: "1,3,2" } });
});

test("NetEase sends no request for an empty list", async () => {
  expect(await neteaseProvider.getTracks([])).toEqual([]);
  expect(neteaseRequest).not.toHaveBeenCalled();
});
