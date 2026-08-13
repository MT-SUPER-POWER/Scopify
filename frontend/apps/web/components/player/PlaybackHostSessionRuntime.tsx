"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { PlaybackMediaRuntimeProvider } from "@/components/player/PlaybackMediaRuntimeProvider";
import {
  createPlaybackHostRuntimeDisposalGuard,
  playbackHostRuntimeDisposalTimer,
} from "@/lib/playbackHost/runtimeDisposalGuard";
import { createPlaybackHostSessionRuntime } from "@/lib/playbackHost/hostSessionRuntime";

const PLAYBACK_HOST_AUTHORITY_CONNECTION_ID = "playback-host-authority";

/**
 * Mounts the dedicated hidden renderer's one media element after its persisted
 * UI mirror has been cleared. All later media sessions arrive through the
 * narrow Host control transport and are owned by its controller/runtime.
 */
export function PlaybackHostSessionRuntime() {
  const [hostRuntime] = useState(createPlaybackHostSessionRuntime);
  const disposalGuardRef = useRef(
    createPlaybackHostRuntimeDisposalGuard(playbackHostRuntimeDisposalTimer),
  );
  const [canMountMedia, setCanMountMedia] = useState(false);

  useLayoutEffect(() => {
    disposalGuardRef.current.cancel();
    hostRuntime.resetProjection();
    setCanMountMedia(true);
    return () => disposalGuardRef.current.schedule(() => hostRuntime.dispose());
  }, [hostRuntime]);

  if (!canMountMedia) return null;

  return (
    <PlaybackMediaRuntimeProvider
      authorityConnectionId={PLAYBACK_HOST_AUTHORITY_CONNECTION_ID}
      externalSessionControl={hostRuntime.externalSessionControl}
      onAuthorityConnected={hostRuntime.bindAuthority}
    >
      {null}
    </PlaybackMediaRuntimeProvider>
  );
}
