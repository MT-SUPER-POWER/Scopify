export type NotificationCategory = "messages" | "interactions" | "reports" | "system";
export type NotificationSource =
  "private" | "comments" | "mentions" | "notices" | "daily" | "weekly" | "yearly";
export type NotificationLocale = "zh-CN" | "zh-TW" | "en-US";

export interface NotificationSocialContext {
  actor: string;
  action: string;
  quote?: string;
  quoteAuthor?: string;
  resource?: string;
}

export type NotificationSocialTarget =
  | { kind: "profile" | "message"; userId: string }
  | { kind: "event"; eventId: string; userId: string; threadId?: string };

export interface InboxNotification {
  id: string;
  source: NotificationSource;
  category: NotificationCategory;
  title: string;
  body: string;
  avatarUrl?: string;
  social?: NotificationSocialContext;
  target?: NotificationSocialTarget;
  occurredAt: number;
  readAt: number | null;
  /** Keep summaries readable even when the referenced resource is unavailable. */
  details: string[];
  periodKey?: string;
}

export interface NotificationPreferences {
  subscriptions: Record<NotificationSource, boolean>;
  updates: boolean;
  desktop: boolean;
  sound: boolean;
  preview: boolean;
  doNotDisturb: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
  dailyTime: string;
}

export interface NotificationSnapshot {
  accountId: string | null;
  items: InboxNotification[];
  preferences: NotificationPreferences;
  syncing: boolean;
  lastCheckedAt: number | null;
  errors: string[];
  desktopSupported: boolean;
  focusId: string | null;
}

export interface NotificationSession {
  accountId: string | null;
  locale: NotificationLocale;
}

export interface NotificationClient {
  configure(session: NotificationSession): Promise<NotificationSnapshot>;
  getSnapshot(): Promise<NotificationSnapshot>;
  refresh(): Promise<NotificationSnapshot>;
  markRead(ids: string[]): Promise<NotificationSnapshot>;
  updatePreferences(preferences: NotificationPreferences): Promise<NotificationSnapshot>;
  testDesktop(): Promise<boolean>;
  onChanged(callback: (snapshot: NotificationSnapshot) => void): () => void;
}
