import type { TFunction } from "i18next";
import type { MusicProvider } from "@scopify/music-domain/identity";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import type { PlayerTrack } from "@/types/player/model";
import type { CanvasSideTip } from "@/types/scratchpad/canvas";
import type {
  LocalHistoryEntry,
  ScratchpadAppendResult,
  ScratchpadEntry,
  ScratchpadGroup,
  ScratchpadOrigin,
} from "@/types/scratchpad/model";

export const SCRATCHPAD_MAX_ENTRIES = 1000;
export const LOCAL_HISTORY_MAX_ENTRIES = 300;

export function providerLabel(provider: MusicProvider, t: TFunction): string {
  return provider === "netease" ? t("scratchpad.providerNetease") : t("scratchpad.providerQq");
}

/**
 * 将曲目追加到速记簿：按 trackIdentity 去重（包含本批内重复），新条目插到最前面以便立刻看见，
 * 超出上限时裁掉最旧的条目。
 */
export function appendScratchpadEntries(
  current: readonly ScratchpadEntry[],
  tracks: readonly PlayerTrack[],
  origin?: ScratchpadOrigin,
  now = Date.now(),
): ScratchpadAppendResult {
  const seen = new Set(current.map((entry) => entry.key));
  const incoming: ScratchpadEntry[] = [];
  let skipped = 0;

  for (const track of tracks) {
    const key = playerTrackKey(track);
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    incoming.push({
      key,
      track,
      addedAt: now,
      ...(origin ? { origin } : {}),
    });
  }

  if (incoming.length === 0) {
    return {
      added: 0,
      skipped,
      addedKeys: [],
      entries: [...current],
    };
  }

  const next = [...incoming, ...current].slice(0, SCRATCHPAD_MAX_ENTRIES);
  const keptKeys = new Set(next.map((entry) => entry.key));
  const addedKeys = incoming.filter((entry) => keptKeys.has(entry.key)).map((entry) => entry.key);

  return {
    added: addedKeys.length,
    skipped,
    addedKeys,
    entries: next,
  };
}

/** 按音源分组，保持来源首次出现的顺序与组内原有顺序。 */
export function groupScratchpadEntries(entries: readonly ScratchpadEntry[]): ScratchpadGroup[] {
  const buckets = new Map<MusicProvider, ScratchpadEntry[]>();
  for (const entry of entries) {
    const provider = entry.track.ref.provider;
    let group = buckets.get(provider);
    if (!group) {
      group = [];
      buckets.set(provider, group);
    }
    group.push(entry);
  }
  return [...buckets.entries()].map(([provider, groupEntries]) => ({
    key: provider,
    provider,
    entries: groupEntries,
  }));
}

/**
 * 将同一来源组内的若干 key 作为整块移到该组剩余条目的 targetIndex 处，
 * 其他来源组的相对位置保持不变。
 */
export function moveWithinGroup(
  entries: readonly ScratchpadEntry[],
  provider: MusicProvider,
  keys: readonly string[],
  targetIndex: number,
): ScratchpadEntry[] {
  const moveSet = new Set(keys);
  if (moveSet.size === 0) return [...entries];

  const groupEntries = entries.filter((entry) => entry.track.ref.provider === provider);
  const moving = groupEntries.filter((entry) => moveSet.has(entry.key));
  if (moving.length === 0) return [...entries];

  const remaining = groupEntries.filter((entry) => !moveSet.has(entry.key));
  const insertAt = Math.max(0, Math.min(remaining.length, targetIndex));
  const reorderedGroup = [...remaining.slice(0, insertAt), ...moving, ...remaining.slice(insertAt)];

  // If the relative group order matches verbatim, return original reference.
  if (reorderedGroup.every((entry, idx) => entry.key === groupEntries[idx]?.key)) {
    return [...entries];
  }

  let cursor = 0;
  return entries.map((entry) =>
    entry.track.ref.provider === provider ? reorderedGroup[cursor++] : entry,
  );
}

export function removeScratchpadKeys(
  entries: readonly ScratchpadEntry[],
  keys: readonly string[],
): ScratchpadEntry[] {
  const removeSet = new Set(keys);
  if (removeSet.size === 0) return [...entries];
  return entries.filter((entry) => !removeSet.has(entry.key));
}

export function filterScratchpadEntries(
  entries: readonly ScratchpadEntry[],
  query: string,
  providerFilter: "all" | MusicProvider,
): ScratchpadEntry[] {
  const normalizedQuery = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (providerFilter !== "all" && entry.track.ref.provider !== providerFilter) return false;
    if (!normalizedQuery) return true;
    const title = entry.track.title.toLowerCase();
    const artists = entry.track.artists.map((artist) => artist.name.toLowerCase()).join(" ");
    const album = entry.track.album?.title.toLowerCase() ?? "";
    const origin = entry.origin?.label.toLowerCase() ?? "";
    return (
      title.includes(normalizedQuery) ||
      artists.includes(normalizedQuery) ||
      album.includes(normalizedQuery) ||
      origin.includes(normalizedQuery)
    );
  });
}

/** 记录一条本地播放历史，按 trackIdentity 去重并置顶，最多保留 LOCAL_HISTORY_MAX_ENTRIES 条。 */
export function recordLocalHistoryEntry(
  current: readonly LocalHistoryEntry[],
  track: PlayerTrack,
  now = Date.now(),
): LocalHistoryEntry[] {
  const key = playerTrackKey(track);
  const filtered = current.filter((entry) => entry.key !== key);
  return [{ key, track, playedAt: now }, ...filtered].slice(0, LOCAL_HISTORY_MAX_ENTRIES);
}

export function removeLocalHistoryKeys(
  current: readonly LocalHistoryEntry[],
  keys: readonly string[],
): LocalHistoryEntry[] {
  const removeSet = new Set(keys);
  if (removeSet.size === 0) return [...current];
  return current.filter((entry) => !removeSet.has(entry.key));
}

export function getPrimaryModifierLabel(): string {
  if (typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/i.test(navigator.platform)) {
    return "Cmd";
  }
  return "Ctrl";
}

export function scratchpadCanvasTips(
  tab: "notes" | "queue" | "history" | "moments",
  t: TFunction,
  canReorder = true,
): CanvasSideTip[] {
  const mod = getPrimaryModifierLabel();
  const common: CanvasSideTip[] = [
    { key: t("scratchpad.tipMarqueeKey"), label: t("scratchpad.tipMarquee") },
    { key: t("scratchpad.tipAddKey", { mod }), label: t("scratchpad.tipAdd") },
  ];
  if (tab === "notes") {
    return [
      ...common,
      ...(canReorder
        ? [{ key: t("scratchpad.tipReorderKey"), label: t("scratchpad.tipReorderGroup") }]
        : []),
      { key: t("scratchpad.tipDeleteKey"), label: t("scratchpad.tipDelete") },
      { key: t("scratchpad.tipEscKey"), label: t("scratchpad.tipEsc") },
    ];
  }
  if (tab === "history") {
    return [
      ...common,
      { key: t("scratchpad.tipPlayKey"), label: t("scratchpad.tipPlay") },
      { key: t("scratchpad.tipDeleteKey"), label: t("scratchpad.tipDelete") },
    ];
  }
  if (tab === "moments") {
    return [
      ...common,
      { key: t("scratchpad.tipPlayKey"), label: t("scratchpad.tipPlay") },
      { key: t("scratchpad.tipEscKey"), label: t("scratchpad.tipEsc") },
    ];
  }
  return [
    ...common,
    ...(canReorder
      ? [{ key: t("scratchpad.tipReorderKey"), label: t("scratchpad.tipReorder") }]
      : []),
    { key: t("scratchpad.tipPlayKey"), label: t("scratchpad.tipPlay") },
    { key: t("scratchpad.tipEscKey"), label: t("scratchpad.tipEsc") },
  ];
}
