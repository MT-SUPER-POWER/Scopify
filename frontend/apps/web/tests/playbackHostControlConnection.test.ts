import { describe, expect, test } from "bun:test";

import {
  createPlaybackHostControlConnection,
  PLAYBACK_HOST_CONTROL_RECONNECT_INITIAL_DELAY_MS,
} from "@/lib/playbackHost/hostControlConnection";
import type {
  RuntimePlaybackHostControlClientPayload,
  RuntimePlaybackHostControlConnection,
  RuntimePlaybackHostControlHostPayload,
} from "@/lib/runtime";

interface FakeAttempt {
  closeCount: number;
  onClose: () => void;
  onPayload: (payload: RuntimePlaybackHostControlHostPayload) => void;
  sent: RuntimePlaybackHostControlClientPayload[];
}

class ManualTimer {
  readonly delays: number[] = [];
  cleared = 0;
  private callbacks = new Map<number, () => void>();
  private nextHandle = 0;

  clearTimeout(handle: unknown): void {
    this.cleared += 1;
    this.callbacks.delete(handle as number);
  }

  setTimeout(callback: () => void, delayMs: number): unknown {
    const handle = ++this.nextHandle;
    this.delays.push(delayMs);
    this.callbacks.set(handle, callback);
    return handle;
  }

  fireNext(): void {
    const entry = this.callbacks.entries().next().value as [number, () => void] | undefined;
    if (!entry) throw new Error("No reconnect timer is scheduled.");
    this.callbacks.delete(entry[0]);
    entry[1]();
  }
}

function createHarness() {
  const attempts: FakeAttempt[] = [];
  const timer = new ManualTimer();
  const received: RuntimePlaybackHostControlHostPayload[] = [];
  const connection = createPlaybackHostControlConnection({
    connectionId: "host-control-test",
    onPayload: (payload) => received.push(payload),
    port: {
      connectHost: (_connectionId, onPayload, onClose) => {
        const attempt: FakeAttempt = { closeCount: 0, onClose, onPayload, sent: [] };
        attempts.push(attempt);
        const result: RuntimePlaybackHostControlConnection<RuntimePlaybackHostControlClientPayload> =
          {
            close: () => {
              attempt.closeCount += 1;
            },
            send: (payload) => {
              attempt.sent.push(payload);
              return true;
            },
          };
        return result;
      },
    },
    timer,
  });
  return { attempts, connection, received, timer };
}

describe("PlaybackHostControlConnection", () => {
  test("reconnects a closed Host port and lets the replacement keep receiving commands", () => {
    const { attempts, connection, received, timer } = createHarness();

    connection.start();
    expect(attempts).toHaveLength(1);

    attempts[0]?.onClose();
    expect(timer.delays).toEqual([PLAYBACK_HOST_CONTROL_RECONNECT_INITIAL_DELAY_MS]);
    timer.fireNext();
    expect(attempts).toHaveLength(2);

    const command = { type: "test-host-command" } as never;
    attempts[1]?.onPayload(command);
    expect(received).toEqual([command]);

    const hostMessage = { type: "test-host-message" } as never;
    expect(connection.send(hostMessage)).toBe(true);
    expect(attempts[1]?.sent).toEqual([hostMessage]);
  });

  test("ignores a delayed old close callback and caps serial reconnect delays", () => {
    const { attempts, connection, timer } = createHarness();

    connection.start();
    const retired = attempts[0] as FakeAttempt;
    retired.onClose();
    timer.fireNext();
    const active = attempts[1] as FakeAttempt;

    // A late event from the retired MessagePort must not disconnect the active port.
    retired.onClose();
    expect(attempts).toHaveLength(2);
    expect(timer.delays).toEqual([250]);

    active.onClose();
    timer.fireNext();
    attempts[2]?.onClose();
    timer.fireNext();
    attempts[3]?.onClose();
    timer.fireNext();
    attempts[4]?.onClose();

    expect(timer.delays).toEqual([250, 500, 1_000, 2_000, 4_000]);
    connection.stop();
    expect(timer.cleared).toBe(1);
    expect(attempts[4]?.closeCount).toBe(1);
  });
});
