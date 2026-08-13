import { contextBridge, ipcRenderer } from "electron";
import {
  isPlaybackHostNonce,
  PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL,
  PLAYBACK_HOST_RENDERER_READY_CHANNEL,
  type AudioFeatureFrameV1,
  type PlaybackHostBridge,
  type PlaybackTransportPayload,
} from "@scopify/desktop-contract";
import { createPlaybackHostControlPreloadTransport } from "./preloadPlaybackHostControl";

type ElectronRendererMessagePort = MessagePort & {
  onclose: ((event: Event) => void) | null;
};

let playbackTransportPort: ElectronRendererMessagePort | null = null;
let audioFeatureTransportPort: ElectronRendererMessagePort | null = null;

const playbackHostControlTransport = createPlaybackHostControlPreloadTransport("host", {
  createChannel: () => {
    const channel = new MessageChannel();
    return {
      port1: channel.port1 as ElectronRendererMessagePort,
      port2: channel.port2,
    };
  },
  connectPort: (connectionId, role, port) => {
    ipcRenderer.postMessage("playback-host-control:connect", { connectionId, role }, [port]);
  },
});

function closePort(port: ElectronRendererMessagePort | null) {
  if (!port) return;
  port.onmessage = null;
  port.onmessageerror = null;
  port.onclose = null;
  port.close();
}

function closePlaybackTransportPort() {
  const port = playbackTransportPort;
  playbackTransportPort = null;
  closePort(port);
}

function closeAudioFeatureTransportPort() {
  const port = audioFeatureTransportPort;
  audioFeatureTransportPort = null;
  closePort(port);
}

function getNonce() {
  try {
    const nonce = new URLSearchParams(globalThis.location.search).get("hostNonce");
    return isPlaybackHostNonce(nonce) ? nonce : null;
  } catch {
    return null;
  }
}

const playbackHostAPI: PlaybackHostBridge = {
  getNonce,
  reportReady: (nonce) => {
    if (!isPlaybackHostNonce(nonce)) return;
    ipcRenderer.send(PLAYBACK_HOST_RENDERER_READY_CHANNEL, { nonce });
  },
  setMediaPlaying: (isPlaying) => {
    if (typeof isPlaying !== "boolean") return;
    ipcRenderer.send(PLAYBACK_HOST_MEDIA_PLAYING_CHANNEL, { isPlaying });
  },
  connectPlaybackTransport: (connectionId, onPayload, onClose) => {
    closePlaybackTransportPort();
    const channel = new MessageChannel();
    const port = channel.port1 as ElectronRendererMessagePort;
    playbackTransportPort = port;
    port.onmessage = (event) => onPayload(event.data as PlaybackTransportPayload);
    port.onmessageerror = () => {
      if (playbackTransportPort !== port) return;
      closePlaybackTransportPort();
      onClose();
    };
    port.onclose = () => {
      if (playbackTransportPort !== port) return;
      playbackTransportPort = null;
      onClose();
    };
    port.start();
    ipcRenderer.postMessage("playback-transport:connect", { connectionId, role: "authority" }, [
      channel.port2,
    ]);

    return () => {
      if (playbackTransportPort === port) closePlaybackTransportPort();
    };
  },
  sendPlaybackTransportPayload: (payload) => {
    const port = playbackTransportPort;
    if (!port) return false;
    try {
      port.postMessage(payload);
      return true;
    } catch {
      return false;
    }
  },
  connectPlaybackHostControl: (connectionId, onPayload, onClose) =>
    playbackHostControlTransport.connect(connectionId, onPayload, onClose),
  sendPlaybackHostControlPayload: (payload) => playbackHostControlTransport.send(payload),
  connectAudioFeatureTransport: (connectionId, onClose) => {
    closeAudioFeatureTransportPort();
    const channel = new MessageChannel();
    const port = channel.port1 as ElectronRendererMessagePort;
    audioFeatureTransportPort = port;
    port.onmessageerror = () => {
      if (audioFeatureTransportPort !== port) return;
      closeAudioFeatureTransportPort();
      onClose();
    };
    port.onclose = () => {
      if (audioFeatureTransportPort !== port) return;
      audioFeatureTransportPort = null;
      onClose();
    };
    port.start();
    ipcRenderer.postMessage(
      "audio-feature-transport:connect",
      { connectionId, role: "publisher" },
      [channel.port2],
    );

    return () => {
      if (audioFeatureTransportPort === port) closeAudioFeatureTransportPort();
    };
  },
  publishAudioFeatureFrame: (frame: AudioFeatureFrameV1) => {
    const port = audioFeatureTransportPort;
    if (!port) return false;
    try {
      port.postMessage(frame);
      return true;
    } catch {
      return false;
    }
  },
};

try {
  contextBridge.exposeInMainWorld("playbackHostAPI", playbackHostAPI);
} catch (error) {
  console.error("[PlaybackHostPreload] Error:", error);
}
