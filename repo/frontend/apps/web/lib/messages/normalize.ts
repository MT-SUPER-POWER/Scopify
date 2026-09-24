import type { InboxNotification } from "@scopify/desktop-contract";
import type {
  PrivateMessageUser,
  RawPrivateConversation,
  RawPrivateMessage,
} from "@/types/api/privateMessages";
import type { MessagePeer, PrivateConversation, PrivateMessage } from "@/types/privateMessages";
import { messageImage, parsePrivateContent } from "./content";

export function messagePeer(user: PrivateMessageUser | undefined): MessagePeer | null {
  if (!user?.userId) return null;
  return {
    id: String(user.userId),
    name: user.nickname ?? "",
    avatarUrl: messageImage(user.avatarUrl),
  };
}

export function privateNotificationPeer(item: InboxNotification): MessagePeer | null {
  if (item.source !== "private") return null;
  // Existing inbox IDs encode the peer ID as private:<userId>:<time>.
  const id = /^private:(\d+):/.exec(item.id)?.[1];
  return id
    ? { id, name: item.social?.actor ?? item.title.split(" · ")[0], avatarUrl: item.avatarUrl }
    : null;
}

export function normalizeConversation(
  row: RawPrivateConversation,
  accountId: string,
): PrivateConversation | null {
  const from = messagePeer(row.fromUser);
  const peer = from?.id === accountId ? messagePeer(row.toUser) : from;
  if (!peer) return null;
  const content = parsePrivateContent(row.lastMsg);
  return {
    ...peer,
    preview: content.text || content.attachment?.title || "",
    time: row.lastMsgTime ?? 0,
    unreadCount: row.newMsgCount ?? 0,
  };
}

export function normalizeMessage(
  row: RawPrivateMessage,
  accountId: string,
  peer: MessagePeer,
): PrivateMessage {
  const sender = messagePeer(row.fromUser) ?? peer;
  const time = row.time ?? 0;
  return {
    ...parsePrivateContent(row.msg),
    id: String(row.id ?? `${sender.id}:${time}:${JSON.stringify(row.msg)}`),
    time,
    sender,
    own: sender.id === accountId,
  };
}

export function conversationUnread(conversation: PrivateConversation, items: InboxNotification[]) {
  const latest = items
    .filter((item) => privateNotificationPeer(item)?.id === conversation.id)
    .sort((a, b) => b.occurredAt - a.occurredAt)[0];
  return latest && latest.occurredAt >= conversation.time
    ? latest.readAt === null
    : conversation.unreadCount > 0;
}
