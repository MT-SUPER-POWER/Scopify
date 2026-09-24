import type {
  InboxNotification,
  NotificationPreferences,
  NotificationSession,
  NotificationSnapshot,
  NotificationSource,
} from "@scopify/desktop-contract";
import { isNotificationQuiet, normalizeNotificationPreferences, object } from "./preferences";
import { notificationCopy } from "./copy";
import { parseReport, reportPeriod } from "./reports";
import { pollSocial } from "./social";
import { readNotificationState } from "./storage";
import type { NotificationAccountState, NotificationEngineOptions } from "./types";

export function createNotificationEngine(options: NotificationEngineOptions) {
  let session: NotificationSession = { accountId: null, locale: "zh-CN" };
  let state = readNotificationState(null);
  let generation = 0;
  let configured = false;
  let sessionPaused = false;
  let syncing = false;
  let errors: string[] = [];
  let focusId: string | null = null;
  let abort = new AbortController();
  let queue: Promise<unknown> = Promise.resolve();
  const listeners = new Set<(snapshot: NotificationSnapshot) => void>();
  const snapshot = (): NotificationSnapshot =>
    structuredClone({
      accountId: session.accountId,
      items: state.items,
      preferences: state.preferences,
      syncing,
      errors,
      lastCheckedAt: state.lastCheckedAt,
      desktopSupported: options.desktopSupported,
      focusId,
    });
  const emit = () => {
    const value = snapshot();
    for (const listener of listeners) listener(value);
  };
  function serial<T>(operation: () => Promise<T>): Promise<T> {
    const work = () => (options.exclusive ? options.exclusive(operation) : operation());
    const result = queue.then(work, work);
    queue = result.catch(() => undefined);
    return result;
  }
  async function save(accountId: string, value: NotificationAccountState) {
    await options.save(accountId, value);
  }
  async function change(update: (current: NotificationAccountState) => void) {
    const epoch = generation;
    const account = session.accountId ?? "guest";
    return serial(async () => {
      if (epoch !== generation) return snapshot();
      const current = readNotificationState(await options.load(account));
      update(current);
      await save(account, current);
      if (epoch === generation) {
        state = current;
        emit();
      }
      return snapshot();
    });
  }
  async function refresh(force = true): Promise<NotificationSnapshot> {
    if (syncing || !session.accountId || (!force && sessionPaused)) return snapshot();
    const epoch = generation;
    const active = { ...session };
    const accountId = active.accountId!;
    const signal = abort.signal;
    syncing = true;
    errors = [];
    emit();
    try {
      await serial(async () => {
        if (epoch !== generation) return;
        const current = readNotificationState(await options.load(accountId));
        const now = Date.now();
        if (!force && current.lastCheckedAt && now - current.lastCheckedAt < 60_000) {
          state = current;
          return;
        }
        const identity = object(await options.request("/user/account", {}, signal));
        const actualId = object(identity.account).id ?? object(identity.profile).userId;
        if (identity.code !== 200 || String(actualId) !== accountId) throw new Error("session");
        sessionPaused = false;
        const incoming: InboxNotification[] = [];
        const deliverable: InboxNotification[] = [];
        const failures: string[] = [];
        await Promise.all(
          (Object.keys(current.preferences.subscriptions) as NotificationSource[]).map(
            async (source) => {
              if (
                !current.preferences.subscriptions[source] ||
                (!force && (current.nextChecks[source] ?? 0) > now)
              )
                return;
              try {
                if (source === "daily" || source === "weekly" || source === "yearly") {
                  const clock = new Date(now);
                  const localTime = `${String(clock.getHours()).padStart(2, "0")}:${String(clock.getMinutes()).padStart(2, "0")}`;
                  if (localTime < (source === "daily" ? current.preferences.dailyTime : "10:00"))
                    return;
                  const period = reportPeriod(source, now);
                  // Keep annual checks bounded to January; manual refresh can still retry later.
                  if (
                    source === "yearly" &&
                    !force &&
                    new Date(now + 28_800_000).getUTCMonth() !== 0
                  )
                    return;
                  const id = `report:${source}:${period.key}`;
                  if (current.deliveredReports.includes(id)) return;
                  const result = await options.request(
                    source === "daily" ? "/listen/data/today/song" : "/listen/data/report",
                    source === "daily"
                      ? {}
                      : { type: source === "weekly" ? "week" : "year", endTime: period.endTime },
                    signal,
                  );
                  const item = parseReport(source, result, period, active.locale, now);
                  if (item) {
                    incoming.push(item);
                    deliverable.push(item);
                    current.deliveredReports.push(item.id);
                  }
                  current.nextChecks[source] = now + 30 * 60_000;
                } else {
                  const initial = current.watermarks[source] === undefined;
                  const result = await pollSocial(
                    source,
                    accountId,
                    active.locale,
                    current,
                    options.request,
                    signal,
                  );
                  incoming.push(...result.items);
                  if (!initial)
                    deliverable.push(
                      ...result.items.filter(
                        (item) => item.readAt === null && now - item.occurredAt < 10 * 60_000,
                      ),
                    );
                  if (result.continuation) current.cursors[source] = result.continuation;
                  else {
                    delete current.cursors[source];
                    current.watermarks[source] = result.watermark;
                  }
                  current.nextChecks[source] = now + 2 * 60_000;
                }
              } catch {
                failures.push(source);
                current.nextChecks[source] = now + 5 * 60_000;
              }
            },
          ),
        );
        if (epoch !== generation || signal.aborted) return;
        const known = new Map(current.items.map((item) => [item.id, item]));
        const newIds = new Set<string>();
        for (const item of incoming) {
          const saved = known.get(item.id);
          if (!saved) {
            known.set(item.id, item);
            newIds.add(item.id);
          } else {
            known.set(item.id, {
              ...saved,
              ...item,
              avatarUrl: item.avatarUrl ?? saved.avatarUrl,
              readAt: saved.readAt,
            });
          }
        }
        const conversations = new Set<string>();
        current.items = [...known.values()]
          .sort((a, b) => b.occurredAt - a.occurredAt)
          .filter((item) => {
            if (item.source !== "private") return true;
            const conversation = item.id.split(":").slice(0, 2).join(":");
            if (conversations.has(conversation)) return false;
            conversations.add(conversation);
            return true;
          })
          .slice(0, 500);
        current.lastCheckedAt = now;
        // Commit before OS delivery: unknown delivery after a crash must not be replayed.
        await save(accountId, current);
        if (epoch !== generation) return;
        state = current;
        errors = failures;
        emit();
        if (!current.preferences.desktop || isNotificationQuiet(current.preferences)) return;
        const fresh = deliverable
          .filter((item) => newIds.has(item.id))
          .sort((a, b) => b.occurredAt - a.occurredAt);
        // At most one OS alert per source per sync. All events remain in the inbox.
        const deliveredSources = new Set<NotificationSource>();
        for (const item of fresh) {
          if (epoch !== generation || signal.aborted) break;
          if (deliveredSources.has(item.source)) continue;
          deliveredSources.add(item.source);
          try {
            await options.deliver(item, active, current.preferences);
          } catch {
            errors = [...errors, "delivery"];
          }
        }
      });
    } catch (error) {
      if (epoch === generation) {
        sessionPaused = error instanceof Error && error.message === "session";
        errors = [sessionPaused ? "session" : "sync"];
      }
    } finally {
      if (epoch === generation) {
        syncing = false;
        emit();
      }
    }
    return snapshot();
  }
  return {
    async configure(next: NotificationSession) {
      sessionPaused = false;
      if (configured && next.accountId === session.accountId) {
        session = { ...next };
        return snapshot();
      }
      configured = true;
      const epoch = ++generation;
      abort.abort();
      abort = new AbortController();
      session = { ...next };
      state = readNotificationState(null);
      errors = [];
      syncing = false;
      focusId = null;
      emit();
      await serial(async () => {
        const loaded = readNotificationState(await options.load(next.accountId ?? "guest"));
        if (epoch === generation) {
          state = loaded;
          emit();
        }
      });
      return snapshot();
    },
    getSnapshot: async () =>
      serial(async () => {
        const epoch = generation;
        const loaded = readNotificationState(await options.load(session.accountId ?? "guest"));
        if (epoch === generation) state = loaded;
        return snapshot();
      }),
    refresh,
    markRead: (ids: string[]) =>
      change((current) => {
        const selected = new Set(ids);
        for (const item of current.items) if (selected.has(item.id)) item.readAt ??= Date.now();
        if (focusId && selected.has(focusId)) focusId = null;
      }),
    updatePreferences: (preferences: NotificationPreferences) =>
      change((current) => {
        current.preferences = normalizeNotificationPreferences(preferences);
      }),
    async testDesktop() {
      if (
        !options.desktopSupported ||
        !state.preferences.desktop ||
        isNotificationQuiet(state.preferences)
      )
        return false;
      const copy = notificationCopy(session.locale);
      return options.deliver(
        {
          id: "test",
          source: "notices",
          category: "system",
          title: copy.test,
          body: copy.testBody,
          details: [],
          occurredAt: Date.now(),
          readAt: null,
        },
        session,
        state.preferences,
      );
    },
    onChanged(callback: (value: NotificationSnapshot) => void) {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    focus(accountId: string | null, id: string) {
      if (session.accountId === accountId && state.items.some((item) => item.id === id)) {
        focusId = id;
        emit();
      }
    },
    dispose() {
      ++generation;
      abort.abort();
      listeners.clear();
    },
  };
}
