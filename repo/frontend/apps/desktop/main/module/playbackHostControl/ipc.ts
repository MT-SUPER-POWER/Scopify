import { ipcMain, type BrowserWindow, type IpcMainEvent } from "electron";

import type { PlaybackHostCheckpointRepository } from "../playbackHost/checkpoint.js";

import { adaptElectronPlaybackHostControlPort } from "./electronPort.js";
import {
  createPlaybackHostControlBroker,
  type PlaybackHostControlBrokerClock,
  type PlaybackHostControlBrokerDiagnostics,
} from "./index.js";
import {
  createOwnedPlaybackHostControlConnectionId,
  parsePlaybackHostControlConnectionRequest,
} from "./connectionRequest.js";

export const PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL = "playback-host-control:connect";

export interface PlaybackHostControlBrokerIpcOptions {
  checkpointRepository?: PlaybackHostCheckpointRepository;
  clock?: PlaybackHostControlBrokerClock;
  getClientWindow(): BrowserWindow | null;
  getHostWindow(): BrowserWindow | null;
  onClientConnected?(senderId: number): void;
  onHostConnected?(senderId: number): void;
  /** Fires only after the registered Host has resolved its recovery barrier. */
  onHostRecoverySettled?(senderId: number): void;
  onRejected?(message: string): void;
}

export interface PlaybackHostControlBrokerIpcHost {
  dispose(): void;
  getDiagnostics(): PlaybackHostControlBrokerDiagnostics;
}

/** Electron's allowlist and ownership boundary for Playback Host control. */
export function initializePlaybackHostControlBrokerIpc(
  options: PlaybackHostControlBrokerIpcOptions,
): PlaybackHostControlBrokerIpcHost {
  const broker = createPlaybackHostControlBroker({
    checkpointRepository: options.checkpointRepository,
    clock: options.clock,
  });

  const onConnect = (event: IpcMainEvent, input: unknown) => {
    const request = parsePlaybackHostControlConnectionRequest(input);
    const port = event.ports[0];
    if (!request || !port || event.ports.length !== 1) {
      options.onRejected?.("Rejected malformed Playback Host control transport connection.");
      closePorts(event.ports);
      return;
    }

    const senderId = event.sender.id;
    const expectedWindow =
      request.role === "client" ? options.getClientWindow() : options.getHostWindow();
    if (senderId !== getWindowId(expectedWindow)) {
      options.onRejected?.(
        `Rejected unauthorized ${request.role} Playback Host control connection from renderer ${senderId}.`,
      );
      closePorts(event.ports);
      return;
    }

    const adaptedPort = adaptElectronPlaybackHostControlPort(port);
    const ownedConnectionId = createOwnedPlaybackHostControlConnectionId(request.role, senderId);
    try {
      if (request.role === "client") broker.registerClient(ownedConnectionId, adaptedPort);
      else {
        broker.registerHost(ownedConnectionId, adaptedPort, () => {
          options.onHostRecoverySettled?.(senderId);
        });
      }
    } catch {
      try {
        adaptedPort.close();
      } catch {
        // Registration failures are isolated to this renderer connection.
      }
      options.onRejected?.(
        `Failed to register ${request.role} Playback Host control connection for renderer ${senderId}.`,
      );
      return;
    }

    if (request.role === "client") options.onClientConnected?.(senderId);
    else options.onHostConnected?.(senderId);
  };

  ipcMain.on(PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL, onConnect);

  return {
    dispose() {
      ipcMain.removeListener(PLAYBACK_HOST_CONTROL_CONNECT_CHANNEL, onConnect);
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
