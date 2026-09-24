import type {
  InboxNotification,
  NotificationSnapshot,
  NotificationSource,
} from "@scopify/desktop-contract";

export type NotificationFilter = "all" | InboxNotification["category"];
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
