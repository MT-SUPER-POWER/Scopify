import type { NotificationSocialTarget } from "@scopify/desktop-contract";
import { object } from "./preferences";
import { decodeSocial } from "./socialPresentation";

function identifier(value: unknown): string {
  const result = typeof value === "number" || typeof value === "string" ? String(value) : "";
  return /^\d+$/.test(result) ? result : "";
}
/** Only route from explicit resource identifiers; notification IDs are not event IDs. */
export function socialTarget(
  source: "private" | "comments" | "mentions" | "notices",
  row: Record<string, unknown>,
  payload: Record<string, unknown>,
  actor: Record<string, unknown>,
): NotificationSocialTarget | undefined {
  const actorId = identifier(actor.userId);
  if (source === "private") return actorId ? { kind: "message", userId: actorId } : undefined;
  const event = decodeSocial(payload.event);
  const resource = decodeSocial(
    row.resource ?? payload.resource ?? object(payload.comment).resource,
  );
  const info = object(event.info);
  for (const value of [
    row.threadId,
    payload.threadId,
    event.threadId,
    info.threadId,
    object(info.commentThread).id,
    resource.threadId,
    object(resource.info).threadId,
    object(object(resource.info).commentThread).id,
  ]) {
    const match = typeof value === "string" ? /^A_EV_2_(\d+)_(\d+)$/.exec(value) : null;
    if (match)
      return { kind: "event", eventId: match[1], userId: match[2], threadId: String(value) };
  }
  const eventId = identifier(event.id),
    authorId = identifier(object(event.user).userId);
  if (eventId && authorId) return { kind: "event", eventId, userId: authorId };
  return actorId ? { kind: "profile", userId: actorId } : undefined;
}
