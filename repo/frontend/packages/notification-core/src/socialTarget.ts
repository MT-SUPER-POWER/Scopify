import type {
  NotificationCommentResourceKind,
  NotificationSocialTarget,
} from "@scopify/desktop-contract";
import { object } from "./preferences";
import { decodeSocial } from "./socialPresentation";

function identifier(value: unknown): string {
  const result = typeof value === "number" || typeof value === "string" ? String(value) : "";
  return /^\d+$/.test(result) ? result : "";
}

function positiveIdentifier(value: unknown): string {
  const result = identifier(value);
  return result && result !== "0" ? result : "";
}

const COMMENT_THREAD_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  resource: NotificationCommentResourceKind;
}> = [
  { pattern: /^R_SO_4_(\d+)$/, resource: "song" },
  { pattern: /^R_MV_5_(\d+)$/, resource: "mv" },
  { pattern: /^A_PL_0_(\d+)$/, resource: "playlist" },
  { pattern: /^R_AL_3_(\d+)$/, resource: "album" },
  { pattern: /^A_DJ_1_(\d+)$/, resource: "voice" },
  { pattern: /^A_DR_14_(\d+)$/, resource: "voice-list" },
];

const COMMENT_RESOURCE_TYPE_MAP: Record<string, NotificationCommentResourceKind> = {
  "0": "song",
  "1": "mv",
  "2": "playlist",
  "3": "album",
  "4": "voice",
  "7": "voice-list",
};

function parseCommentThreadId(
  value: unknown,
): { resource: NotificationCommentResourceKind; resourceId: string } | null {
  if (typeof value !== "string") return null;
  for (const { pattern, resource } of COMMENT_THREAD_PATTERNS) {
    const match = pattern.exec(value);
    if (match) return { resource, resourceId: match[1] };
  }
  return null;
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
  const comment = decodeSocial(payload.comment);
  const event = decodeSocial(payload.event);
  const resource = decodeSocial(row.resource ?? payload.resource ?? comment.resource);
  const resourceJson = decodeSocial(
    row.resourceJson ?? payload.resourceJson ?? comment.resourceJson ?? resource.json,
  );
  const info = object(event.info);
  const replied = object(Array.isArray(row.beReplied) ? row.beReplied[0] : row.beReplied);
  const commentId = positiveIdentifier(row.commentId ?? comment.commentId);
  const rawParentId = positiveIdentifier(
    row.parentCommentId ??
      comment.parentCommentId ??
      row.beRepliedCommentId ??
      replied.beRepliedCommentId,
  );
  const parentCommentId = rawParentId && rawParentId !== commentId ? rawParentId : "";
  const commentMeta = {
    ...(commentId ? { commentId } : {}),
    ...(parentCommentId ? { parentCommentId } : {}),
  };

  for (const value of [
    row.threadId,
    payload.threadId,
    comment.threadId,
    event.threadId,
    info.threadId,
    object(info.commentThread).id,
    resource.threadId,
    object(resource.info).threadId,
    object(object(resource.info).commentThread).id,
    resourceJson.threadId,
    object(resourceJson.info).threadId,
  ]) {
    const eventMatch = typeof value === "string" ? /^A_EV_2_(\d+)_(\d+)$/.exec(value) : null;
    if (eventMatch) {
      return {
        kind: "event",
        eventId: eventMatch[1],
        userId: eventMatch[2],
        threadId: String(value),
      };
    }
    const commentTarget = parseCommentThreadId(value);
    if (commentTarget) {
      return {
        kind: "comment",
        resource: commentTarget.resource,
        resourceId: commentTarget.resourceId,
        ...commentMeta,
      };
    }
  }

  const resourceTypeRaw =
    row.resourceType ?? payload.resourceType ?? comment.resourceType ?? resource.resourceType;
  const resourceKind =
    resourceTypeRaw !== undefined && resourceTypeRaw !== null
      ? COMMENT_RESOURCE_TYPE_MAP[String(resourceTypeRaw)]
      : undefined;
  const resourceId = positiveIdentifier(
    row.resourceId ??
      payload.resourceId ??
      comment.resourceId ??
      resourceJson.id ??
      resource.id ??
      object(resourceJson.song).id,
  );
  if (resourceKind && resourceId) {
    return {
      kind: "comment",
      resource: resourceKind,
      resourceId,
      ...commentMeta,
    };
  }

  const eventId = identifier(event.id),
    authorId = identifier(object(event.user).userId);
  if (eventId && authorId) return { kind: "event", eventId, userId: authorId };
  return undefined;
}
