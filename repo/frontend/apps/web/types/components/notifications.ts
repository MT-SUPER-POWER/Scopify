import type { NotificationFilter, NotificationListItem } from "@/types/notifications";
import type { NotificationPreferences } from "@scopify/desktop-contract";

export interface NotificationPreferenceSectionProps {
  preferences: NotificationPreferences;
  disabled: boolean;
  onChange(patch: Partial<NotificationPreferences>): void;
}

export interface NotificationDeliverySettingsProps extends NotificationPreferenceSectionProps {
  desktopSupported: boolean;
}

export interface NotificationRowProps {
  item: NotificationListItem;
  expanded: boolean;
  onExpand(): void;
  onRead(): void;
  onAction?(): void;
}

export type NotificationAvatarProps = Pick<NotificationRowProps, "item">;
export type NotificationPreviewProps = Pick<NotificationRowProps, "item">;

export interface NotificationPanelProps {
  items: NotificationListItem[];
  filter: NotificationFilter;
  unreadOnly: boolean;
  unreadCount: number;
  expandedId: string | null;
  onFilter(filter: NotificationFilter): void;
  onUnreadOnly(value: boolean): void;
  onExpand(item: NotificationListItem): void;
  onRead(item: NotificationListItem): void;
  onReadAll(): void;
  onSettings(): void;
  onUpdateAction(): void;
}

export type NotificationToolbarProps = Pick<
  NotificationPanelProps,
  "filter" | "unreadOnly" | "unreadCount" | "onFilter" | "onUnreadOnly" | "onReadAll" | "onSettings"
>;

export type NotificationSummaryProps = Pick<NotificationRowProps, "item" | "onAction"> & {
  expanded: boolean;
  detailId: string;
};

export interface NotificationTestButtonProps {
  disabled: boolean;
  hasChanges: boolean;
  testing: boolean;
  result: "sent" | "blocked" | null;
  onTest(): void;
}
