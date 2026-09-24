import type {
  InboxNotification,
  NotificationPreferences,
  NotificationSession,
  NotificationSource,
} from "@scopify/desktop-contract";

export interface NotificationAccountState {
  version: 1;
  items: InboxNotification[];
  preferences: NotificationPreferences;
  /** Independent from retained inbox history. */
  deliveredReports: string[];
  watermarks: Partial<Record<NotificationSource, number>>;
  nextChecks: Partial<Record<NotificationSource, number>>;
  cursors: Partial<
    Record<NotificationSource, { params: Record<string, string | number>; head: number }>
  >;
  lastCheckedAt: number | null;
}

export interface NotificationEngineOptions {
  load(accountId: string): Promise<unknown>;
  save(accountId: string, state: NotificationAccountState): Promise<void>;
  request(
    path: string,
    params: Record<string, string | number>,
    signal: AbortSignal,
  ): Promise<unknown>;
  deliver(
    item: InboxNotification,
    session: NotificationSession,
    preferences: NotificationPreferences,
  ): Promise<boolean>;
  desktopSupported: boolean;
  /** Browser uses a cross-tab lock; Main serializes in one process. */
  exclusive?<T>(operation: () => Promise<T>): Promise<T>;
}

export interface NotificationPollResult {
  items: InboxNotification[];
  watermark?: number;
  continuation?: { params: Record<string, string | number>; head: number };
}

export interface ReportPeriod {
  key: string;
  endTime: number;
  startTime: number;
}
