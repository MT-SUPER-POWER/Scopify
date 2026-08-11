import { ipcMain, type BrowserWindow, type IpcMainEvent } from "electron";

import { adaptElectronPlaybackPort } from "./electronPort.js";
import { createPlaybackBroker, type PlaybackBrokerDiagnostics } from "./index.js";
import {
  createOwnedPlaybackConnectionId,
  parsePlaybackConnectionRequest,
} from "./connectionRequest.js";

export const PLAYBACK_CONNECT_CHANNEL = "playback-transport:connect";

export interface PlaybackBrokerIpcOptions {
  getAuthorityWindow(): BrowserWindow | null;
  getReplicaWindows(): Array<BrowserWindow | null>;
  onRejected?(message: string): void;
}

export interface PlaybackBrokerIpcHost {
  dispose(): void;
  getDiagnostics(): PlaybackBrokerDiagnostics;
}

export function initializePlaybackBrokerIpc(
  options: PlaybackBrokerIpcOptions,
): PlaybackBrokerIpcHost {
  const broker = createPlaybackBroker();

  const onConnect = (event: IpcMainEvent, input: unknown) => {
    const request = parsePlaybackConnectionRequest(input);
    const port = event.ports[0];
    if (!request || !port || event.ports.length !== 1) {
      options.onRejected?.("Rejected malformed playback transport connection.");
      event.ports.forEach((candidate) => candidate.close());
      return;
    }

    const senderId = event.sender.id;
    const authorized =
      request.role === "authority"
        ? senderId === getWindowId(options.getAuthorityWindow())
        : options.getReplicaWindows().some((window) => senderId === getWindowId(window));

    if (!authorized) {
      options.onRejected?.(
        `Rejected unauthorized ${request.role} playback connection from renderer ${senderId}.`,
      );
      port.close();
      return;
    }

    const adaptedPort = adaptElectronPlaybackPort(port);
    const ownedConnectionId = createOwnedPlaybackConnectionId(request.role, senderId);
    try {
      if (request.role === "authority") {
        broker.registerAuthority(ownedConnectionId, adaptedPort);
      } else {
        broker.registerReplica(ownedConnectionId, adaptedPort);
      }
    } catch {
      try {
        adaptedPort.close();
      } catch {
        // Registration failures are isolated to this renderer connection.
      }
      options.onRejected?.(
        `Failed to register ${request.role} playback connection for renderer ${senderId}.`,
      );
    }
  };

  ipcMain.on(PLAYBACK_CONNECT_CHANNEL, onConnect);

  return {
    dispose() {
      ipcMain.removeListener(PLAYBACK_CONNECT_CHANNEL, onConnect);
      broker.dispose();
    },
    getDiagnostics: broker.getDiagnostics,
  };
}

function getWindowId(window: BrowserWindow | null) {
  return window && !window.isDestroyed() && !window.webContents.isDestroyed()
    ? window.webContents.id
    : null;
}
