import { expect, mock, test } from "bun:test";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/api/music";

function requireAction<T>(action: T, actionName: string): T {
  if (typeof action !== "function") {
    throw new Error(`[test] missing player action: ${actionName}`);
  }
  return action;
}

const getPlayerActions = () => {
  const state = usePlayerStore.getState();
  return {
    playNext: requireAction(state.playNext, "playNext"),
    playTrack: requireAction(state.playTrack, "playTrack"),
  };
};

function createSong(id: number): SongDetail {
  return {
    id,
    name: `Song ${id}`,
    dt: 180_000,
    fee: 0,
    ar: [],
    al: {
      id,
      name: `Album ${id}`,
      picUrl: "",
    },
    publishTime: 0,
  };
}

test("natural completion repeats the current song in single-repeat mode", async () => {
  const baselineState = usePlayerStore.getState();
  const { playNext, playTrack: initialPlayTrack } = getPlayerActions();
  const songs = [createSong(1), createSong(2)];
  const playTrack = mock(async () => true);

  usePlayerStore.setState({
    historyIndex: 0,
    historyStack: [0],
    originalQueue: songs,
    playTrack,
    queue: songs,
    queueIndex: 0,
    repeatMode: "one",
  });

  try {
    await playNext("ended");

    expect(playTrack).toHaveBeenCalledWith(songs[0]);

    playTrack.mockClear();
    await playNext();

    expect(playTrack).toHaveBeenCalledWith(songs[1]);
  } finally {
    usePlayerStore.setState({
      ...baselineState,
      playTrack: initialPlayTrack,
    });
  }
});
