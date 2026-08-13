import type {
  AudioFeatureTransportRole,
  PlaybackHostBridge,
  PlaybackCacheCategory,
  PlaybackTransportRole,
} from "@mt-super-power/desktop-contract";

import { connectPlaybackHostControlTransport } from "@/lib/playbackHost/controlTransport";
import { createBrowserRuntime } from "./browser";
import type {
  RuntimePlaybackHostControlClientPayload,
  RuntimePlaybackHostControlHostPayload,
  WebRuntime,
} from "../types";
import type { LyricData } from "@/types/lyrics";

const NOOP = () => undefined;

/**
 * Adapts the deliberately narrow hidden-host preload into the regular renderer
 * runtime shape. It composes the browser fallback so this invisible renderer
 * cannot accidentally exercise unrelated Desktop capabilities.
 */
export function createPlaybackHostRuntime(bridge: PlaybackHostBridge<LyricData>): WebRuntime {
  const browserRuntime = createBrowserRuntime();

  return {
    ...browserRuntime,
    audioFeature: {
      connect: (role, connectionId, onFrame, onClose) => {
        assertAudioFeaturePublisher(role);
        // A publisher never receives frames. Keep the WebRuntime signature
        // uniform while ensuring a host cannot become an audio subscriber.
        void onFrame;
        return bridge.connectAudioFeatureTransport(connectionId, onClose);
      },
      publish: (frame) => bridge.publishAudioFeatureFrame(frame),
    },
    cache: {
      ...browserRuntime.cache,
      deleteScoped: async (scope, key) => {
        if (scope === "playback") await bridge.deletePlaybackCache(key);
        else await browserRuntime.cache.deleteScoped(scope, key);
      },
      getScoped: <T>(scope: "page" | "playback", key: string) =>
        scope === "playback"
          ? bridge.getPlaybackCache<T>(key)
          : browserRuntime.cache.getScoped<T>(scope, key),
      setScoped: async (scope, key, value, ttlMs, category) => {
        if (scope === "playback") {
          await bridge.setPlaybackCache(
            key,
            value,
            ttlMs,
            category === "other" ? undefined : (category as PlaybackCacheCategory),
          );
          return;
        }
        await browserRuntime.cache.setScoped(scope, key, value, ttlMs, category);
      },
    },
    isDesktop: true,
    kind: "desktop",
    media: {
      onCommand: () => NOOP,
      setPlaying: (isPlaying) => bridge.setMediaPlaying(isPlaying),
    },
    playback: {
      connect: (role, connectionId, onPayload, onClose) => {
        assertPlaybackAuthority(role);
        return bridge.connectPlaybackTransport(connectionId, onPayload, onClose);
      },
      send: (payload) => bridge.sendPlaybackTransportPayload(payload),
    },
    playbackHost: {
      getNonce: () => bridge.getNonce(),
      reportReady: (nonce) => {
        if (nonce.length === 0) return false;
        bridge.reportReady(nonce);
        return true;
      },
    },
    playbackHostControl: {
      connectClient: () => {
        throw new TypeError("The Playback Host only supports the Playback Host control host role");
      },
      connectHost: (connectionId, onPayload, onClose) =>
        connectPlaybackHostControlTransport<
          RuntimePlaybackHostControlHostPayload,
          RuntimePlaybackHostControlClientPayload
        >(
          {
            connect: (id, receive, close) => bridge.connectPlaybackHostControl(id, receive, close),
            send: (payload) => bridge.sendPlaybackHostControlPayload(payload),
          },
          connectionId,
          onPayload,
          onClose,
        ),
    },
  };
}

function assertPlaybackAuthority(role: PlaybackTransportRole) {
  if (role !== "authority") {
    throw new TypeError("The Playback Host only supports the playback authority role");
  }
}

function assertAudioFeaturePublisher(role: AudioFeatureTransportRole) {
  if (role !== "publisher") {
    throw new TypeError("The Playback Host only supports the audio-feature publisher role");
  }
}
