import type { NotificationLocale, NotificationSource } from "@scopify/desktop-contract";
import { notificationCopy, notificationTitle } from "./copy";
import { object } from "./preferences";
import { timestamp } from "./reports";
import type {
  NotificationAccountState,
  NotificationEngineOptions,
  NotificationPollResult,
} from "./types";

const routes = {
  private: "/msg/private",
  comments: "/msg/comments",
  mentions: "/msg/forwards",
  notices: "/msg/notices",
} as const;
const lists = {
  private: "msgs",
  comments: "comments",
  mentions: "forwards",
  notices: "notices",
} as const;
function decoded(value: unknown) {
  if (typeof value !== "string") return object(value);
  try {
    return object(JSON.parse(value));
  } catch {
    return {};
  }
}
function text(value: unknown) {
  return typeof value === "string" ? value.slice(0, 2000) : "";
}

/** One incremental page per source and tick; continue backlog without advancing the committed watermark. */
export async function pollSocial(
  source: keyof typeof routes,
  accountId: string,
  locale: NotificationLocale,
  state: NotificationAccountState,
  request: NotificationEngineOptions["request"],
  signal: AbortSignal,
): Promise<NotificationPollResult> {
  const cursor = state.cursors[source];
  const params = cursor?.params ?? { limit: 100, uid: accountId };
  const response = object(await request(routes[source], params, signal));
  const rawList = response[lists[source]];
  if (response.code !== 200 || !Array.isArray(rawList))
    throw new Error("social-response-unrecognized");
  const previous = state.watermarks[source];
  const firstSync = previous === undefined;
  const items: NotificationPollResult["items"] = [];
  let head = cursor?.head ?? previous ?? 0;
  let oldest = Number.POSITIVE_INFINITY;
  let reachedKnown = false;
  for (const value of rawList) {
    const row = object(value);
    const payload = decoded(
      source === "private" ? row.lastMsg : source === "notices" ? row.notice : row.json,
    );
    const user = object(row.fromUser ?? row.user ?? payload.user);
    const at = timestamp(row.lastMsgTime ?? row.time ?? payload.time);
    if (!at) continue;
    head = Math.max(head, at);
    oldest = Math.min(oldest, at);
    if (previous !== undefined && at < previous) {
      reachedKnown = true;
      continue;
    }
    const sourceId = source === "private" ? user.userId : (row.id ?? row.commentId ?? row.noticeId);
    // Unknown identifiers are not guessed from text; they cannot be deduplicated reliably.
    if (sourceId === undefined || sourceId === null) continue;
    const body =
      text(payload.msg) ||
      text(payload.content) ||
      text(row.content) ||
      text(row.comment) ||
      notificationCopy(locale).message;
    const name = text(user.nickname);
    const sentBySelf =
      String(payload.fromUserId ?? object(payload.fromUser).userId ?? "") === accountId;
    items.push({
      id: `${source}:${sourceId}:${at}`,
      source: source as NotificationSource,
      category:
        source === "private" ? "messages" : source === "notices" ? "system" : "interactions",
      title: name
        ? `${name} · ${notificationTitle(source, locale)}`
        : notificationTitle(source, locale),
      body,
      details: [body],
      occurredAt: at,
      readAt:
        source === "private"
          ? Number(row.newMsgCount) > 0 && !sentBySelf
            ? null
            : Date.now()
          : firstSync
            ? Date.now()
            : null,
    });
  }
  // First sync establishes a recent baseline and never crawls old history to produce alerts.
  const more = response.more === true || response.hasMore === true || rawList.length === 100;
  if (!firstSync && more && !reachedKnown && rawList.length && Number.isFinite(oldest)) {
    const nextParams: Record<string, string | number> =
      source === "private" || source === "mentions"
        ? { limit: 100, uid: accountId, offset: Number(params.offset ?? 0) + 100 }
        : { limit: 100, uid: accountId, [source === "comments" ? "before" : "lasttime"]: oldest };
    if (JSON.stringify(nextParams) !== JSON.stringify(params))
      return { items, continuation: { params: nextParams, head } };
    throw new Error("social-cursor-stalled");
  }
  return { items, watermark: head || previous || Date.now() };
}
