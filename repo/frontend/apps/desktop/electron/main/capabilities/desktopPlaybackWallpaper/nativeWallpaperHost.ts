import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { app, type BrowserWindow } from "electron";
import { z } from "zod";

import { logger } from "@main/constants";

const ATTACH_TIMEOUT_MS = 10_000;
const DETACH_TIMEOUT_MS = 5_000;
const HEARTBEAT_TIMEOUT_MS = 15_000;

const ATTACHED_EVENT_SCHEMA = z.object({
  event: z.literal("attached"),
  hwnd: z.number(),
  mode: z.enum(["classic", "raised"]),
  workerw: z.number(),
});
const ERROR_EVENT_SCHEMA = z.object({
  event: z.literal("error"),
  kind: z.string().optional(),
  message: z.string(),
});

export interface NativeWallpaperAttachment {
  hwnd: number;
  mode: "classic" | "raised";
  workerW: number;
}

export interface NativeWallpaperHost {
  attach(window: BrowserWindow, signal: AbortSignal): Promise<NativeWallpaperAttachment>;
  detach(signal?: AbortSignal): Promise<boolean>;
  dispose(): Promise<void>;
  isAttached(): boolean;
}

export interface NativeWallpaperHostOptions {
  helperPath?: string;
  onLost?(diagnostic: string): void;
}

/** Manages the resident native WorkerW helper and its JSONL lifecycle protocol. */
export function createNativeWallpaperHost(
  options: NativeWallpaperHostOptions = {},
): NativeWallpaperHost {
  let child: ChildProcessWithoutNullStreams | null = null;
  let attached = false;
  let intentionalShutdown = false;
  let lastEventAt = 0;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let pendingAttach: {
    reject(error: Error): void;
    resolve(attachment: NativeWallpaperAttachment): void;
  } | null = null;
  let pendingDetach: ((detached: boolean) => void) | null = null;

  const stopHeartbeatMonitor = () => {
    if (!heartbeatTimer) return;
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  };

  const stopChild = () => {
    const activeChild = child;
    child = null;
    attached = false;
    stopHeartbeatMonitor();
    if (activeChild && !activeChild.killed) activeChild.kill();
  };

  const reportLost = (diagnostic: string) => {
    if (intentionalShutdown) return;
    options.onLost?.(diagnostic);
  };

  const startHeartbeatMonitor = () => {
    stopHeartbeatMonitor();
    heartbeatTimer = setInterval(() => {
      if (!child || Date.now() - lastEventAt <= HEARTBEAT_TIMEOUT_MS) return;
      logger.warn("[desktop-playback-wallpaper] native helper heartbeat timed out");
      void detach().finally(() => {
        intentionalShutdown = false;
        reportLost("The native wallpaper helper stopped responding.");
      });
    }, 5_000);
    heartbeatTimer.unref?.();
  };

  const handleEvent = (event: unknown) => {
    lastEventAt = Date.now();
    const attachedEvent = ATTACHED_EVENT_SCHEMA.safeParse(event);
    if (attachedEvent.success) {
      attached = true;
      pendingAttach?.resolve({
        hwnd: attachedEvent.data.hwnd,
        mode: attachedEvent.data.mode,
        workerW: attachedEvent.data.workerw,
      });
      pendingAttach = null;
      return;
    }
    if (isEventKind(event, "heartbeat")) return;
    if (isEventKind(event, "detached")) {
      attached = false;
      pendingDetach?.(true);
      pendingDetach = null;
      return;
    }
    const errorEvent = ERROR_EVENT_SCHEMA.safeParse(event);
    if (!errorEvent.success) return;
    const error = new Error(errorEvent.data.message);
    if (pendingAttach) {
      pendingAttach.reject(error);
      pendingAttach = null;
      return;
    }
    reportLost(error.message);
  };

  const attach = (window: BrowserWindow, signal: AbortSignal) => {
    if (process.platform !== "win32") {
      return Promise.reject(new Error("The native wallpaper helper requires Windows."));
    }
    if (child || attached) {
      return Promise.reject(new Error("The native wallpaper helper is already active."));
    }
    const helperPath = options.helperPath ?? resolveNativeWallpaperHelperPath();
    if (!existsSync(helperPath)) {
      return Promise.reject(new Error(`Native wallpaper helper not found: ${helperPath}`));
    }

    const hwnd = readNativeWindowHandle(window.getNativeWindowHandle());
    intentionalShutdown = false;
    lastEventAt = Date.now();
    const activeChild = spawn(helperPath, ["attach", "--hwnd", hwnd.toString(), "--zguard"], {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
    });
    child = activeChild;
    startHeartbeatMonitor();

    let stdoutBuffer = "";
    activeChild.stdout.setEncoding("utf8");
    activeChild.stderr.setEncoding("utf8");
    activeChild.stdout.on("data", (chunk: string) => {
      if (child !== activeChild) return;
      stdoutBuffer += chunk;
      let newlineIndex = stdoutBuffer.indexOf("\n");
      while (newlineIndex !== -1) {
        const line = stdoutBuffer.slice(0, newlineIndex).trim();
        stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
        if (line) {
          try {
            handleEvent(JSON.parse(line));
          } catch {
            logger.warn("[desktop-playback-wallpaper] native helper returned invalid JSON", {
              line,
            });
          }
        }
        newlineIndex = stdoutBuffer.indexOf("\n");
      }
    });
    activeChild.stderr.on("data", (chunk: string) => {
      const message = chunk.trim();
      if (message) logger.warn("[desktop-playback-wallpaper] native helper stderr", { message });
    });
    activeChild.on("error", (error) => {
      if (child !== activeChild) return;
      child = null;
      attached = false;
      stopHeartbeatMonitor();
      pendingAttach?.reject(error);
      pendingAttach = null;
      reportLost(error.message);
    });
    activeChild.on("exit", (code) => {
      if (child !== activeChild) return;
      const wasAttached = attached;
      child = null;
      attached = false;
      stopHeartbeatMonitor();
      pendingAttach?.reject(new Error(`Native wallpaper helper exited with code ${code}.`));
      pendingAttach = null;
      pendingDetach?.(intentionalShutdown);
      pendingDetach = null;
      if (wasAttached) reportLost(`Native wallpaper helper exited with code ${code}.`);
    });

    return new Promise<NativeWallpaperAttachment>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (pendingAttach?.reject !== rejectAttach) return;
        pendingAttach = null;
        stopChild();
        reject(new Error("Native wallpaper helper did not attach before the timeout."));
      }, ATTACH_TIMEOUT_MS);
      const cleanup = () => {
        clearTimeout(timeout);
        signal.removeEventListener("abort", onAbort);
      };
      const resolveAttach = (attachment: NativeWallpaperAttachment) => {
        cleanup();
        resolve(attachment);
      };
      const rejectAttach = (error: Error) => {
        cleanup();
        reject(error);
      };
      const onAbort = () => {
        if (pendingAttach?.reject !== rejectAttach) return;
        pendingAttach = null;
        intentionalShutdown = true;
        stopChild();
        rejectAttach(createAbortError());
      };
      pendingAttach = { reject: rejectAttach, resolve: resolveAttach };
      signal.addEventListener("abort", onAbort, { once: true });
    });
  };

  const detach = async (signal?: AbortSignal) => {
    const activeChild = child;
    if (!activeChild) {
      attached = false;
      return true;
    }
    intentionalShutdown = true;
    if (signal?.aborted) {
      stopChild();
      throw createAbortError();
    }

    const detached = await new Promise<boolean>((resolve) => {
      const timeout = setTimeout(() => {
        if (pendingDetach !== finish) return;
        pendingDetach = null;
        finish(false);
      }, DETACH_TIMEOUT_MS);
      const onAbort = () => finish(false);
      const finish = (result: boolean) => {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", onAbort);
        resolve(result);
      };
      pendingDetach = finish;
      signal?.addEventListener("abort", onAbort, { once: true });
      try {
        activeChild.stdin.write("detach\n");
      } catch {
        finish(false);
      }
    });
    stopChild();
    if (signal?.aborted) throw createAbortError();
    return detached;
  };

  return {
    attach,
    detach,
    async dispose() {
      await detach().catch(() => undefined);
    },
    isAttached: () => attached,
  };
}

export function resolveNativeWallpaperHelperPath() {
  const override = process.env.SCOPIFY_WALLPAPER_HELPER_PATH?.trim();
  if (override) return override;
  if (app.isPackaged) return join(process.resourcesPath, "scopify-wallpaper-helper.exe");
  return join(
    app.getAppPath(),
    "native",
    "wallpaper-helper",
    "target",
    "release",
    "scopify-wallpaper-helper.exe",
  );
}

function readNativeWindowHandle(handle: Buffer) {
  return handle.byteLength >= 8 ? handle.readBigUInt64LE(0) : BigInt(handle.readUInt32LE(0));
}

function isEventKind(value: unknown, event: string) {
  return Boolean(value && typeof value === "object" && "event" in value && value.event === event);
}

function createAbortError() {
  const error = new Error("Native wallpaper operation was cancelled.");
  error.name = "AbortError";
  return error;
}
