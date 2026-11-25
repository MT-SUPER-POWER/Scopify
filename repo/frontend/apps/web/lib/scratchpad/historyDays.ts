import type { HistoryDayGroup, HistoryDayKind, LocalHistoryEntry } from "@/types/scratchpad/model";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function localDayStart(timestamp: number): number {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function groupPlaysByDay(
  entries: readonly LocalHistoryEntry[],
  now = Date.now(),
): HistoryDayGroup[] {
  const todayStart = localDayStart(now);
  const yesterdayStart = todayStart - MS_PER_DAY;
  const groups = new Map<number, HistoryDayGroup>();

  for (const entry of entries) {
    const dayStart = localDayStart(entry.playedAt);
    let group = groups.get(dayStart);
    if (!group) {
      const kind: HistoryDayKind =
        dayStart === todayStart ? "today" : dayStart === yesterdayStart ? "yesterday" : "earlier";
      group = { kind, start: dayStart, entries: [] };
      groups.set(dayStart, group);
    }
    group.entries.push(entry);
  }

  return [...groups.values()].sort((a, b) => b.start - a.start);
}
