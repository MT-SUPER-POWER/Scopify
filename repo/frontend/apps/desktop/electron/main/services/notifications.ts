import { app, Notification, powerMonitor, session } from "electron";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { __iconNotificationPath } from "@main/constants";
import { createNotificationEngine, notificationCopy } from "@scopify/notification-core";
import type { DesktopNotificationOptions } from "@/types/notifications";
import type { NotificationSession } from "@scopify/desktop-contract";

let resetSession: (() => Promise<void>) | null = null;
export function clearNotificationSession() {
  return resetSession?.();
}

/** App lifetime service: hiding the renderer never pauses the scheduler. */
export function createDesktopNotifications(options: DesktopNotificationOptions) {
  const directory = join(app.getPath("userData"), "notifications");
  const live = new Set<Notification>();
  let activeAccount: string | null = null;
  const engine = createNotificationEngine({
    desktopSupported: Notification.isSupported(),
    async load(account) {
      try {
        return JSON.parse(await readFile(join(directory, `${account}.json`), "utf8"));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
        throw error;
      }
    },
    async save(account, state) {
      await mkdir(directory, { recursive: true });
      const file = join(directory, `${account}.json`);
      await writeFile(`${file}.tmp`, JSON.stringify(state), "utf8");
      await rename(`${file}.tmp`, file);
    },
    async request(path, params, signal) {
      const url = new URL(path, options.getBackendOrigin());
      for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
      url.searchParams.set("timestamp", String(Date.now()));
      url.searchParams.set("os", "pc");
      const response = await session.defaultSession.fetch(url.toString(), {
        credentials: "include",
        signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      });
      if (!response.ok) throw new Error(`notification-http-${response.status}`);
      return response.json();
    },
    async deliver(item, active, preferences) {
      const window = options.getMainWindow();
      if (!Notification.isSupported() || (item.id !== "test" && window?.isFocused())) return false;
      const body =
        preferences.preview || item.category === "reports"
          ? item.body
          : notificationCopy(active.locale).message;

      const notification = new Notification({
        title: item.title,
        body,
        icon: __iconNotificationPath,
        silent: !preferences.sound,
      });
      live.add(notification);
      notification.once("click", () => {
        if (activeAccount !== active.accountId) return;
        void options
          .showMainWindow()
          .then(() => engine.focus(active.accountId, item.id))
          .catch(() => undefined);
        live.delete(notification);
      });
      notification.once("close", () => live.delete(notification));
      notification.once("failed", () => live.delete(notification));
      notification.show();
      return true;
    },
  });
  const changed = engine.onChanged((snapshot) => {
    const window = options.getMainWindow();
    if (window && !window.isDestroyed()) window.webContents.send("notifications:changed", snapshot);
  });
  const tick = () => {
    void engine.refresh(false);
  };
  const timer = setInterval(tick, 60_000);
  timer.unref();
  powerMonitor.on("resume", tick);
  async function clearSession() {
    for (const notification of live) notification.close();
    live.clear();
    activeAccount = null;
    await engine.configure({ accountId: null, locale: "zh-CN" });
  }
  resetSession = clearSession;
  return {
    ...engine,
    configure(next: NotificationSession) {
      if (next.accountId !== activeAccount) {
        for (const notification of live) notification.close();
        live.clear();
      }
      activeAccount = next.accountId;
      return engine.configure(next);
    },
    clearSession,
    dispose() {
      resetSession = null;
      clearInterval(timer);
      powerMonitor.off("resume", tick);
      changed();
      engine.dispose();
      for (const notification of live) notification.close();
      live.clear();
    },
  };
}
