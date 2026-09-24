export interface PrivateMessageUser {
  userId: string | number;
  nickname?: string;
  avatarUrl?: string;
}

export interface RawPrivateConversation {
  fromUser?: PrivateMessageUser;
  toUser?: PrivateMessageUser;
  lastMsg?: unknown;
  lastMsgTime?: number;
  newMsgCount?: number;
}

export interface RawPrivateMessage {
  id?: string | number;
  time?: number;
  msg?: unknown;
  fromUser?: PrivateMessageUser;
  toUser?: PrivateMessageUser;
}

export interface PrivateConversationResponse {
  code: number;
  msgs?: RawPrivateConversation[];
  more?: boolean;
  hasMore?: boolean;
}

export interface PrivateHistoryResponse {
  code: number;
  msgs?: RawPrivateMessage[];
  more?: boolean;
  hasMore?: boolean;
}

export interface PrivateSendResponse extends PrivateHistoryResponse {
  newMsgs?: RawPrivateMessage[];
}
