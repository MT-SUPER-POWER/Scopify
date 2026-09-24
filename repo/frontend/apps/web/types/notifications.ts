import type {
  InboxNotification,
  NotificationPreferences,
  NotificationSnapshot,
  NotificationSource,
} from "@scopify/desktop-contract";

export type NotificationFilter =
  "all" | "private" | "comments" | "mentions" | "notices" | "reports" | "updates";
export interface NotificationListItem extends Omit<InboxNotification, "source"> {
  source: NotificationSource | "updates";
  progress?: number;
  actionLabel?: string;
}
export interface NotificationUiState {
  accountId: string | null;
  snapshot: NotificationSnapshot | null;
  localError: boolean;
  pending: boolean;
  selectAccount(accountId: string | null): void;
  accept(snapshot: NotificationSnapshot): void;
}

export interface NotificationPreferencesDraft {
  accountId: string | null;
  preferences: NotificationPreferences;
}
