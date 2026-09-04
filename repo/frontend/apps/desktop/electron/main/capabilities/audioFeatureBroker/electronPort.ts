import type { MessageEvent, MessagePortMain } from "electron";

import type { AudioFeatureBrokerPort, AudioFeatureBrokerPortMessageListener } from "./port";

/** Adapts Electron's event-emitter-shaped MessagePortMain to the broker's narrow port seam. */
export function adaptElectronAudioFeaturePort(port: MessagePortMain): AudioFeatureBrokerPort {
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
    onMessage(listener: AudioFeatureBrokerPortMessageListener) {
      const handler = (event: MessageEvent) => listener(event.data);
      port.on("message", handler);
      if (!started) {
        started = true;
        port.start();
      }
      return () => port.removeListener("message", handler);
    },
    postMessage(message) {
      if (closed) throw new Error("The audio-feature port is closed.");
      port.postMessage(message);
    },
  };
}
