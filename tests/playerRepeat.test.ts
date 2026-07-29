import { expect, mock, test } from "bun:test";
import { usePlayerStore } from "@/store/module/player";
import type { SongDetail } from "@/types/api/music";

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
  const originalState = usePlayerStore.getState();
  const songs = [createSong(1), createSong(2)];
  const playQueueIndex = mock(async () => undefined);

  usePlayerStore.setState({
    historyIndex: 0,
    historyStack: [0],
    originalQueue: songs,
    playQueueIndex,
    queue: songs,
    queueIndex: 0,
    repeatMode: "one",
  });

  try {
    await usePlayerStore.getState().playNext("ended");

    expect(playQueueIndex).toHaveBeenCalledWith(0, false);

    playQueueIndex.mockClear();
    await usePlayerStore.getState().playNext();

    expect(playQueueIndex).toHaveBeenCalledWith(1);
  } finally {
    usePlayerStore.setState({
      historyIndex: originalState.historyIndex,
      historyStack: originalState.historyStack,
      originalQueue: originalState.originalQueue,
      playQueueIndex: originalState.playQueueIndex,
      queue: originalState.queue,
      queueIndex: originalState.queueIndex,
      repeatMode: originalState.repeatMode,
    });
  }
});
