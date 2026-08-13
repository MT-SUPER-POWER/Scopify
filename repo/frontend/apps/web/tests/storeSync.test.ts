import { describe, expect, test } from "bun:test";
import { create } from "zustand";

import { setupStoreSync, type StoreSyncChannel } from "@/lib/storeSync";

interface TestStore {
  increment(): void;
  value: number;
}

interface TestSnapshot {
  value: number;
}

function createTestStore(value: number) {
  return create<TestStore>((set) => ({
    increment: () => set((state) => ({ value: state.value + 1 })),
    value,
  }));
}

function createMemoryChannelFactory() {
  const channels = new Map<string, Set<MemoryChannel>>();
  const messages: unknown[] = [];

  class MemoryChannel implements StoreSyncChannel {
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
    private isClosed = false;

    constructor(private readonly name: string) {
      const peers = channels.get(name) ?? new Set<MemoryChannel>();
      peers.add(this);
      channels.set(name, peers);
    }

    close() {
      this.isClosed = true;
      channels.get(this.name)?.delete(this);
    }

    postMessage(message: unknown) {
      if (this.isClosed) return;
      const clonedMessage = structuredClone(message);
      messages.push(clonedMessage);
      for (const peer of channels.get(this.name) ?? []) {
        if (peer !== this && !peer.isClosed) {
          peer.onmessage?.({ data: structuredClone(clonedMessage) } as MessageEvent<unknown>);
        }
      }
    }
  }

  return {
    create: (name: string) => new MemoryChannel(name),
    messages,
  };
}

function connectStore(
  store: ReturnType<typeof createTestStore>,
  channelFactory: (name: string) => StoreSyncChannel,
) {
  return setupStoreSync(store, {
    applySnapshot: (snapshot: TestSnapshot) => store.setState(snapshot),
    channelFactory,
    channelName: "test-settings",
    parseSnapshot: (candidate) =>
      typeof candidate === "object" &&
      candidate !== null &&
      "value" in candidate &&
      typeof candidate.value === "number"
        ? { value: candidate.value }
        : null,
    selectSnapshot: (state): TestSnapshot => ({ value: state.value }),
  });
}

describe("cross-window store synchronization", () => {
  test("hydrates a newly connected window and relays serializable snapshots without echoing", () => {
    const network = createMemoryChannelFactory();
    const firstStore = createTestStore(7);
    const secondStore = createTestStore(0);
    const disconnectFirst = connectStore(firstStore, network.create);
    const disconnectSecond = connectStore(secondStore, network.create);

    expect(secondStore.getState().value).toBe(7);

    const messagesBeforeUpdate = network.messages.length;
    firstStore.getState().increment();

    expect(secondStore.getState().value).toBe(8);
    expect(network.messages).toHaveLength(messagesBeforeUpdate + 1);

    disconnectSecond?.();
    firstStore.getState().increment();
    expect(secondStore.getState().value).toBe(8);

    disconnectFirst?.();
  });
});
