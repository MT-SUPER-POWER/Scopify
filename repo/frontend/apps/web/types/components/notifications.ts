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
