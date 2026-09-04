/**
 * Pure queue navigation domain logic.
 *
 * This module deliberately does not know how a track is loaded, persisted, or
 * rendered. Its caller applies the returned snapshot and then performs the
 * returned effect (for example, loading `effect.track` into the audio runtime).
 */

export type PlaybackQueueRepeatMode = "off" | "all" | "one";
export type PlaybackQueueNextSource = "manual" | "ended" | "personal-fm-dislike";
export type PlaybackQueuePlaylistId = number | string | null;

export interface PlaybackQueueItem {
  id: number | string;
}

export interface PlaybackQueueSnapshot<T extends PlaybackQueueItem> {
  historyIndex: number;
  historyStack: number[];
  isShuffle: boolean;
  originalQueue: T[];
  playlistId: PlaybackQueuePlaylistId;
  queue: T[];
  queueIndex: number;
  repeatMode: PlaybackQueueRepeatMode;
}

export type PlaybackQueueEffect<T extends PlaybackQueueItem> =
  { type: "none" } | { track: T; type: "play" } | { type: "stop" } | { type: "clear" };

export interface PlaybackQueueTransition<T extends PlaybackQueueItem> {
  effect: PlaybackQueueEffect<T>;
  snapshot: PlaybackQueueSnapshot<T>;
}

/** A dependency so the queue state machine stays deterministic and testable. */
export type PlaybackQueueShuffle<T extends PlaybackQueueItem> = (tracks: readonly T[]) => T[];

export interface PlaybackQueueRuntimeContext<T extends PlaybackQueueItem> {
  /**
   * The loaded track may be absent from the queue (for example, after a direct
   * `playTrack`). Queue operations that must retain the loaded item receive it
   * explicitly instead of reaching into a player store.
   */
  currentTrack: T | null;
}

const NO_EFFECT = { type: "none" } as const;

export function createPlaybackQueueSnapshot<T extends PlaybackQueueItem>(
  snapshot: PlaybackQueueSnapshot<T>,
): PlaybackQueueSnapshot<T> {
  return {
    ...snapshot,
    historyStack: [...snapshot.historyStack],
    originalQueue: [...snapshot.originalQueue],
    queue: [...snapshot.queue],
  };
}

/**
 * Creates a complete set of pure queue transitions. `shuffle` is injected so
 * production can use a random implementation while tests and recovery flows
 * can stay deterministic.
 */
export function createPlaybackQueue<T extends PlaybackQueueItem>(shuffle: PlaybackQueueShuffle<T>) {
  const noChange = (snapshot: PlaybackQueueSnapshot<T>): PlaybackQueueTransition<T> => ({
    effect: NO_EFFECT,
    snapshot,
  });

  const playQueueIndex = (
    snapshot: PlaybackQueueSnapshot<T>,
    index: number,
    addToHistory = true,
  ): PlaybackQueueTransition<T> => {
    const track = snapshot.queue[index];
    if (!track) return noChange(snapshot);

    let historyStack = [...snapshot.historyStack];
    let historyIndex = snapshot.historyIndex;
    if (addToHistory) {
      if (historyIndex < historyStack.length - 1) {
        historyStack = historyStack.slice(0, historyIndex + 1);
      }
      historyStack.push(index);
      historyIndex = historyStack.length - 1;
    }

    return {
      effect: { track, type: "play" },
      snapshot: {
        ...snapshot,
        historyIndex,
        historyStack,
        queueIndex: index,
      },
    };
  };

  const reshuffleQueue = (
    snapshot: PlaybackQueueSnapshot<T>,
    context: PlaybackQueueRuntimeContext<T>,
  ): PlaybackQueueTransition<T> => {
    if (!snapshot.isShuffle || snapshot.originalQueue.length === 0) return noChange(snapshot);

    const { currentTrack } = context;
    const remainingTracks = snapshot.originalQueue.filter((track) => track.id !== currentTrack?.id);
    const queue = currentTrack
      ? [currentTrack, ...shuffle(remainingTracks)]
      : [...shuffle(snapshot.originalQueue)];

    return {
      effect: NO_EFFECT,
      snapshot: {
        ...snapshot,
        historyIndex: 0,
        historyStack: [0],
        queue,
        queueIndex: 0,
      },
    };
  };

  return {
    appendQueueItems(
      snapshot: PlaybackQueueSnapshot<T>,
      songs: readonly T[],
    ): PlaybackQueueTransition<T> {
      if (songs.length === 0) return noChange(snapshot);

      const appendedSongs = snapshot.isShuffle ? shuffle(songs) : [...songs];
      return {
        effect: NO_EFFECT,
        snapshot: {
          ...snapshot,
          originalQueue: [...snapshot.originalQueue, ...songs],
          queue: [...snapshot.queue, ...appendedSongs],
        },
      };
    },

    moveQueueItem(
      snapshot: PlaybackQueueSnapshot<T>,
      context: PlaybackQueueRuntimeContext<T>,
      fromIndex: number,
      toIndex: number,
    ): PlaybackQueueTransition<T> {
      if (
        fromIndex < 0 ||
        fromIndex >= snapshot.queue.length ||
        toIndex < 0 ||
        toIndex >= snapshot.queue.length ||
        fromIndex === toIndex
      ) {
        return noChange(snapshot);
      }

      const queue = [...snapshot.queue];
      const [track] = queue.splice(fromIndex, 1);
      queue.splice(toIndex, 0, track);

      const currentTrack = context.currentTrack;
      const queueIndex = currentTrack
        ? queue.findIndex(
            (candidate) => candidate === currentTrack || candidate.id === currentTrack.id,
          )
        : -1;

      return {
        effect: NO_EFFECT,
        snapshot: {
          ...snapshot,
          historyIndex: queueIndex >= 0 ? 0 : -1,
          historyStack: queueIndex >= 0 ? [queueIndex] : [],
          originalQueue: [...queue],
          queue,
          queueIndex,
        },
      };
    },

    moveQueueItemToNext(
      snapshot: PlaybackQueueSnapshot<T>,
      context: PlaybackQueueRuntimeContext<T>,
      index: number,
    ): PlaybackQueueTransition<T> {
      if (index < 0 || index >= snapshot.queue.length || index === snapshot.queueIndex) {
        return noChange(snapshot);
      }
      const insertAfterCurrent =
        index < snapshot.queueIndex ? snapshot.queueIndex : snapshot.queueIndex + 1;
      const toIndex = Math.min(snapshot.queue.length - 1, insertAfterCurrent);
      const queue = [...snapshot.queue];
      const [track] = queue.splice(index, 1);
      queue.splice(toIndex, 0, track);
      const currentTrack = context.currentTrack;
      const queueIndex = currentTrack
        ? queue.findIndex(
            (candidate) => candidate === currentTrack || candidate.id === currentTrack.id,
          )
        : -1;

      return {
        effect: NO_EFFECT,
        snapshot: {
          ...snapshot,
          historyIndex: queueIndex >= 0 ? 0 : -1,
          historyStack: queueIndex >= 0 ? [queueIndex] : [],
          originalQueue: [...queue],
          queue,
          queueIndex,
        },
      };
    },

    playFromSong(
      snapshot: PlaybackQueueSnapshot<T>,
      song: T,
      allSongs: readonly T[],
      playlistId: PlaybackQueuePlaylistId = null,
    ): PlaybackQueueTransition<T> {
      const songIndex = allSongs.findIndex((candidate) => candidate.id === song.id);
      const originalQueue = [...allSongs];

      if (snapshot.isShuffle) {
        // Keep the selected object, but filter every equal id just as the
        // legacy store did. This makes duplicate-id handling explicit.
        const remainingTracks = allSongs.filter((candidate) => candidate.id !== song.id);
        return {
          effect: { track: song, type: "play" },
          snapshot: {
            ...snapshot,
            historyIndex: 0,
            historyStack: [0],
            originalQueue,
            playlistId,
            queue: [song, ...shuffle(remainingTracks)],
            queueIndex: 0,
          },
        };
      }

      return {
        effect: { track: song, type: "play" },
        snapshot: {
          ...snapshot,
          historyIndex: 0,
          historyStack: [songIndex],
          originalQueue,
          playlistId,
          queue: [...allSongs],
          queueIndex: songIndex,
        },
      };
    },

    playNext(
      snapshot: PlaybackQueueSnapshot<T>,
      context: PlaybackQueueRuntimeContext<T>,
      source: PlaybackQueueNextSource = "manual",
    ): PlaybackQueueTransition<T> {
      if (snapshot.queue.length === 0) return noChange(snapshot);

      if (
        source === "ended" &&
        snapshot.repeatMode === "one" &&
        snapshot.queueIndex >= 0 &&
        snapshot.queueIndex < snapshot.queue.length
      ) {
        return playQueueIndex(snapshot, snapshot.queueIndex, false);
      }

      if (snapshot.historyIndex < snapshot.historyStack.length - 1) {
        const nextIndex = snapshot.historyStack[snapshot.historyIndex + 1];
        const track = snapshot.queue[nextIndex];
        if (!track) return noChange(snapshot);
        return {
          effect: { track, type: "play" },
          snapshot: {
            ...snapshot,
            historyIndex: snapshot.historyIndex + 1,
            queueIndex: nextIndex,
          },
        };
      }

      const nextIndex = snapshot.queueIndex + 1;
      if (nextIndex >= snapshot.queue.length) {
        if (snapshot.repeatMode === "all") {
          const reshuffled = reshuffleQueue(snapshot, context);
          return playQueueIndex(reshuffled.snapshot, 0);
        }
        if (snapshot.repeatMode === "one") {
          return playQueueIndex(snapshot, snapshot.queueIndex, false);
        }
        // Natural completion at the tail stops. A later explicit next is an
        // intentional request to begin the queue again.
        if (source === "manual") return playQueueIndex(snapshot, 0);
        return { effect: { type: "stop" }, snapshot };
      }

      return playQueueIndex(snapshot, nextIndex);
    },

    playPrev(snapshot: PlaybackQueueSnapshot<T>): PlaybackQueueTransition<T> {
      if (snapshot.historyIndex > 0) {
        const previousIndex = snapshot.historyStack[snapshot.historyIndex - 1];
        const track = snapshot.queue[previousIndex];
        if (!track) return noChange(snapshot);
        return {
          effect: { track, type: "play" },
          snapshot: {
            ...snapshot,
            historyIndex: snapshot.historyIndex - 1,
            queueIndex: previousIndex,
          },
        };
      }

      if (snapshot.queue.length === 0) return noChange(snapshot);
      const previousIndex = snapshot.queue.length - 1;
      return {
        effect: { track: snapshot.queue[previousIndex], type: "play" },
        snapshot: {
          ...snapshot,
          historyIndex: 0,
          historyStack: [previousIndex],
          queueIndex: previousIndex,
        },
      };
    },

    playQueueIndex,

    removeQueueItem(
      snapshot: PlaybackQueueSnapshot<T>,
      context: PlaybackQueueRuntimeContext<T>,
      index: number,
    ): PlaybackQueueTransition<T> {
      if (index < 0 || index >= snapshot.queue.length) return noChange(snapshot);

      const queue = snapshot.queue.filter((_, itemIndex) => itemIndex !== index);
      if (queue.length === 0) {
        return {
          effect: { type: "clear" },
          snapshot: {
            ...snapshot,
            historyIndex: -1,
            historyStack: [],
            originalQueue: [],
            queue: [],
            queueIndex: -1,
          },
        };
      }

      const removedCurrent =
        index === snapshot.queueIndex || snapshot.queue[index]?.id === context.currentTrack?.id;
      const queueIndex = removedCurrent
        ? Math.min(index, queue.length - 1)
        : index < snapshot.queueIndex
          ? snapshot.queueIndex - 1
          : snapshot.queueIndex;
      const track = queue[queueIndex];

      return {
        effect: removedCurrent && track ? { track, type: "play" } : NO_EFFECT,
        snapshot: {
          ...snapshot,
          historyIndex: 0,
          historyStack: [queueIndex],
          originalQueue: [...queue],
          queue,
          queueIndex,
        },
      };
    },

    reshuffleQueue,

    setQueue(
      snapshot: PlaybackQueueSnapshot<T>,
      songs: readonly T[],
      startIndex = 0,
      playlistId: PlaybackQueuePlaylistId = null,
    ): PlaybackQueueTransition<T> {
      // Keep the legacy startIndex semantics: in shuffle mode it remains the
      // caller's index rather than being remapped to the shuffled track.
      const queue = snapshot.isShuffle ? [...shuffle(songs)] : [...songs];
      return {
        effect: NO_EFFECT,
        snapshot: {
          ...snapshot,
          historyIndex: 0,
          historyStack: [startIndex],
          originalQueue: [...songs],
          playlistId,
          queue,
          queueIndex: startIndex,
        },
      };
    },

    setRepeatMode(
      snapshot: PlaybackQueueSnapshot<T>,
      repeatMode: PlaybackQueueRepeatMode,
    ): PlaybackQueueTransition<T> {
      return { effect: NO_EFFECT, snapshot: { ...snapshot, repeatMode } };
    },

    setShuffle(snapshot: PlaybackQueueSnapshot<T>, isShuffle: boolean): PlaybackQueueTransition<T> {
      return { effect: NO_EFFECT, snapshot: { ...snapshot, isShuffle } };
    },

    toggleShuffle(snapshot: PlaybackQueueSnapshot<T>): PlaybackQueueTransition<T> {
      const isShuffle = !snapshot.isShuffle;
      if (isShuffle) {
        const currentTrack = snapshot.queue[snapshot.queueIndex];
        const remainingTracks = snapshot.originalQueue.filter(
          (track) => track.id !== currentTrack?.id,
        );
        const queue = currentTrack
          ? [currentTrack, ...shuffle(remainingTracks)]
          : [...shuffle(snapshot.originalQueue)];
        return {
          effect: NO_EFFECT,
          snapshot: {
            ...snapshot,
            historyIndex: 0,
            historyStack: [0],
            isShuffle: true,
            queue,
            queueIndex: 0,
          },
        };
      }

      const currentTrack = snapshot.queue[snapshot.queueIndex];
      const originalIndex = currentTrack
        ? snapshot.originalQueue.findIndex((track) => track.id === currentTrack.id)
        : 0;
      const queueIndex = Math.max(0, originalIndex);
      return {
        effect: NO_EFFECT,
        snapshot: {
          ...snapshot,
          historyIndex: 0,
          historyStack: [queueIndex],
          isShuffle: false,
          queue: [...snapshot.originalQueue],
          queueIndex,
        },
      };
    },
  };
}
