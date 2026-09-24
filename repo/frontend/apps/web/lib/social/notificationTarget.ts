import type { NotificationSocialTarget } from "@scopify/desktop-contract";

export function socialNotificationHref(target?: NotificationSocialTarget): string | undefined {
  if (!target || !/^\d+$/.test(target.userId)) return;
  if (target.kind === "event") {
    if (!/^\d+$/.test(target.eventId)) return;
    return (
      "/social/event?" +
      new URLSearchParams({
        id: target.eventId,
        uid: target.userId,
        ...(target.threadId ? { threadId: target.threadId } : {}),
      })
    );
  }
  if (target.kind === "message" || target.kind === "profile")
    return (
      "/profile?" +
      new URLSearchParams({
        userId: target.userId,
        ...(target.kind === "message" ? { action: "message" } : {}),
      })
    );
}
