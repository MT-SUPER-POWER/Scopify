import { ipcMain, type IpcMainInvokeEvent } from "electron";
import { normalizeNotificationPreferences, object } from "@scopify/notification-core";
import { coreLog } from "@main/utils/logger";
import type { createDesktopNotifications } from "@main/services/notifications";
import type { DesktopNotificationOptions } from "@/types/notifications";
import { isMainRenderer } from "./sender";

export function registerNotificationsIpc(
  service: ReturnType<typeof createDesktopNotifications>,
  options: DesktopNotificationOptions,
) {
  function authorize(event: IpcMainInvokeEvent) {
    if (
      !isMainRenderer(event, options.getMainWindow()) ||
      event.senderFrame !== event.sender.mainFrame
    )
      throw new Error("notification-sender-denied");
  }
  ipcMain.handle("notifications:configure", async (event, value: unknown) => {
    authorize(event);
    const input = object(value);
    if (
      input.accountId !== null &&
      (typeof input.accountId !== "string" || !/^\d{1,20}$/.test(input.accountId))
    )
      throw new Error("invalid-account");
    const locale = input.locale === "en-US" || input.locale === "zh-TW" ? input.locale : "zh-CN";
    const result = await service.configure({ accountId: input.accountId as string | null, locale });
    void service.refresh(false);
    return result;
  });
  ipcMain.handle("notifications:get", (event) => {
    authorize(event);
    return service.getSnapshot();
  });
  ipcMain.handle("notifications:refresh", (event) => {
    authorize(event);
    return service.refresh();
  });
  ipcMain.handle("notifications:read", (event, ids: unknown) => {
    authorize(event);
    if (
      !Array.isArray(ids) ||
      ids.length > 500 ||
      !ids.every((id) => typeof id === "string" && id.length < 200)
    )
      throw new Error("invalid-notification-ids");
    return service.markRead(ids);
  });
  ipcMain.handle("notifications:preferences", (event, preferences: unknown) => {
    authorize(event);
    return service.updatePreferences(normalizeNotificationPreferences(preferences));
  });
  ipcMain.handle("notifications:test", async (event) => {
    authorize(event);
    coreLog.info("[notifications:ipc] notifications:test invoked");
    const result = await service.testDesktop();
    coreLog.info("[notifications:ipc] notifications:test result", { result });
    return result;
  });
}
