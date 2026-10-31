import { describe, expect, mock, test } from "bun:test";
import { createApplicationShutdown } from "../electron/main/core/shutdown";

describe("application shutdown", () => {
  test("all quit requests share cleanup and exit exactly once", async () => {
    let finish!: () => void;
    const dispose = mock(() => new Promise<void>((resolve) => (finish = resolve)));
    const exit = mock(() => {});
    const onStarted = mock(() => {});
    const shutdown = createApplicationShutdown({ dispose, exit, onStarted, timeoutMs: 100 });
    const event = { preventDefault: mock(() => {}) };
    const pending = shutdown.handleBeforeQuit(event);
    expect(shutdown.handleBeforeQuit(event)).toBe(pending);
    await Promise.resolve();
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(onStarted).toHaveBeenCalledTimes(1);
    expect(exit).not.toHaveBeenCalled();
    finish();
    await pending;
    expect(exit).toHaveBeenCalledTimes(1);
    expect(shutdown.handleBeforeQuit(event)).toBeNull();
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
  });

  test("a stuck service cannot prevent exit or trigger another exit after settling", async () => {
    let finish!: () => void;
    const exit = mock(() => {});
    const onError = mock(() => {});
    const shutdown = createApplicationShutdown({
      dispose: () => new Promise<void>((resolve) => (finish = resolve)),
      exit,
      onError,
      timeoutMs: 10,
    });
    const pending = shutdown.handleBeforeQuit({ preventDefault() {} });
    await Bun.sleep(30);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    finish();
    await pending;
    expect(exit).toHaveBeenCalledTimes(1);
  });

  test("cleanup rejection still exits and cancels the deadline", async () => {
    const exit = mock(() => {});
    const onError = mock(() => {});
    const shutdown = createApplicationShutdown({
      dispose: async () => {
        throw new Error("cleanup failed");
      },
      exit,
      onError,
      timeoutMs: 10,
    });
    await shutdown.handleBeforeQuit({ preventDefault() {} });
    await Bun.sleep(30);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenCalledTimes(1);
  });
});
