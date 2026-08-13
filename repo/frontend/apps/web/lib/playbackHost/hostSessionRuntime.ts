import type {
  PlaybackHostMusicQuality,
  PlaybackHostPlaybackIntent,
  PlaybackQueueEntry,
} from "@mt-super-power/desktop-contract/playbackHostControl";
import type { PlaybackSessionState } from "@mt-super-power/desktop-contract";

import {
  createPlaybackHostMediaProjection,
  createDeferredPlaybackHostAuthorityPort,
} from "@/lib/playbackHost/hostMediaProjection";
import {
  createPlaybackHostControlConnection,
  type PlaybackHostControlReconnectTimer,
} from "@/lib/playbackHost/hostControlConnection";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import {
  createNeteasePlaybackCatalog,
  createPlaybackCatalogPort,
} from "@/lib/playbackHost/neteaseCatalog";
import { createPlaybackRuntime, type PlaybackRuntime } from "@/lib/playbackHost/runtime";
import {
  createPlaybackHostSessionController,
  type PlaybackHostControlPort,
  type PlaybackHostSessionQueue,
  type PlaybackHostSessionRuntimePort,
} from "@/lib/playbackHost/sessionController";
import { fromPlaybackQueueEntry } from "@/lib/playbackHost/sessionMapper";
import { runtime } from "@/lib/runtime";
import { usePlayerStore } from "@/store/module/player";
import { useTimeStore } from "@/store/module/time";
import type { PlaybackAuthority } from "@/lib/playbackProjection/authority";
import type { PlaybackAuthorityExternalSessionControl } from "@/types/playbackAuthority";
import type { NeteaseLyric } from "@/types/api/music";
import type { LyricData } from "@/types/lyrics";
import type { PlaybackRuntimeSession } from "@/lib/playbackHost/catalog";
import type { PlaybackHostMediaProjectionTransaction } from "@/types/playbackHostMediaProjection";

const CONTROL_CONNECTION_ID = "playback-host-session-control";
const RESUME_CHECKPOINT_INTERVAL_MS = 5_000;
const EMPTY_RUNTIME_SESSION: PlaybackRuntimeSession<NeteaseLyric> = {
  key: "playback-host:empty",
  sourceLoadRevision: 0,
  state: {
    canControl: false,
    durationMs: 0,
    liked: false,
    lyrics: null,
    lyricsVersion: null,
    phase: "idle",
    track: null,
    volume: 100,
  },
};
const NOOP_FEATURE_PUBLISHER = { setIdentity: () => undefined };

interface SessionMetadata {
  entry: PlaybackQueueEntry;
  intent: PlaybackHostPlaybackIntent;
  quality: PlaybackHostMusicQuality;
  revision: number;
}

/**
 * The hidden renderer's production composition root. It owns the controller's
 * only queue and translates its media projection into the Host-local stores;
 * no PlayerStore queue action participates in this path.
 */
export interface PlaybackHostSessionRuntime {
  readonly externalSessionControl: PlaybackAuthorityExternalSessionControl;
  bindAuthority(authority: PlaybackAuthority<LyricData>): void;
  dispose(): void;
  resetProjection(): void;
}

export interface PlaybackHostSessionRuntimeScheduler {
  clearInterval(handle: unknown): void;
  setInterval(callback: () => void, intervalMs: number): unknown;
}

export interface CreatePlaybackHostSessionRuntimeOptions {
  controlReconnectTimer?: PlaybackHostControlReconnectTimer;
  scheduler?: PlaybackHostSessionRuntimeScheduler;
}

const defaultScheduler: PlaybackHostSessionRuntimeScheduler = {
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
  setInterval: (callback, intervalMs) => setInterval(callback, intervalMs),
};

export function createPlaybackHostSessionRuntime(
  options: CreatePlaybackHostSessionRuntimeOptions = {},
): PlaybackHostSessionRuntime {
  const scheduler = options.scheduler ?? defaultScheduler;
  const metadataBySessionKey = new Map<string, SessionMetadata>();
  const authorityPort = createDeferredPlaybackHostAuthorityPort<NeteaseLyric>();
  let controlMessageListener: ((payload: unknown) => void) | null = null;
  let disconnectController: (() => void) | null = null;
  let disconnectAuthority: (() => void) | null = null;
  let resumeCheckpointHandle: unknown | null = null;
  let boundAuthority: PlaybackAuthority<LyricData> | null = null;
  let publishedLyricsVersion: string | null = null;
  let disposed = false;
  let runtimeCore: PlaybackRuntime<NeteaseLyric> | null = null;
  let runtimeStarted = false;

  const startResumeCheckpointing = () => {
    if (resumeCheckpointHandle !== null) return;
    resumeCheckpointHandle = scheduler.setInterval(() => {
      void controller.updateResumePosition(useTimeStore.getState().currentTime);
    }, RESUME_CHECKPOINT_INTERVAL_MS);
  };

  const stopResumeCheckpointing = () => {
    if (resumeCheckpointHandle === null) return;
    scheduler.clearInterval(resumeCheckpointHandle);
    resumeCheckpointHandle = null;
  };

  const applyProjection = (transaction: PlaybackHostMediaProjectionTransaction<NeteaseLyric>) => {
    const metadata = metadataBySessionKey.get(transaction.player.sessionKey);
    if (!metadata) return;

    const sourceChangeMode = transaction.time.positionMs > 0 ? "preserve-position" : "new-track";
    usePlayerStore.setState({
      currentSongDetail: fromPlaybackQueueEntry(metadata.entry),
      currentSongUrl: transaction.player.sourceUrl,
      isPlaying: transaction.player.intent === "play",
      lyric: transaction.player.lyrics,
      musicQuality: transaction.player.quality,
      playbackLoadRevision: transaction.player.sourceLoadRevision,
      playbackSessionRevision: metadata.revision,
      sourceChangeMode,
      volume: transaction.player.volume,
    });
    useTimeStore.setState({
      currentTime: transaction.time.positionMs,
      totalTime: transaction.time.totalTimeMs,
    });

    // The catalog result is deliberately projected after the session seed. The
    // Authority initially owns a null lyric payload, so publish the resolved
    // (and normalized) data here for every Replica instead of leaving lyrics
    // stranded in the Host-local Zustand mirror.
    if (transaction.player.sourceUrl === null) {
      publishedLyricsVersion = null;
      return;
    }

    const lyricsVersion = `${transaction.player.sessionKey}:${transaction.player.sourceLoadRevision}`;
    if (publishedLyricsVersion === lyricsVersion || !boundAuthority) return;

    boundAuthority.updateState({
      lyrics: toAuthorityLyrics(transaction.player.lyrics),
      lyricsVersion,
    });
    publishedLyricsVersion = lyricsVersion;
  };
  const projection = createPlaybackHostMediaProjection<NeteaseLyric>({ apply: applyProjection });
  const resolver = createNeteasePlaybackCatalog();
  const catalog = createPlaybackCatalogPort({
    applyResolvedSource: (input) => projection.applyCatalogResolvedSource(input),
    invalidateSource: ({ request, signal }) => {
      const metadata = metadataBySessionKey.get(request.session.key);
      if (!metadata || !resolver.invalidate) return;
      return resolver.invalidate(metadata.entry, metadata.quality, signal);
    },
    resolve: ({ request, signal }) => {
      const metadata = metadataBySessionKey.get(request.session.key);
      if (!metadata)
        return Promise.reject(new Error("Playback Host session metadata is unavailable."));
      return resolver.resolve(metadata.entry, metadata.quality, signal);
    },
  });
  const controlPort: PlaybackHostControlPort = {
    onMessage(listener) {
      controlMessageListener = listener;
      return () => {
        if (controlMessageListener === listener) controlMessageListener = null;
      };
    },
    postMessage(payload) {
      controlConnection.send(payload);
    },
  };
  const controlConnection = createPlaybackHostControlConnection({
    connectionId: CONTROL_CONNECTION_ID,
    onPayload: (payload) => controlMessageListener?.(payload),
    port: runtime.playbackHostControl,
    timer: options.controlReconnectTimer,
  });

  const createRuntime = (
    queue: PlaybackHostSessionQueue<NeteaseLyric>,
  ): PlaybackHostSessionRuntimePort<NeteaseLyric> => {
    const core = createPlaybackRuntime<NeteaseLyric>({
      authority: authorityPort,
      catalog,
      featurePublisher: NOOP_FEATURE_PUBLISHER,
      queue,
    });
    runtimeCore = core;

    const seedSession = async (session: PlaybackRuntimeSession<NeteaseLyric>) => {
      const metadata = metadataBySessionKey.get(session.key);
      if (!metadata) throw new Error("Playback Host cannot project an unknown session.");
      if (
        !projection.applyRuntimeSession({
          intent: metadata.intent,
          quality: metadata.quality,
          session,
        })
      ) {
        throw new Error("Playback Host rejected an obsolete media session.");
      }
      return core.seedSession(session);
    };

    return {
      advanceOnEnded: async () => {
        const session = queue.next("ended");
        if (!session) return false;
        await seedSession(session);
        return true;
      },
      captureCheckpoint: () => {
        const runtimeCheckpoint = core.checkpoint();
        const projectionCheckpoint = projection.checkpoint();
        return {
          rollback: async () => {
            try {
              await core.restore(runtimeCheckpoint);
            } finally {
              // The old Player and Time state is committed only after source
              // cancellation + Authority restoration have fenced off the
              // failed candidate's asynchronous resolver work.
              projection.restore(projectionCheckpoint);
              if (!projectionCheckpoint.active) resetProjection();
            }
          },
        };
      },
      clearSession: async () => {
        await core.clearSession();
        projection.clear();
        resetProjection();
      },
      dispatch: (command) => core.dispatch(command),
      ensureSource: () => core.ensureSource(),
      seedSession,
    };
  };
  const controller = createPlaybackHostSessionController<NeteaseLyric>({
    catalog: {
      createRuntimeSession(input) {
        const key = `${input.sessionRevision}:${input.entry.id}`;
        metadataBySessionKey.set(key, {
          entry: input.entry,
          intent: input.intent,
          quality: input.quality,
          revision: input.sessionRevision,
        });
        return {
          key,
          positionMs: input.positionMs,
          reason: input.reason,
          sourceLoadRevision: input.sourceLoadRevision,
          state: toPlaybackSessionState(input.entry, input.intent, input.volume),
        };
      },
    },
    createRuntime,
    port: controlPort,
  });

  function resetProjection() {
    const player = usePlayerStore.getState();
    usePlayerStore.setState({
      currentSongDetail: null,
      currentSongUrl: null,
      isPlaying: false,
      lyric: null,
      playbackLoadRevision: player.playbackLoadRevision + 1,
      sourceChangeMode: "new-track",
    });
    useTimeStore.setState({ bufferedTime: 0, currentTime: 0, totalTime: 0 });
  }

  const externalSessionControl: PlaybackAuthorityExternalSessionControl = {
    next: () => {
      // `next` is already executing inside PlaybackAuthority's serialized
      // command tail. The queue transition seeds a replacement session and
      // then dispatches `play` through that same Authority; awaiting it here
      // would make `next` wait for `play` while `play` waits for `next`.
      void controller.handleNext();
    },
    onMediaError: async () => {
      await controller.handleMediaError();
    },
    onEnded: async () => {
      await controller.handleEnded();
    },
    onPhaseChange: (phase) => {
      // The media element reports ended before onEnded; advancing in both paths
      // would skip one entry. Durable ended transitions use onEnded exclusively.
      if (phase === "ended" || (phase !== "playing" && phase !== "paused" && phase !== "error"))
        return;
      void controller.handlePhaseChange(phase);
    },
    onVolumeChange: (volume) => {
      void controller.updatePlaybackState({ volume });
    },
    previous: () => {
      // See `next`: nested playback commands must start only after the outer
      // Authority command has returned and released its command tail.
      void controller.handlePrevious();
    },
  };

  const bindAuthority = (authority: PlaybackAuthority<LyricData>) => {
    if (disposed || disconnectAuthority) return;
    boundAuthority = authority;
    disconnectAuthority = authorityPort.bind({
      dispatch: (command) => authority.dispatch(command),
      ensureSource: async () => "ready" as const,
      seedSession: (state, options) => {
        authority.beginSession(toAuthoritySessionState(state), options);
        return requireAuthorityIdentity(authority);
      },
      start: () => requireAuthorityIdentity(authority),
      // React owns the media Authority lifecycle. The Runtime is stopped before
      // this renderer unmounts, then the Provider performs the actual teardown.
      stop: () => undefined,
    });

    const core = runtimeCore;
    if (!core) throw new Error("Playback Host Runtime was not constructed.");
    void core
      .start(EMPTY_RUNTIME_SESSION)
      .then(() => {
        if (disposed) return;
        runtimeStarted = true;
        startResumeCheckpointing();
        disconnectController = controller.connect();
        controlConnection.start();
        const nonce = runtime.playbackHost.getNonce();
        if (nonce) runtime.playbackHost.reportReady(nonce);
      })
      .catch(() => {
        resetProjection();
      });
  };

  return {
    bindAuthority,
    dispose() {
      if (disposed) return;
      disposed = true;
      controlConnection.stop();
      disconnectController?.();
      disconnectController = null;
      runtimeStarted = false;
      stopResumeCheckpointing();
      runtimeCore?.stop();
      projection.clear();
      resetProjection();
      disconnectAuthority?.();
      disconnectAuthority = null;
      boundAuthority = null;
      publishedLyricsVersion = null;
      authorityPort.unbind();
    },
    externalSessionControl,
    resetProjection,
  };
}

function toPlaybackSessionState(
  entry: PlaybackQueueEntry,
  intent: PlaybackHostPlaybackIntent,
  normalizedVolume: number,
): PlaybackSessionState<NeteaseLyric> {
  return {
    canControl: true,
    durationMs: entry.durationMs,
    liked: false,
    lyrics: null,
    lyricsVersion: null,
    phase: intent === "play" ? "loading" : "paused",
    track: {
      albumTitle: entry.album.title,
      artistNames: entry.artists.map((artist) => artist.name),
      artworkUrl: entry.album.artworkUrl,
      id: entry.id,
      title: entry.title,
    },
    volume: normalizedVolume * 100,
  };
}

function toAuthoritySessionState(
  state: PlaybackSessionState<NeteaseLyric>,
): PlaybackSessionState<LyricData> {
  return {
    ...state,
    lyrics: toAuthorityLyrics(state.lyrics),
  };
}

function toAuthorityLyrics(lyrics: NeteaseLyric | null): LyricData | null {
  return lyrics ? adaptNeteaseLyric(lyrics) : null;
}

function requireAuthorityIdentity(authority: PlaybackAuthority<LyricData>) {
  const identity = authority.currentIdentity;
  if (!identity) throw new Error("Playback Host Authority has no active identity.");
  return identity;
}
