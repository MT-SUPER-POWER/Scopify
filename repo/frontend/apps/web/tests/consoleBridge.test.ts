import { afterEach, describe, expect, test } from "bun:test";

import type { RendererLogEvent } from "@scopify/desktop-contract";
import type { RuntimeLogging } from "@/lib/runtime/types";

const CONSOLE_BRIDGE_STATE = Symbol.for("scopify.renderer-console-bridge");

describe("renderer console bridge", () => {
  const originalConsoleDebug = console.debug;
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");

  afterEach(() => {
    console.debug = originalConsoleDebug;
    Reflect.deleteProperty(globalThis, CONSOLE_BRIDGE_STATE);
    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  });

  test("keeps native output and forwards a redacted structured event", async () => {
    const nativeCalls: unknown[][] = [];
    console.debug = (...args: unknown[]) => nativeCalls.push(args);
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    });

    const events: RendererLogEvent[] = [];
    const logging: RuntimeLogging = {
      getDirectory: async () => null,
      openCurrentFile: async () => false,
      openDirectory: async () => false,
      write: async (event) => {
        events.push(event);
        return true;
      },
    };
    const { installRendererConsoleBridge } = await import("@/lib/runtime/consoleBridge");

    installRendererConsoleBridge(logging);
    console.debug("renderer-debug", { token: "secret-token", value: 42 });
    await Promise.resolve();

    expect(nativeCalls).toEqual([["renderer-debug", { token: "secret-token", value: 42 }]]);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      event: "console.debug",
      level: "debug",
      message: "renderer-debug",
      source: "console",
    });
    expect(events[0]?.metadata).toEqual({
      arguments: [{ token: "[REDACTED]", value: 42 }],
    });
  });
});
