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
    playQueueIndex: requireAction(state.playQueueIndex, "playQueueIndex"),
    moveQueueItem: requireAction(state.moveQueueItem, "moveQueueItem"),
    removeQueueItem: requireAction(state.removeQueueItem, "removeQueueItem"),
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
    al: { id, name: `Album ${id}`, picUrl: "" },
    publishTime: 0,
  };
}

test("player store applies a queue transition snapshot before loading its selected track", async () => {
  const originalState = usePlayerStore.getState();
  const { playQueueIndex, playTrack: initialPlayTrack } = getPlayerActions();
  const songs = [createSong(1), createSong(2), createSong(3)];
  const playTrack = mock(async () => true);

  usePlayerStore.setState({
    currentSongDetail: songs[0],
    historyIndex: 0,
    historyStack: [0, 2],
    isShuffle: false,
    originalQueue: songs,
    playlistId: "playlist-1",
    playTrack,
    queue: songs,
    queueIndex: 0,
    repeatMode: "off",
  });

  try {
    await playQueueIndex(1);

    expect(usePlayerStore.getState()).toMatchObject({
      historyIndex: 1,
      historyStack: [0, 1],
      playlistId: "playlist-1",
      queue: songs,
      queueIndex: 1,
    });
    expect(playTrack).toHaveBeenCalledWith(songs[1], {});
  } finally {
    usePlayerStore.setState({
      ...originalState,
      playTrack: initialPlayTrack,
    });
  }
});

test("player store delegates queue moves to the pure transition while following the loaded track", () => {
  const originalState = usePlayerStore.getState();
  const { moveQueueItem, playTrack: initialPlayTrack } = getPlayerActions();
  const songs = [createSong(1), createSong(2), createSong(3)];

  usePlayerStore.setState({
    currentSongDetail: songs[2],
    historyIndex: 0,
    historyStack: [2],
    isShuffle: false,
    originalQueue: songs,
    queue: songs,
    queueIndex: 2,
    repeatMode: "off",
  });

  try {
    moveQueueItem(0, 2);

    expect(usePlayerStore.getState()).toMatchObject({
      historyIndex: 0,
      historyStack: [1],
      originalQueue: [songs[1], songs[2], songs[0]],
      queue: [songs[1], songs[2], songs[0]],
      queueIndex: 1,
    });
  } finally {
    usePlayerStore.setState({
      ...originalState,
      playTrack: initialPlayTrack,
    });
  }
});

test("removing the current queue item atomically updates the queue before loading its successor", () => {
  const originalState = usePlayerStore.getState();
  const { removeQueueItem, playTrack: initialPlayTrack } = getPlayerActions();
  const songs = [createSong(1), createSong(2), createSong(3)];
  const playTrack = mock(async () => true);

  usePlayerStore.setState({
    currentSongDetail: songs[1],
    historyIndex: 0,
    historyStack: [1],
    isShuffle: false,
    originalQueue: songs,
    playTrack,
    queue: songs,
    queueIndex: 1,
    repeatMode: "off",
  });

  try {
    removeQueueItem(1);

    expect(usePlayerStore.getState()).toMatchObject({
      historyIndex: 0,
      historyStack: [1],
      originalQueue: [songs[0], songs[2]],
      queue: [songs[0], songs[2]],
      queueIndex: 1,
    });
    expect(playTrack).toHaveBeenCalledWith(songs[2]);
  } finally {
    usePlayerStore.setState({
      ...originalState,
      playTrack: initialPlayTrack,
    });
  }
});
