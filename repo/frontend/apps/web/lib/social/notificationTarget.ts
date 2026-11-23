import type { NotificationSocialTarget } from "@scopify/desktop-contract";
import type { NotificationListItem } from "@/types/notifications/model";

export function socialNotificationHref(target?: NotificationSocialTarget): string | undefined {
  if (!target) return;
  if (target.kind === "comment") {
    if (!/^\d+$/.test(target.resourceId)) return;
    const params = new URLSearchParams(
      target.resource === "song"
        ? { songId: target.resourceId }
        : { resource: target.resource, id: target.resourceId },
    );
    if (target.commentId && /^\d+$/.test(target.commentId)) {
      params.set("commentId", target.commentId);
    }
    if (target.parentCommentId && /^\d+$/.test(target.parentCommentId)) {
      params.set("parentCommentId", target.parentCommentId);
    }
    return `/comment?${params}`;
  }
  if (!/^\d+$/.test(target.userId)) return;
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
  if (target.kind === "message")
    return (
      "/profile?" +
      new URLSearchParams({
        userId: target.userId,
        action: "message",
      })
    );
}

export function notificationActorProfileHref(
  item: Pick<NotificationListItem, "social" | "target">,
): string | undefined {
  const actorId =
    item.social?.actorId ??
    (item.target?.kind === "profile" || item.target?.kind === "message"
      ? item.target.userId
      : undefined);
  if (!actorId || !/^\d+$/.test(actorId)) return;
  return `/profile?${new URLSearchParams({ userId: actorId })}`;
}
