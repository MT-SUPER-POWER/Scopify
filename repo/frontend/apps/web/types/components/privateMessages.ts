import type { NotificationSnapshot } from "@scopify/desktop-contract";
import type {
  MessageAttachment,
  MessagePeer,
  PrivateConversation,
  PrivateMessage,
} from "@/types/privateMessages";

export interface FriendsPanelProps {
  accountId: string | null;
  snapshot: NotificationSnapshot | null;
  peer: MessagePeer | null;
  unreadCount: number;
  openConversation(peer: MessagePeer): void;
  back(): void;
  setOpen(open: boolean): void;
  onReadAll(): void;
}

export interface ConversationRowProps {
  conversation: PrivateConversation;
  unread: boolean;
  onOpen(): void;
}

export interface PrivateConversationViewProps {
  accountId: string;
  peer: MessagePeer;
  onBack(): void;
}

export interface PrivateMessageBubbleProps {
  message: PrivateMessage;
}

export interface PrivateMessageCardProps {
  attachment: MessageAttachment;
}

export interface PrivateMessageComposerProps {
  value: string;
  sending: boolean;
  disabled: boolean;
  error: boolean;
  onChange(value: string): void;
  onSend(): void;
}
