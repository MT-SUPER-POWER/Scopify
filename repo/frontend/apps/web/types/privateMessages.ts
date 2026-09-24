export interface MessagePeer {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface MessageAttachment {
  kind: "song" | "album" | "playlist" | "image";
  title: string;
  subtitle?: string;
  imageUrl?: string;
  href?: string;
}

export interface PrivateMessageContent {
  text: string;
  attachment?: MessageAttachment;
}

export interface PrivateConversation extends MessagePeer {
  preview: string;
  time: number;
  unreadCount: number;
}

export interface PrivateMessage extends PrivateMessageContent {
  id: string;
  time: number;
  sender: MessagePeer;
  own: boolean;
}

export interface FriendsPanelState {
  ownerId: string | null;
  drafts: Record<string, string>;
  selectAccount(accountId: string | null): void;
  setDraft(peerId: string, text: string): void;
  open: boolean;
  peer: MessagePeer | null;
  setOpen(open: boolean): void;
  openConversation(peer: MessagePeer): void;
  back(): void;
  reset(): void;
}

export interface ConversationScrollPosition {
  height: number;
  top: number;
}
