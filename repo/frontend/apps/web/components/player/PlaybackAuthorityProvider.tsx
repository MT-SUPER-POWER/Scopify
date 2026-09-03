"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type {
  PlaybackCommand,
  PlaybackSessionState,
  PlaybackTimelineDiscontinuityReason,
} from "@scopify/desktop-contract";

import { PlaybackAudioFeaturePublisher } from "@/components/player/PlaybackAudioFeaturePublisher";
import { PlaybackProjectionProvider } from "@/components/player/PlaybackProjectionProvider";
import { useLikedVoicesQuery } from "@/hooks/library/useLibraryQueries";
import { usePlaybackAuthority } from "@/hooks/player/usePlaybackAuthority";
import { useDiscordPresence } from "@/hooks/player/useDiscordPresence";
import { useListeningScrobble } from "@/hooks/player/useListeningScrobble";
import { useMediaSession } from "@/hooks/player/useMediaSession";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { createCompositePlaybackAuthorityTransport } from "@/lib/playbackProjection/compositeTransport";
import { systemPlaybackClock } from "@/lib/playbackProjection/clock";
import { createElectronPlaybackAuthorityTransport } from "@/lib/playbackProjection/electronTransport";
import { createInProcessPlaybackTransport } from "@/lib/playbackProjection/inProcessTransport";
import { createPlaybackReplica } from "@/lib/playbackProjection/replica";
import { musicQueryKeys } from "@/lib/query/queryKeys";
import { buildDiscordPresenceArtist } from "@/lib/player/discordPresence";
import { toggleCurrentSongLike } from "@/lib/player/toggleCurrentSongLike";
import { runtime } from "@/lib/runtime";
import { toScrobbleSourceId } from "@/lib/player/listeningScrobble";
import { usePlayerStore } from "@/store/module/player";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { useTimeStore } from "@/store/module/time";
import { useUserStore } from "@/store/module/user";
import type {
  InProcessProjectionConnection,
  PlaybackAuthorityProviderProps,
} from "@/types/playbackAuthority";
import type { LyricData } from "@/types/lyrics";
import type { PlaybackProjectionSource } from "@/types/playbackProjection";

const DEFAULT_AUTHORITY_CONNECTION_ID = "main-renderer-playback-authority";

interface SessionIdentity {
  key: string;
  reason: Extract<PlaybackTimelineDiscontinuityReason, "replay" | "resume" | "track-change">;
  trackId: number | string | null;
}

/** Owns the main Renderer's Authority, local Replica and Electron transport fan-out. */
export function PlaybackAuthorityProvider({
  audioRef,
  audioEngine,
  children,
  isMediaSourceLoadingRef,
  mediaSourceLoadRevisionRef,
}: PlaybackAuthorityProviderProps) {
  const currentSongDetail = usePlayerStore((state) => state.currentSongDetail);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const isPlayingIntent = usePlayerStore((state) => state.isPlaying);
  const rawLyric = usePlayerStore((state) => state.lyric);
  const playbackLoadRevision = usePlayerStore((state) => state.playbackLoadRevision);
  const playbackSessionRevision = usePlayerStore((state) => state.playbackSessionRevision);
  const playlistId = usePlayerStore((state) => state.playlistId);
  const sourceChangeMode = usePlayerStore((state) => state.sourceChangeMode);
  const volume = usePlayerStore((state) => state.volume);
  const likeListIds = useUserStore((state) => state.likeListIDs);
  const userId = useUserStore((state) => state.user?.userId);
  const queryClient = useQueryClient();
  const likedVoices = useLikedVoicesQuery(currentSongDetail?.voiceId !== undefined);

  const lyrics = useMemo(() => (rawLyric ? adaptNeteaseLyric(rawLyric) : null), [rawLyric]);
  const track = useMemo(
    () =>
      currentSongDetail
        ? {
            albumTitle: currentSongDetail.al.name,
            artistNames: currentSongDetail.ar.map((artist) => artist.name),
            artworkUrl: currentSongDetail.al.picUrl,
            id: currentSongDetail.id,
            title: currentSongDetail.name,
          }
        : null,
    [currentSongDetail],
  );
  const liked = useMemo(() => {
    if (!currentSongDetail) return false;
    if (currentSongDetail.voiceId !== undefined) {
      return Boolean(likedVoices.data?.some((voice) => voice.id === currentSongDetail.voiceId));
    }
    if (!Array.isArray(likeListIds)) return false;
    return likeListIds.some((id) => Number(id) === currentSongDetail.id);
  }, [currentSongDetail, likeListIds, likedVoices.data]);
  const discordPresence = useMemo(
    () => ({
      album: currentSongDetail?.al.name ?? "",
      artist: buildDiscordPresenceArtist({
        album: currentSongDetail?.al.name ?? "",
        artistNames: currentSongDetail?.ar.map((artist) => artist.name) ?? [],
        title: currentSongDetail?.name ?? "",
      }),
      coverUrl: currentSongDetail?.al.picUrl ?? null,
      durationMs: currentSongDetail?.dt ?? 0,
      isPlaying: isPlayingIntent,
      positionMs: 0,
      title: currentSongDetail?.name ?? "",
    }),
    [currentSongDetail, isPlayingIntent],
  );
  useDiscordPresence(discordPresence);
  useMediaSession({
    audioRef,
    currentSongDetail,
    isPlaying: isPlayingIntent,
  });
  const lyricVersion = useMemo(() => {
    if (!rawLyric || !currentSongDetail) return null;
    return [
      currentSongDetail.id,
      rawLyric.yrc?.version ?? "",
      rawLyric.lrc?.version ?? "",
      rawLyric.ytlrc?.version ?? rawLyric.tlyric?.version ?? "",
      rawLyric.yromalrc?.version ?? rawLyric.romalrc?.version ?? "",
    ].join(":");
  }, [currentSongDetail, rawLyric]);
  const initialState = useMemo<PlaybackSessionState<LyricData>>(
    () => ({
      canControl: currentSongDetail !== null,
      durationMs: currentSongDetail?.dt ?? 0,
      liked,
      lyrics,
      lyricsVersion: lyricVersion,
      phase: currentSongDetail === null ? "idle" : isPlayingIntent ? "loading" : "paused",
      track,
      volume,
    }),
    [currentSongDetail, isPlayingIntent, liked, lyricVersion, lyrics, track, volume],
  );
  const trackId = currentSongDetail?.id ?? null;
  const sessionKey = `${playbackSessionRevision}:${trackId ?? "none"}`;
  const sessionIdentityRef = useRef<SessionIdentity | null>(null);
  if (sessionIdentityRef.current?.key !== sessionKey) {
    const previousIdentity = sessionIdentityRef.current;
    const reason =
      previousIdentity === null && trackId !== null
        ? "resume"
        : previousIdentity?.trackId === trackId && trackId !== null
          ? "replay"
          : "track-change";
    sessionIdentityRef.current = { key: sessionKey, reason, trackId };
  }
  const sessionReason = sessionIdentityRef.current.reason;
  const resumePositionMs = sessionReason === "resume" ? useTimeStore.getState().currentTime : 0;
  const scrobbleSession = useMemo(
    () =>
      currentSongDetail
        ? {
            artist: currentSongDetail.ar.map((artist) => artist.name).join(" / "),
            key: sessionKey,
            songId: currentSongDetail.id,
            sourceId: toScrobbleSourceId(playlistId),
            title: currentSongDetail.name,
            totalSeconds: Math.ceil(currentSongDetail.dt / 1_000),
          }
        : null,
    [currentSongDetail, playlistId, sessionKey],
  );
  useListeningScrobble({ audioRef, session: scrobbleSession });

  const [localTransport] = useState(() => createInProcessPlaybackTransport<LyricData>());
  const [localReplica] = useState(() =>
    createPlaybackReplica<LyricData>({ clock: systemPlaybackClock }),
  );
  const localConnectionRef = useRef<InProcessProjectionConnection<LyricData> | null>(null);
  const [localProjectionSource] = useState<PlaybackProjectionSource<LyricData>>(() => ({
    dispatch(command: PlaybackCommand) {
      const connection = localConnectionRef.current;
      if (connection) return connection.dispatch(command);
      return Promise.resolve({
        commandId: command.commandId,
        reason: "local-playback-replica-disconnected",
        status: "unavailable" as const,
      });
    },
    getSnapshot: () => localReplica.getSnapshot(),
    subscribe: (listener) => localReplica.subscribe(listener),
  }));
  const [electronTransport] = useState(() =>
    runtime.isDesktop
      ? createElectronPlaybackAuthorityTransport<LyricData>({
          connectionId: DEFAULT_AUTHORITY_CONNECTION_ID,
          port: runtime.playback,
        })
      : null,
  );
  const [authorityTransport] = useState(() =>
    createCompositePlaybackAuthorityTransport(localTransport, electronTransport),
  );

  useEffect(() => {
    localReplica.connect();
    const connection = localTransport.connectProjection(localReplica, (message) => {
      localReplica.receive(message);
    });
    localConnectionRef.current = connection;

    return () => {
      if (localConnectionRef.current === connection) localConnectionRef.current = null;
      connection.disconnect();
      localReplica.disconnect();
    };
  }, [localReplica, localTransport]);

  const authority = usePlaybackAuthority<LyricData>({
    acceptMediaEvent: () => {
      const player = usePlayerStore.getState();
      return Boolean(
        audioEngine &&
        player.currentSongUrl &&
        mediaSourceLoadRevisionRef.current === player.playbackLoadRevision &&
        audioEngine.isCurrentSource(player.currentSongUrl),
      );
    },
    audioEngine,
    audioRef,
    callbacks: {
      ensureSource: async () => {
        const initialPlayer = usePlayerStore.getState();
        const activeTrack = initialPlayer.currentSongDetail;
        if (!audioEngine || !activeTrack) return false;
        const activeTrackId = activeTrack.id;

        let sourceUrl = initialPlayer.currentSongUrl;
        if (!sourceUrl) {
          const result = await initialPlayer.refreshCurrentTrackUrl();
          if (result.status !== "refreshed") return false;
          sourceUrl = usePlayerStore.getState().currentSongUrl;
        }
        if (!sourceUrl) return false;

        const expectedSourceUrl = sourceUrl;
        const expectedLoadRevision = usePlayerStore.getState().playbackLoadRevision;
        return audioEngine.waitForSource(expectedSourceUrl, () => {
          const currentPlayer = usePlayerStore.getState();
          return (
            currentPlayer.currentSongDetail?.id === activeTrackId &&
            currentPlayer.currentSongUrl === expectedSourceUrl &&
            currentPlayer.playbackLoadRevision === expectedLoadRevision
          );
        });
      },
      moveQueueItem: (fromIndex, toIndex) =>
        usePlayerStore.getState().moveQueueItem(fromIndex, toIndex),
      next: () => usePersonalFmStore.getState().advance(),
      onEnded: () => usePersonalFmStore.getState().advance("ended"),
      onPhaseChange: (phase) => {
        if (phase === "playing") {
          runtime.media.setPlaying(true);
          if (!usePlayerStore.getState().isPlaying) {
            usePlayerStore.getState().setIsPlaying(true);
          }
          return;
        }

        if (phase !== "paused" && phase !== "ended" && phase !== "error") return;
        runtime.media.setPlaying(false);
        // Keep the previous intent through one URL refresh; the media error handler
        // clears it only after recovery is exhausted.
        if (phase === "error") return;
        if (phase === "paused" && isMediaSourceLoadingRef.current) return;
        if (usePlayerStore.getState().isPlaying) {
          usePlayerStore.getState().setIsPlaying(false);
        }
      },
      onVolumeChange: (nextVolume) => usePlayerStore.getState().setVolume(nextVolume),
      playQueueIndex: (index) => usePlayerStore.getState().playQueueIndex(index),
      previous: () => usePlayerStore.getState().playPrev(),
      removeQueueItem: (index) => usePlayerStore.getState().removeQueueItem(index),
      toggleLike: async () => {
        const currentTrack = usePlayerStore.getState().currentSongDetail;
        const nextLiked = await toggleCurrentSongLike(liked, queryClient);
        if (currentTrack?.voiceId !== undefined) {
          if (userId) {
            void queryClient.invalidateQueries({
              queryKey: musicQueryKeys.library.likedVoices(userId),
            });
          }
          return nextLiked;
        }
        const activeTrackId = usePlayerStore.getState().currentSongDetail?.id;
        const nextLikeListIds = useUserStore.getState().likeListIDs;
        return (
          activeTrackId !== undefined &&
          Array.isArray(nextLikeListIds) &&
          nextLikeListIds.some((id) => Number(id) === activeTrackId)
        );
      },
    },
    clock: systemPlaybackClock,
    initialState,
    resumePositionMs,
    sessionKey,
    sessionReason,
    transport: authorityTransport,
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!authority || !audio || !audioEngine || !currentSongUrl) return;
    let disposed = false;

    const applyPlaybackIntent = () => {
      if (disposed || (!audio.currentSrc && !audio.src)) return;
      const shouldPlay = usePlayerStore.getState().isPlaying;
      if (shouldPlay === !audio.paused) return;

      const type = shouldPlay ? "play" : "pause";
      void authority
        .dispatch({ commandId: createPlaybackCommandId(type), type })
        .then((receipt) => {
          if (
            !disposed &&
            shouldPlay &&
            receipt.status !== "accepted" &&
            usePlayerStore.getState().isPlaying
          ) {
            usePlayerStore.getState().setIsPlaying(false);
          }
        });
    };

    const unsubscribe = audioEngine.subscribeMedia((event) => {
      if (event.type === "can-play") applyPlaybackIntent();
    });
    applyPlaybackIntent();
    return () => {
      disposed = true;
      unsubscribe();
    };
  }, [audioEngine, audioRef, authority, currentSongUrl, isPlayingIntent, sessionKey]);

  const correctedSourceLoadRevisionRef = useRef<number | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (
      !authority ||
      !audio ||
      !audioEngine ||
      !currentSongUrl ||
      sourceChangeMode !== "preserve-position" ||
      correctedSourceLoadRevisionRef.current === playbackLoadRevision
    ) {
      return;
    }

    const applyCheckpoint = () => {
      const player = usePlayerStore.getState();
      if (
        correctedSourceLoadRevisionRef.current === playbackLoadRevision ||
        mediaSourceLoadRevisionRef.current !== playbackLoadRevision ||
        player.playbackLoadRevision !== playbackLoadRevision ||
        player.currentSongUrl !== currentSongUrl ||
        !audioEngine.isCurrentSource(currentSongUrl)
      ) {
        return;
      }
      correctedSourceLoadRevisionRef.current = playbackLoadRevision;
      authority.discontinueTimeline(
        "media-correction",
        Math.max(0, useTimeStore.getState().currentTime),
      );
    };

    if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      applyCheckpoint();
      if (correctedSourceLoadRevisionRef.current === playbackLoadRevision) return;
    }

    let unsubscribe: (() => void) | null = null;
    const handleCanPlay = () => {
      applyCheckpoint();
      if (correctedSourceLoadRevisionRef.current === playbackLoadRevision) {
        unsubscribe?.();
      }
    };
    unsubscribe = audioEngine.subscribeMedia((event) => {
      if (event.type === "can-play") handleCanPlay();
    });
    return () => unsubscribe?.();
  }, [
    audioEngine,
    audioRef,
    authority,
    currentSongUrl,
    mediaSourceLoadRevisionRef,
    playbackLoadRevision,
    sourceChangeMode,
  ]);

  return (
    <PlaybackProjectionProvider source={localProjectionSource}>
      <PlaybackAudioFeaturePublisher />
      {children}
    </PlaybackProjectionProvider>
  );
}

let nextPlaybackCommandSequence = 0;

function createPlaybackCommandId(type: "pause" | "play") {
  nextPlaybackCommandSequence += 1;
  return `playback-${type}-${nextPlaybackCommandSequence.toString(36)}`;
}
