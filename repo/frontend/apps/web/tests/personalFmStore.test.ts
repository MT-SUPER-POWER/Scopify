import { afterEach, beforeEach, expect, mock, test } from "bun:test";

import { PERSONAL_FM_PLAYBACK_SOURCE_ID } from "@/constants/personalFm";
import type { RawSongDetail, SongDetail } from "@/types/api/music";

const getPersonalFm = mock(async () => ({
  data: { code: 200, data: [createRawSong(1), createRawSong(2), createRawSong(3)] },
}));
const getPersonalFmByMode = mock(async () => ({
  data: { code: 200, data: [createRawSong(4), createRawSong(5), createRawSong(6)] },
}));

mock.module("@/lib/api/personalFm", () => ({ getPersonalFm, getPersonalFmByMode }));

const { usePlayerStore } = await import("@/store/module/player");
const { usePersonalFmStore } = await import("@/store/module/personalFm");
const baselinePlayerState = usePlayerStore.getState();
const baselinePersonalFmState = usePersonalFmStore.getState();

function createRawSong(id: number): RawSongDetail {
  return {
    id,
    name: `Song ${id}`,
    duration: 180_000,
    artists: [{ id, name: `Artist ${id}` }],
    album: { id, name: `Album ${id}`, picUrl: "" },
  };
}

function createSong(id: number): SongDetail {
  return {
    id,
    name: `Song ${id}`,
    dt: 180_000,
    fee: 0,
    ar: [],
    al: { id, name: `Album ${id}`, picUrl: "" },
    publishTime: 0,
  };
}

beforeEach(() => {
  getPersonalFm.mockClear();
  getPersonalFmByMode.mockClear();
  usePlayerStore.setState(baselinePlayerState, true);
  usePersonalFmStore.setState(baselinePersonalFmState, true);
});

afterEach(() => {
  usePlayerStore.setState(baselinePlayerState, true);
  usePersonalFmStore.setState(baselinePersonalFmState, true);
});

test("starts the default station through the existing player queue", async () => {
  const playFromSong = mock(async () => undefined);
  const setRepeatMode = mock(() => undefined);
  const setShuffle = mock(() => undefined);
  usePlayerStore.setState({ playFromSong, setRepeatMode, setShuffle });

  expect(await usePersonalFmStore.getState().start()).toBe(true);
  expect(getPersonalFm).toHaveBeenCalledTimes(1);
  expect(setShuffle).toHaveBeenCalledWith(false);
  expect(setRepeatMode).toHaveBeenCalledWith("off");
  expect(playFromSong).toHaveBeenCalledWith(
    expect.objectContaining({ id: 1 }),
    expect.arrayContaining([expect.objectContaining({ id: 2 })]),
    PERSONAL_FM_PLAYBACK_SOURCE_ID,
  );
});

test("refills at the tail before delegating ended playback", async () => {
  const appendQueueItems = mock((songs: SongDetail[]) => {
    usePlayerStore.setState((state) => ({ queue: [...state.queue, ...songs] }));
  });
  const playNext = mock(async () => undefined);
  usePlayerStore.setState({
    appendQueueItems,
    currentSongDetail: createSong(1),
    originalQueue: [createSong(1)],
    playNext,
    playlistId: PERSONAL_FM_PLAYBACK_SOURCE_ID,
    queue: [createSong(1)],
    queueIndex: 0,
  });

  await usePersonalFmStore.getState().advance("ended");

  expect(appendQueueItems).toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ id: 2 })]),
  );
  expect(playNext).toHaveBeenCalledWith("ended");
});

test("changing modes while on air replaces the stream immediately", async () => {
  const playFromSong = mock(async () => undefined);
  usePlayerStore.setState({
    currentSongDetail: createSong(1),
    playFromSong,
    playlistId: PERSONAL_FM_PLAYBACK_SOURCE_ID,
  });

  expect(
    await usePersonalFmStore.getState().setSelection({ mode: "SCENE_RCMD", scene: "FOCUS" }),
  ).toBe(true);

  expect(getPersonalFmByMode).toHaveBeenCalledWith({ mode: "SCENE_RCMD", submode: "FOCUS" });
  expect(playFromSong).toHaveBeenCalledWith(
    expect.objectContaining({ id: 4 }),
    expect.any(Array),
    PERSONAL_FM_PLAYBACK_SOURCE_ID,
  );
});
