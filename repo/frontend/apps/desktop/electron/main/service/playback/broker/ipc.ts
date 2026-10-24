import type {
  PlaybackBrokerIpcOptions,
  PlaybackBrokerIpcBinding,
  PlaybackBrokerIpcHost,
} from "@/types/service/playback/broker/ipc";
export type {
  PlaybackBrokerIpcOptions,
  PlaybackBrokerIpcBinding,
  PlaybackBrokerIpcHost,
} from "@/types/service/playback/broker/ipc";
import { ipcMain, type BrowserWindow, type IpcMainEvent } from "electron";

import { adaptElectronPlaybackPort } from "@main/service/playback/broker/electronPort";
import { createPlaybackBroker } from "@main/service/playback/broker/index";
import type { PlaybackBroker } from "@/types/service/playback/broker";
import {
  createOwnedPlaybackConnectionId,
  parsePlaybackConnectionRequest,
} from "@main/service/playback/broker/connectionRequest";

export const PLAYBACK_CONNECT_CHANNEL = "playback-transport:connect";

export function bindPlaybackBrokerIpc(
  broker: PlaybackBroker,
  options: PlaybackBrokerIpcOptions,
): PlaybackBrokerIpcBinding {
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
      return;
    }

    if (request.role === "authority") options.onAuthorityConnected?.(senderId);
  };

  ipcMain.on(PLAYBACK_CONNECT_CHANNEL, onConnect);

  return {
    dispose() {
      ipcMain.removeListener(PLAYBACK_CONNECT_CHANNEL, onConnect);
    },
  };
}

/**
 * Compatibility composition helper for existing callers. New Main-process
 * composition roots should create the Broker once, bind Electron IPC with
 * `bindPlaybackBrokerIpc`, then attach any internal consumers directly.
 */
export function initializePlaybackBrokerIpc(
  options: PlaybackBrokerIpcOptions,
): PlaybackBrokerIpcHost {
  const broker = createPlaybackBroker();
  const binding = bindPlaybackBrokerIpc(broker, options);

  return {
    dispose() {
      binding.dispose();
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
