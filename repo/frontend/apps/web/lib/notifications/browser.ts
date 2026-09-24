import { createNotificationEngine } from "@scopify/notification-core";
import type { NotificationClient } from "@scopify/desktop-contract";

/** Lazy initialization avoids touching storage or starting timers during SSR. */
export function createBrowserNotifications(): NotificationClient {
  let engine: ReturnType<typeof createNotificationEngine> | null = null;
  function getEngine() {
    if (engine) return engine;
    engine = createNotificationEngine({
      desktopSupported: false,
      load: async (account) =>
        JSON.parse(localStorage.getItem(`scopify-notifications:${account}`) ?? "null"),
      save: async (account, state) => {
        localStorage.setItem(`scopify-notifications:${account}`, JSON.stringify(state));
      },
      async request(path, params, signal) {
        const { requestNotificationSource } = await import("@/lib/api/notifications");
        return requestNotificationSource({
          path,
          params,
          signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
        });
      },
      deliver: async () => false,
      exclusive: (operation) =>
        navigator.locks ? navigator.locks.request("scopify-notifications", operation) : operation(),
    });
    const tick = () => {
      if (navigator.onLine) void engine?.refresh(false);
    };
    window.setInterval(tick, 60_000);
    window.addEventListener("online", tick);
    window.addEventListener("focus", tick);
    return engine;
  }
  return {
    configure: async (session) => {
      const client = getEngine();
      const result = await client.configure(session);
      void client.refresh(false);
      return result;
    },
    getSnapshot: () => getEngine().getSnapshot(),
    refresh: () => getEngine().refresh(),
    markRead: (ids) => getEngine().markRead(ids),
    updatePreferences: (preferences) => getEngine().updatePreferences(preferences),
    testDesktop: async () => false,
    onChanged: (callback) => {
      const client = getEngine();
      const unsubscribe = client.onChanged(callback);
      const onStorage = (event: StorageEvent) => {
        if (event.key?.startsWith("scopify-notifications:"))
          void client
            .getSnapshot()
            .then(callback)
            .catch(() => undefined);
      };
      window.addEventListener("storage", onStorage);
      return () => {
        unsubscribe();
        window.removeEventListener("storage", onStorage);
      };
    },
  };
}
