import type { PlaybackCommand, PlaybackMessage } from "@mt-super-power/desktop-contract";

import { createPlaybackReplica, type PlaybackReplica } from "@/lib/playbackProjection/replica";
import type {
  InMemoryPlaybackDeliveryOptions,
  InMemoryPlaybackTransportOptions,
  PendingPlaybackDelivery,
  PlaybackMessageApplyResult,
  PlaybackProjectionSource,
} from "@/types/playbackProjection";

export class InMemoryPlaybackTransport<TLyrics = unknown> {
  readonly dispatchedCommands: PlaybackCommand[] = [];
  readonly source: PlaybackProjectionSource<TLyrics>;

  private nextOrder = 0;
  private readonly pendingDeliveries: Array<PendingPlaybackDelivery<TLyrics>> = [];
  private readonly replica: PlaybackReplica<TLyrics>;

  constructor(private readonly options: InMemoryPlaybackTransportOptions) {
    this.replica = createPlaybackReplica<TLyrics>({
      clock: options.clock,
      disconnectAfterMs: options.disconnectAfterMs,
      dispatchCommand: async (command) => {
        this.dispatchedCommands.push(command);
        if (options.handleCommand) return options.handleCommand(command);
        return { commandId: command.commandId, status: "accepted" };
      },
    });
    this.source = this.replica;
  }

  get pendingCount(): number {
    return this.pendingDeliveries.length;
  }

  advanceBy(durationMs: number): PlaybackMessageApplyResult[] {
    this.options.clock.advanceBy(durationMs);
    return this.deliverReady();
  }

  connect(): void {
    this.replica.connect();
  }

  deliver(message: PlaybackMessage<TLyrics>): PlaybackMessageApplyResult {
    return this.replica.receive(message);
  }

  deliverAll(): PlaybackMessageApplyResult[] {
    const results: PlaybackMessageApplyResult[] = [];
    while (this.pendingDeliveries.length > 0) {
      const nextDeliveryAtMs = Math.min(
        ...this.pendingDeliveries.map((delivery) => delivery.deliverAtMs),
      );
      if (nextDeliveryAtMs > this.options.clock.nowMs()) {
        this.options.clock.setNowMs(nextDeliveryAtMs);
      }
      results.push(...this.deliverReady());
    }
    return results;
  }

  deliverReady(): PlaybackMessageApplyResult[] {
    const nowMs = this.options.clock.nowMs();
    const ready = this.pendingDeliveries
      .filter((delivery) => delivery.deliverAtMs <= nowMs)
      .sort((left, right) => left.deliverAtMs - right.deliverAtMs || left.order - right.order);
    if (ready.length === 0) return [];

    const readyOrders = new Set(ready.map((delivery) => delivery.order));
    const waiting = this.pendingDeliveries.filter((delivery) => !readyOrders.has(delivery.order));
    this.pendingDeliveries.splice(0, this.pendingDeliveries.length, ...waiting);
    return ready.map((delivery) => this.replica.receive(delivery.message));
  }

  disconnect(): void {
    this.replica.disconnect();
  }

  send(message: PlaybackMessage<TLyrics>, options: InMemoryPlaybackDeliveryOptions = {}): void {
    const delayMs = options.delayMs ?? 0;
    if (!Number.isFinite(delayMs) || delayMs < 0) {
      throw new RangeError("In-memory playback delivery delay must be finite and non-negative");
    }

    this.pendingDeliveries.push({
      deliverAtMs: this.options.clock.nowMs() + delayMs,
      message,
      order: this.nextOrder++,
    });
  }
}

export function createInMemoryPlaybackTransport<TLyrics = unknown>(
  options: InMemoryPlaybackTransportOptions,
): InMemoryPlaybackTransport<TLyrics> {
  return new InMemoryPlaybackTransport<TLyrics>(options);
}
