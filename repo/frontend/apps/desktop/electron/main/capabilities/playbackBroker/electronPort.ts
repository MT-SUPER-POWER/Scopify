import type { MessageEvent, MessagePortMain } from "electron";

import type { PlaybackBrokerPort, PlaybackBrokerPortMessageListener } from "./port";

/** Adapts Electron's event-emitter-shaped MessagePortMain to the broker's narrow port seam. */
export function adaptElectronPlaybackPort(port: MessagePortMain): PlaybackBrokerPort {
  let closed = false;
  let started = false;

  return {
    close() {
      if (closed) return;
      closed = true;
      port.close();
    },
    onClose(listener) {
      const handleClose = () => {
        closed = true;
        listener();
      };
      port.on("close", handleClose);
      return once(() => port.off("close", handleClose));
    },
    onMessage(listener: PlaybackBrokerPortMessageListener) {
      const handleMessage = (event: MessageEvent) => listener(event.data);
      port.on("message", handleMessage);
      if (!started) {
        started = true;
        port.start();
      }
      return once(() => port.off("message", handleMessage));
    },
    postMessage(message) {
      if (closed) throw new Error("The playback MessagePort is closed.");
      port.postMessage(message);
    },
  };
}

function once(action: () => void) {
  let called = false;
  return () => {
    if (called) return;
    called = true;
    action();
  };
}
