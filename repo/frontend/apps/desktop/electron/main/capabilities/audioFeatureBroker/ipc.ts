import { ipcMain, type BrowserWindow, type IpcMainEvent } from "electron";

import { adaptElectronAudioFeaturePort } from "./electronPort";
import { createAudioFeatureBroker, type AudioFeatureBrokerDiagnostics } from "./index";
import {
  createOwnedAudioFeatureConnectionId,
  parseAudioFeatureConnectionRequest,
} from "./connectionRequest";

export const AUDIO_FEATURE_CONNECT_CHANNEL = "audio-feature-transport:connect";

export interface AudioFeatureBrokerIpcOptions {
  getPublisherWindow(): BrowserWindow | null;
  getSubscriberWindows(): Array<BrowserWindow | null>;
  /** Called once for each authorized publisher transport that registers successfully. */
  onPublisherConnected?(senderId: number): void;
  onRejected?(message: string): void;
}

export interface AudioFeatureBrokerIpcHost {
  dispose(): void;
  getDiagnostics(): AudioFeatureBrokerDiagnostics;
}

/**
 * Electron's authentication and lifecycle boundary for the lossy audio-feature
 * broker. The renderer's connection ID is intentionally never used as a broker
 * identity: ownership is derived from the sender webContents ID instead.
 */
export function initializeAudioFeatureBrokerIpc(
  options: AudioFeatureBrokerIpcOptions,
): AudioFeatureBrokerIpcHost {
  const broker = createAudioFeatureBroker();

  const onConnect = (event: IpcMainEvent, input: unknown) => {
    const request = parseAudioFeatureConnectionRequest(input);
    const port = event.ports[0];
    if (!request || !port || event.ports.length !== 1) {
      options.onRejected?.("Rejected malformed audio-feature transport connection.");
      closePorts(event.ports);
      return;
    }

    const senderId = event.sender.id;
    const authorized =
      request.role === "publisher"
        ? senderId === getWindowId(options.getPublisherWindow())
        : options.getSubscriberWindows().some((window) => senderId === getWindowId(window));
    if (!authorized) {
      options.onRejected?.(
        `Rejected unauthorized ${request.role} audio-feature connection from renderer ${senderId}.`,
      );
      closePorts(event.ports);
      return;
    }

    const adaptedPort = adaptElectronAudioFeaturePort(port);
    const ownedConnectionId = createOwnedAudioFeatureConnectionId(request.role, senderId);
    try {
      if (request.role === "publisher") {
        broker.registerPublisher(ownedConnectionId, adaptedPort);
      } else {
        broker.registerSubscriber(ownedConnectionId, adaptedPort);
      }
    } catch {
      try {
        adaptedPort.close();
      } catch {
        // Registration failures are isolated to this renderer connection.
      }
      options.onRejected?.(
        `Failed to register ${request.role} audio-feature connection for renderer ${senderId}.`,
      );
      return;
    }

    if (request.role === "publisher") options.onPublisherConnected?.(senderId);
  };

  ipcMain.on(AUDIO_FEATURE_CONNECT_CHANNEL, onConnect);

  return {
    dispose() {
      ipcMain.removeListener(AUDIO_FEATURE_CONNECT_CHANNEL, onConnect);
      broker.dispose();
    },
    getDiagnostics: broker.getDiagnostics,
  };
}

function closePorts(ports: Electron.MessagePortMain[]) {
  for (const port of ports) {
    try {
      port.close();
    } catch {
      // All transferred ports have been quarantined; one broken port must not leak the rest.
    }
  }
}

function getWindowId(window: BrowserWindow | null) {
  return window && !window.isDestroyed() && !window.webContents.isDestroyed()
    ? window.webContents.id
    : null;
}
