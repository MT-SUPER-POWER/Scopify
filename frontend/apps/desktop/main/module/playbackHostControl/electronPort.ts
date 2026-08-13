import type { MessageEvent, MessagePortMain } from "electron";

import type { PlaybackHostControlPort, PlaybackHostControlPortMessageListener } from "./port.js";

/** Adapts Electron's MessagePortMain without exposing it to broker logic. */
export function adaptElectronPlaybackHostControlPort(
  port: MessagePortMain,
): PlaybackHostControlPort {
  let closed = false;
  let started = false;

  return {
    close() {
      if (closed) return;
      closed = true;
      port.close();
    },
    onClose(listener) {
      port.once("close", listener);
      return () => port.removeListener("close", listener);
    },
    onMessage(listener: PlaybackHostControlPortMessageListener) {
      const handler = (event: MessageEvent) => listener(event.data);
      port.on("message", handler);
      if (!started) {
        started = true;
        port.start();
      }
      return () => port.removeListener("message", handler);
    },
    postMessage(message) {
      if (closed) throw new Error("The Playback Host control port is closed.");
      port.postMessage(message);
    },
  };
}
