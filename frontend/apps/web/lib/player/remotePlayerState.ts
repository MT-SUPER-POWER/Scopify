import type { RemotePlayerSnapshot, RemotePlayerSnapshotSource } from "@/types/player";

interface RemotePlayerSnapshotScheduler {
  clearInterval(handle: unknown): void;
  setInterval(callback: () => void, intervalMs: number): unknown;
}

interface CrossWindowPlayerSnapshotOptions {
  heartbeatIntervalMs: number;
  onListenerError?: (error: unknown, listenerIndex: number) => void;
  scheduler: RemotePlayerSnapshotScheduler;
}

export const REMOTE_PLAYER_SNAPSHOT_EVENT = "scopify:remote-player-snapshot";

export function selectRemotePlayerSnapshot(state: RemotePlayerSnapshot): RemotePlayerSnapshot {
  return {
    currentSongDetail: state.currentSongDetail,
    isPlaying: state.isPlaying,
    positionMs: state.positionMs,
    volume: state.volume,
  };
}

export function subscribeRemotePlayerSnapshots<State extends RemotePlayerSnapshot>(
  source: RemotePlayerSnapshotSource<State>,
  listener: (snapshot: RemotePlayerSnapshot) => void,
) {
  listener(selectRemotePlayerSnapshot(source.getState()));
  return source.subscribe((state) => listener(selectRemotePlayerSnapshot(state)));
}

export function subscribeCrossWindowPlayerSnapshots<State extends RemotePlayerSnapshot>(
  source: RemotePlayerSnapshotSource<State>,
  listeners: Array<(snapshot: RemotePlayerSnapshot) => void>,
  options: CrossWindowPlayerSnapshotOptions,
) {
  let lastPublishedSnapshot: RemotePlayerSnapshot | null = null;
  const publish = (state: State, force = false) => {
    const snapshot = selectRemotePlayerSnapshot(state);
    if (!force && snapshotsMatch(snapshot, lastPublishedSnapshot)) return;
    const published = publishCrossWindowPlayerSnapshot(
      snapshot,
      listeners,
      options.onListenerError,
    );
    if (published) lastPublishedSnapshot = snapshot;
  };

  publish(source.getState(), true);
  const unsubscribeSource = source.subscribe((state) => publish(state));
  const heartbeat = options.scheduler.setInterval(
    () => publish(source.getState()),
    options.heartbeatIntervalMs,
  );
  return () => {
    options.scheduler.clearInterval(heartbeat);
    unsubscribeSource();
  };
}

export function publishCrossWindowPlayerSnapshot(
  snapshot: RemotePlayerSnapshot,
  listeners: Array<(snapshot: RemotePlayerSnapshot) => void>,
  onListenerError?: (error: unknown, listenerIndex: number) => void,
) {
  let published = true;
  listeners.forEach((listener, listenerIndex) => {
    try {
      listener(snapshot);
    } catch (error) {
      published = false;
      onListenerError?.(error, listenerIndex);
    }
  });
  return published;
}

function snapshotsMatch(left: RemotePlayerSnapshot, right: RemotePlayerSnapshot | null) {
  return (
    right !== null &&
    left.currentSongDetail === right.currentSongDetail &&
    left.isPlaying === right.isPlaying &&
    left.positionMs === right.positionMs &&
    left.volume === right.volume
  );
}
