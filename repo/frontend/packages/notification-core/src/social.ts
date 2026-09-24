import type { NotificationLocale, NotificationSource } from "@scopify/desktop-contract";
import { decodeSocial, socialPresentation } from "./socialPresentation";
import { object } from "./preferences";
import { socialTarget } from "./socialTarget";
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
  const savedIds = new Set(state.items.map((item) => item.id));
  let head = cursor?.head ?? previous ?? 0;
  let oldest = Number.POSITIVE_INFINITY;
  let reachedKnown = false;
  for (const value of rawList) {
    const row = object(value);
    const payload = decodeSocial(
      source === "private" ? row.lastMsg : source === "notices" ? row.notice : row.json,
    );
    const user = object(row.fromUser ?? row.user ?? payload.user);
    const at = timestamp(row.lastMsgTime ?? row.time ?? payload.time);
    if (!at) continue;
    head = Math.max(head, at);
    oldest = Math.min(oldest, at);
    const sourceId = source === "private" ? user.userId : (row.id ?? row.commentId ?? row.noticeId);
    // Unknown identifiers are not guessed from text; they cannot be deduplicated reliably.
    if (sourceId === undefined || sourceId === null) continue;
    const id = `${source}:${sourceId}:${at}`;
    if (previous !== undefined && at < previous) {
      reachedKnown = true;
      // Refresh presentation metadata for saved summaries without adding historical notifications.
      if (!savedIds.has(id)) continue;
    }
    const sentBySelf =
      String(payload.fromUserId ?? object(payload.fromUser).userId ?? "") === accountId;
    items.push({
      id,
      source: source as NotificationSource,
      category: source === "private" ? "messages" : "interactions",
      ...socialPresentation(source, row, payload, user, locale),
      target: socialTarget(source, row, payload, user),
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
