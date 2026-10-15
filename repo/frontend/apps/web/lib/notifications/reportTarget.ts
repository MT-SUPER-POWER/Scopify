import type { NotificationListItem } from "@/types/notifications";

const REPORT_PATH = "/recent/report";

/** 周报 / 年报通知直达对应周期的听歌报告页；日报没有独立周期，落到默认视图。 */
export function reportNotificationHref(item: Pick<NotificationListItem, "source">): string {
  if (item.source === "weekly") return `${REPORT_PATH}?period=week`;
  if (item.source === "yearly") return `${REPORT_PATH}?period=year`;
  return REPORT_PATH;
}
