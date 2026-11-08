"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { PlaybackCommand, PlaybackSessionState } from "@scopify/desktop-contract";

import { PlaybackAudioFeaturePublisher } from "@/components/player/PlaybackAudioFeaturePublisher";
import { PlaybackProjectionProvider } from "@/components/player/PlaybackProjectionProvider";
import { useSongLikeMutation } from "@/hooks/playlist/useSongLikeMutation";
import { usePlaybackAuthority } from "@/hooks/player/usePlaybackAuthority";
import { useDiscordPresence } from "@/hooks/player/useDiscordPresence";
import { useListeningScrobble } from "@/hooks/player/useListeningScrobble";
import { useMediaSession } from "@/hooks/player/useMediaSession";
import { useVoiceLike } from "@/hooks/voice/useVoiceLike";
import { adaptNeteaseLyric } from "@/lib/lyrics/neteaseLyricAdapter";
import { createCompositePlaybackAuthorityTransport } from "@/lib/playbackProjection/compositeTransport";
import { systemPlaybackClock } from "@/lib/playbackProjection/clock";
import { createElectronPlaybackAuthorityTransport } from "@/lib/playbackProjection/electronTransport";
import { createInProcessPlaybackTransport } from "@/lib/playbackProjection/inProcessTransport";
import { createPlaybackReplica } from "@/lib/playbackProjection/replica";
import { buildDiscordPresenceArtist } from "@/lib/player/discordPresence";
import { isSamePlayerTrack, playbackTrackId, playerTrackKey } from "@/lib/player/trackIdentity";
import { getNeteaseTrackId } from "@/lib/providers/netease/adapters/track";
import { runtime } from "@/lib/runtime";
import { toScrobbleSourceId } from "@/lib/player/listeningScrobble";
import { usePlayerStore } from "@/store/module/player";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { useTimeStore } from "@/store/module/time";
import { useUserStore } from "@/store/module/user";
import type {
  InProcessProjectionConnection,
  PlaybackAuthorityProviderProps,
  PlaybackAuthoritySessionIdentity,
} from "@/types/playback/authority";
import type { LyricData } from "@/types/lyrics/model";
import type { PlaybackProjectionSource } from "@/types/playback/projection";

const DEFAULT_AUTHORITY_CONNECTION_ID = "main-renderer-playback-authority";

/** Owns the main Renderer's Authority, local Replica and Electron transport fan-out. */
export function PlaybackAuthorityProvider({
  audioRef,
  audioEngine,
  children,
  isMediaSourceLoadingRef,
  mediaSourceLoadRevisionRef,
}: PlaybackAuthorityProviderProps) {
  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const currentSongUrl = usePlayerStore((state) => state.currentSongUrl);
  const isPlayingIntent = usePlayerStore((state) => state.isPlaying);
  const rawLyric = usePlayerStore((state) => state.lyric);
  const playbackLoadRevision = usePlayerStore((state) => state.playbackLoadRevision);
  const playbackSessionRevision = usePlayerStore((state) => state.playbackSessionRevision);
  const playlistId = usePlayerStore((state) => state.playlistId);
  const sourceChangeMode = usePlayerStore((state) => state.sourceChangeMode);
  const volume = usePlayerStore((state) => state.volume);
  const likeListIds = useUserStore((state) => state.likeListIDs);
  const songLikeMutation = useSongLikeMutation();
  const voiceLike = useVoiceLike(currentTrack?.netease?.voiceId ?? null);
  // Liking and scrobbling are NetEase-only; other platforms show the track without them.
  const neteaseSongId = getNeteaseTrackId(currentTrack);

  const lyrics = useMemo(() => (rawLyric ? adaptNeteaseLyric(rawLyric) : null), [rawLyric]);
  const track = useMemo(
    () =>
      currentTrack
        ? {
            albumTitle: currentTrack.album?.title,
            artistNames: currentTrack.artists.map((artist) => artist.name),
            artworkUrl: currentTrack.album?.coverUrl ?? undefined,
            id: playbackTrackId(currentTrack),
            title: currentTrack.title,
          }
        : null,
    [currentTrack],
  );
  const liked = useMemo(() => {
    if (!currentTrack || neteaseSongId === null) return false;
    if (currentTrack.netease?.voiceId !== undefined) return voiceLike.isLiked;
    if (!Array.isArray(likeListIds)) return false;
    return likeListIds.some((id) => Number(id) === neteaseSongId);
  }, [currentTrack, likeListIds, neteaseSongId, voiceLike.isLiked]);
  const discordPresence = useMemo(
    () => ({
      album: currentTrack?.album?.title ?? "",
      artist: buildDiscordPresenceArtist({
        album: currentTrack?.album?.title ?? "",
        artistNames: currentTrack?.artists.map((artist) => artist.name) ?? [],
        title: currentTrack?.title ?? "",
      }),
      coverUrl: currentTrack?.album?.coverUrl ?? null,
      durationMs: currentTrack?.durationMs ?? 0,
      isPlaying: isPlayingIntent,
      positionMs: 0,
      title: currentTrack?.title ?? "",
    }),
    [currentTrack, isPlayingIntent],
  );
  useDiscordPresence(discordPresence);
  useMediaSession({
    audioRef,
    currentTrack,
    isPlaying: isPlayingIntent,
  });
  const lyricVersion = useMemo(() => {
    if (!rawLyric || !currentTrack) return null;
    return [
      playerTrackKey(currentTrack),
      rawLyric.yrc?.version ?? "",
      rawLyric.lrc?.version ?? "",
      rawLyric.ytlrc?.version ?? rawLyric.tlyric?.version ?? "",
      rawLyric.yromalrc?.version ?? rawLyric.romalrc?.version ?? "",
    ].join(":");
  }, [currentTrack, rawLyric]);
  const initialState = useMemo<PlaybackSessionState<LyricData>>(
    () => ({
      canControl: currentTrack !== null,
      durationMs: currentTrack?.durationMs ?? 0,
      liked,
      lyrics,
      lyricsVersion: lyricVersion,
      phase: currentTrack === null ? "idle" : isPlayingIntent ? "loading" : "paused",
      track,
      volume,
    }),
    [currentTrack, isPlayingIntent, liked, lyricVersion, lyrics, track, volume],
  );
  const trackId = currentTrack ? playerTrackKey(currentTrack) : null;
  const sessionKey = `${playbackSessionRevision}:${trackId ?? "none"}`;
  const sessionIdentityRef = useRef<PlaybackAuthoritySessionIdentity | null>(null);
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
      currentTrack && neteaseSongId !== null
        ? {
            artist: currentTrack.artists.map((artist) => artist.name).join(" / "),
            key: sessionKey,
            songId: neteaseSongId,
            sourceId: toScrobbleSourceId(playlistId),
            title: currentTrack.title,
            totalSeconds: Math.ceil(currentTrack.durationMs / 1_000),
          }
        : null,
    [currentTrack, neteaseSongId, playlistId, sessionKey],
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
        const activeTrack = initialPlayer.currentTrack;
        if (!audioEngine || !activeTrack) return false;

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
            isSamePlayerTrack(currentPlayer.currentTrack, activeTrack) &&
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
        const currentTrack = usePlayerStore.getState().currentTrack;
        const songId = getNeteaseTrackId(currentTrack);
        if (!currentTrack || songId === null) return false;
        if (currentTrack.netease?.voiceId !== undefined) {
          const wasLiked = voiceLike.isLiked;
          const didUpdate = await voiceLike.toggleLike();
          return didUpdate ? !wasLiked : wasLiked;
        }
        const currentLikeListIds = useUserStore.getState().likeListIDs;
        const isCurrentlyLiked =
          Array.isArray(currentLikeListIds) &&
          currentLikeListIds.some((id) => Number(id) === songId);
        const nextLiked = !isCurrentlyLiked;
        await songLikeMutation.mutateAsync({
          like: nextLiked,
          silentToast: true,
          songId,
        });
        return nextLiked;
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
