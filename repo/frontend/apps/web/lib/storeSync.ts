import type { StoreApi, UseBoundStore } from "zustand";

export interface StoreSyncChannel {
  close(): void;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: unknown): void;
}

export interface StoreSyncOptions<State, Snapshot> {
  applySnapshot(snapshot: Snapshot): void;
  channelFactory?(channelName: string): StoreSyncChannel;
  channelName: string;
  parseSnapshot?(candidate: unknown): Snapshot | null;
  selectSnapshot(state: State): Snapshot;
}

type StoreSyncMessage<Snapshot> =
  | { sourceId: string; type: "request" }
  | { snapshot: Snapshot; sourceId: string; type: "snapshot" };

export function setupStoreSync<State, Snapshot>(
  store: UseBoundStore<StoreApi<State>>,
  options: StoreSyncOptions<State, Snapshot>,
) {
  const channelFactory =
    options.channelFactory ??
    (typeof BroadcastChannel === "undefined"
      ? null
      : (channelName: string) => new BroadcastChannel(channelName));
  if (!channelFactory) return;

  const channel = channelFactory(options.channelName);
  const sourceId = crypto.randomUUID();
  let isApplyingRemoteSnapshot = false;

  const publishSnapshot = () => {
    channel.postMessage({
      snapshot: options.selectSnapshot(store.getState()),
      sourceId,
      type: "snapshot",
    } satisfies StoreSyncMessage<Snapshot>);
  };

  channel.onmessage = (event) => {
    const message = parseStoreSyncMessage(event.data);
    if (!message || message.sourceId === sourceId) return;

    if (message.type === "request") {
      publishSnapshot();
      return;
    }

    const snapshot = options.parseSnapshot
      ? options.parseSnapshot(message.snapshot)
      : (message.snapshot as Snapshot);
    if (snapshot === null) return;

    isApplyingRemoteSnapshot = true;
    try {
      options.applySnapshot(snapshot);
    } finally {
      isApplyingRemoteSnapshot = false;
    }
  };

  const unsubscribe = store.subscribe((state) => {
    if (!isApplyingRemoteSnapshot) {
      channel.postMessage({
        snapshot: options.selectSnapshot(state),
        sourceId,
        type: "snapshot",
      } satisfies StoreSyncMessage<Snapshot>);
    }
  });

  channel.postMessage({ sourceId, type: "request" } satisfies StoreSyncMessage<Snapshot>);

  return () => {
    unsubscribe();
    channel.close();
  };
}

function parseStoreSyncMessage(candidate: unknown): StoreSyncMessage<unknown> | null {
  if (!isRecord(candidate) || typeof candidate.sourceId !== "string") return null;
  if (candidate.type === "request") {
    return { sourceId: candidate.sourceId, type: "request" };
  }
  if (candidate.type !== "snapshot" || !("snapshot" in candidate)) return null;
  return {
    snapshot: candidate.snapshot,
    sourceId: candidate.sourceId,
    type: "snapshot",
  };
}

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === "object" && candidate !== null && !Array.isArray(candidate);
}
