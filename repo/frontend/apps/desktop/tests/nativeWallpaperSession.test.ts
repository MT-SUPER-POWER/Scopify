import { describe, expect, test } from "bun:test";
import { createNativeWallpaperSession } from "../electron/main/service/desktop/wallpaper/nativeWallpaperSession";
import type { NativeWallpaperSessionModule } from "../types/nativeWallpaper";

const bounds = { x: -1280, y: -100, width: 1280, height: 720 };
const attachedEvent = (mode: string) =>
  JSON.stringify({ event: "attached", hwnd: 0, workerw: 0, mode });

function backend(mode: "classic" | "macos-desktop") {
  const events: string[] = [];
  let attached = false;
  let detachRequested = false;
  const native: NativeWallpaperSessionModule = {
    attach() {
      attached = true;
      events.push(attachedEvent(mode));
    },
    detach() {
      detachRequested = true;
      attached = false;
      events.push('{"event":"detached"}');
    },
    pollEvents: () => events.splice(0),
    isAttached: () => attached,
  };
  return { native, events, detached: () => detachRequested };
}

describe("native wallpaper lifecycle", () => {
  for (const mode of ["classic", "macos-desktop"] as const) {
    test(`${mode} uses the same attach and detach acknowledgements`, async () => {
      const mock = backend(mode);
      const session = createNativeWallpaperSession(mock.native);
      const attachment = await session.attach(
        Buffer.alloc(8),
        bounds,
        900,
        new AbortController().signal,
      );
      expect(attachment.mode).toBe(mode);
      expect(session.isAttached()).toBe(true);
      expect(await session.detach()).toBe(true);
      expect(session.isAttached()).toBe(false);
      expect(mock.detached()).toBe(true);
      await session.dispose();
    });
  }

  test("cancelling startup still detaches a backend which has not acknowledged attach", async () => {
    const mock = backend("classic");
    mock.native.attach = () => undefined;
    const session = createNativeWallpaperSession(mock.native);
    const abort = new AbortController();
    const operation = session.attach(Buffer.alloc(8), bounds, 900, abort.signal);
    abort.abort();
    await expect(operation).rejects.toMatchObject({ name: "AbortError" });
    expect(await session.detach()).toBe(true);
    expect(mock.detached()).toBe(true);
    await session.dispose();
  });

  test("a failed detach prevents reusing the native session", async () => {
    const mock = backend("classic");
    const session = createNativeWallpaperSession(mock.native, { detachTimeoutMs: 5 });
    await session.attach(Buffer.alloc(8), bounds, 900, new AbortController().signal);
    mock.native.detach = () => {
      throw new Error("restore failed");
    };
    expect(await session.detach()).toBe(false);
    await expect(
      session.attach(Buffer.alloc(8), bounds, 900, new AbortController().signal),
    ).rejects.toThrow("not detached");
    mock.native.detach = () => {
      mock.events.push('{"event":"detached"}');
    };
    await session.dispose();
  });

  test("backend startup errors reject without reporting a second host-lost event", async () => {
    const mock = backend("macos-desktop");
    const lost: string[] = [];
    mock.native.attach = () => {
      mock.events.push('{"event":"error","message":"AppKit unavailable"}', '{"event":"detached"}');
    };
    const session = createNativeWallpaperSession(mock.native, {
      onLost: (message) => lost.push(message),
    });
    await expect(
      session.attach(Buffer.alloc(8), bounds, 900, new AbortController().signal),
    ).rejects.toThrow("AppKit unavailable");
    expect(lost).toEqual([]);
    await session.dispose();
  });
});
