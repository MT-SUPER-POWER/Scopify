import type { InboxNotification, NotificationLocale } from "@scopify/desktop-contract";
import { notificationCopy, notificationTitle } from "./copy";
import { object } from "./preferences";
import { readForwardContent } from "./socialForward";

export function decodeSocial(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return object(value);
  try {
    return object(JSON.parse(value));
  } catch {
    return {};
  }
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 2000) : "";
}

const actions = {
  "zh-CN": {
    private: "发来私信",
    comments: "评论了你",
    reply: "回复了你的评论",
    mentions: "提到了你",
    notices: "发来通知",
    likedComment: "赞了你的评论",
    likedEvent: "赞了你的动态",
    quote: "原文",
  },
  "zh-TW": {
    private: "傳來私訊",
    comments: "評論了你",
    reply: "回覆了你的評論",
    mentions: "提到了你",
    notices: "傳來通知",
    likedComment: "讚了你的評論",
    likedEvent: "讚了你的動態",
    quote: "原文",
  },
  "en-US": {
    private: "sent you a message",
    comments: "commented on your content",
    reply: "replied to your comment",
    mentions: "mentioned you",
    notices: "sent a notification",
    likedComment: "liked your comment",
    likedEvent: "liked your post",
    quote: "Original",
  },
};

/** Keep the actor, action and referenced text separate from the inbox's read state. */
export function socialPresentation(
  source: "private" | "comments" | "mentions" | "notices",
  row: Record<string, unknown>,
  payload: Record<string, unknown>,
  user: Record<string, unknown>,
  locale: NotificationLocale,
): Pick<InboxNotification, "title" | "body" | "avatarUrl" | "details" | "social"> {
  const copy = actions[locale];
  const forwarded = source === "mentions" ? readForwardContent(row) : null;
  const actor = text(user.nickname);
  const comment = decodeSocial(payload.comment);
  const event = decodeSocial(payload.event);
  const eventContent = decodeSocial(event.json);
  const resource = decodeSocial(row.resource ?? payload.resource ?? comment.resource);
  const resourceContent = decodeSocial(resource.json);
  const replied = object(Array.isArray(row.beReplied) ? row.beReplied[0] : row.beReplied);
  let action: string = copy[source];
  let body = text(row.content) || text(payload.msg) || text(payload.content) || text(row.comment);
  let quote = "";
  let quoteAuthor = "";
  if (source === "comments") {
    quote = text(row.beRepliedContent) || text(replied.content);
    quoteAuthor = text(object(replied.user).nickname);
    if (quote) action = copy.reply;
  } else if (source === "notices") {
    // These notice payloads reference the liked comment or post, not a new reply.
    if (text(comment.content)) {
      action = copy.likedComment;
      quote = text(comment.content);
      quoteAuthor = text(object(comment.user).nickname);
    } else if (text(eventContent.msg)) {
      action = copy.likedEvent;
      quote = text(eventContent.msg);
    }
  } else if (source === "mentions") {
    body ||= text(comment.content) || text(eventContent.msg) || forwarded?.body || "";
    quote =
      text(resourceContent.msg) ||
      text(resourceContent.content) ||
      text(resource.content) ||
      forwarded?.quote ||
      "";
    quoteAuthor = text(object(resource.user).nickname);
  }
  const resourceTitle =
    forwarded?.resource ||
    text(resource.name) ||
    text(resourceContent.name) ||
    text(object(resourceContent.song).name) ||
    "";
  body ||= quote || notificationCopy(locale).message;
  return {
    title: actor ? `${actor} · ${action}` : notificationTitle(source, locale),
    body,
    avatarUrl: text(user.avatarUrl) || undefined,
    social: {
      actor,
      action,
      quote: quote || undefined,
      quoteAuthor: quoteAuthor || undefined,
      resource: resourceTitle || undefined,
    },
    details: [body, quote ? `${quoteAuthor || copy.quote}：${quote}` : "", resourceTitle].filter(
      Boolean,
    ),
  };
}
