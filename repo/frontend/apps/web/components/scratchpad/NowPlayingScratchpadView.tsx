"use client";

import Image from "next/image";
import {
  Check,
  FolderPlus,
  ListEnd,
  ListPlus,
  Maximize2,
  Music2,
  NotebookPen,
  Play,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DragThumbnail } from "@/components/shared/DragThumbnail";
import { SortableList } from "@/components/shared/SortableList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSortableListItem } from "@/hooks/playlist/useSortableListItem";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { getSizedImageUrl } from "@/lib/music/imageUrl";
import { resolveCoverUrl } from "@/lib/music/resolveCoverUrl";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { groupScratchpadEntries, providerLabel } from "@/lib/scratchpad/scratchpadModel";
import { cn, formatDuration } from "@/lib/utils";
import { usePlayerStore } from "@/store/module/player";
import { collectTracksToScratchpad, useScratchpadStore } from "@/store/module/scratchpad";
import type { ScratchpadEntry, ScratchpadGroup } from "@/types/scratchpad/model";

/**
 * 右侧面板中的速记簿视图：保留 Scopify 面板卡片/行密度与配色语言，
 * 按音源分组并支持组内拖拽排序、单曲/整组入队、存为歌单，以及一键展开至全屏画布工作区。
 */
export function NowPlayingScratchpadView() {
  const { t } = useTranslation();
  const entries = useScratchpadStore((s) => s.entries);
  const lastAddedKeys = useScratchpadStore((s) => s.lastAddedKeys);
  const addNonce = useScratchpadStore((s) => s.addNonce);
  const removeKeys = useScratchpadStore((s) => s.removeKeys);
  const clearEntries = useScratchpadStore((s) => s.clearEntries);
  const moveGroupEntries = useScratchpadStore((s) => s.moveGroupEntries);
  const openWorkspace = useScratchpadStore((s) => s.openWorkspace);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const actions = useScratchpadActions();

  const [freshKeys, setFreshKeys] = useState<ReadonlySet<string>>(() => new Set());
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (addNonce === 0 || lastAddedKeys.length === 0) return;
    setFreshKeys(new Set(lastAddedKeys));
    const timer = window.setTimeout(() => setFreshKeys(new Set()), 1600);
    return () => window.clearTimeout(timer);
  }, [addNonce, lastAddedKeys]);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  useEffect(() => {
    if (entries.length === 0) setConfirmClear(false);
  }, [entries.length]);

  const groups = useMemo(() => groupScratchpadEntries(entries), [entries]);
  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;
  const isCurrentCollected = useMemo(
    () => (currentKey ? entries.some((entry) => entry.key === currentKey) : false),
    [currentKey, entries],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pb-2">
        <p className="text-xs text-content-muted tabular-nums">
          {t("scratchpad.count", { count: entries.length })}
        </p>
        <div className="flex items-center gap-1">
          {currentTrack && (
            <button
              type="button"
              disabled={isCurrentCollected}
              onClick={() =>
                collectTracksToScratchpad([currentTrack], { label: t("nowPlaying.title") })
              }
              title={
                isCurrentCollected ? t("scratchpad.alreadyIn") : t("scratchpad.collectCurrent")
              }
              aria-label={
                isCurrentCollected ? t("scratchpad.alreadyIn") : t("scratchpad.collectCurrent")
              }
              className={cn(
                "rounded-full p-1.5 transition-colors",
                isCurrentCollected
                  ? "text-brand opacity-75"
                  : "text-content-muted hover:bg-content/10 hover:text-content",
              )}
            >
              {isCurrentCollected ? (
                <Check className="size-4" />
              ) : (
                <NotebookPen className="size-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => openWorkspace(entries.length > 0 ? "notes" : "overview")}
            title={t("scratchpad.expandWorkspace")}
            aria-label={t("scratchpad.expandWorkspace")}
            className="inline-flex items-center gap-1 rounded-full bg-content/8 px-2.5 py-1 text-xs font-medium text-content transition-colors hover:bg-content/15"
          >
            <Maximize2 className="size-3.5" />
            <span>{t("scratchpad.expandShort")}</span>
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-content/5 text-content-muted">
            <NotebookPen aria-hidden className="size-7" />
          </span>
          <h3 className="text-sm font-semibold text-content">{t("scratchpad.emptyTitle")}</h3>
          <p className="max-w-60 text-xs leading-relaxed text-content-muted">
            {t("scratchpad.emptyDescription")}
          </p>
          <button
            type="button"
            onClick={() => openWorkspace("overview")}
            className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-content/10 px-3.5 py-1.5 text-xs font-medium text-content transition-colors hover:bg-content/16"
          >
            <Maximize2 className="size-3.5" />
            <span>{t("scratchpad.openOverview")}</span>
          </button>
        </div>
      ) : (
        <>
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-4 px-2 pb-3">
              {groups.map((group) => (
                <ScratchpadPanelGroup
                  key={group.key}
                  group={group}
                  currentKey={currentKey}
                  isPlaying={isPlaying}
                  freshKeys={freshKeys}
                  onMove={(fromIndex, toIndex) => {
                    const target = group.entries[fromIndex];
                    if (!target) return;
                    moveGroupEntries(group.provider, [target.key], toIndex);
                  }}
                  onPlay={(entry) => actions.playNow(entry.track)}
                  onEnqueueGroup={() =>
                    actions.enqueueTracks(group.entries.map((entry) => entry.track))
                  }
                  onSaveGroup={() =>
                    actions.openSaveToPlaylist(
                      group.entries.map((entry) => entry.track),
                      "scratchpad",
                    )
                  }
                  onEnqueueEntry={(entry) => actions.enqueueTracks([entry.track])}
                  onSaveEntry={(entry) => actions.openSaveToPlaylist([entry.track], "scratchpad")}
                  onRemoveEntry={(entry) => removeKeys([entry.key])}
                />
              ))}
            </div>
          </ScrollArea>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-t border-border/60 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => actions.enqueueTracks(entries.map((entry) => entry.track))}
                className="inline-flex items-center gap-1 rounded-full bg-content px-3 py-1 text-xs font-semibold text-surface transition-opacity hover:opacity-90"
              >
                <ListPlus className="size-3.5" />
                <span>{t("scratchpad.enqueueAll")}</span>
              </button>
              <button
                type="button"
                onClick={() => actions.replaceQueueAndPlay(entries.map((entry) => entry.track))}
                title={t("scratchpad.replaceQueueHint")}
                className="inline-flex items-center gap-1 rounded-full bg-content/10 px-2.5 py-1 text-xs font-medium text-content transition-colors hover:bg-content/16"
              >
                <ListEnd className="size-3.5" />
                <span>{t("scratchpad.replaceQueue")}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  actions.openSaveToPlaylist(
                    entries.map((entry) => entry.track),
                    "scratchpad",
                  )
                }
                className="inline-flex items-center gap-1 rounded-full bg-content/10 px-2.5 py-1 text-xs font-medium text-content transition-colors hover:bg-content/16"
              >
                <FolderPlus className="size-3.5" />
                <span>{t("scratchpad.saveToPlaylist")}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!confirmClear) setConfirmClear(true);
                else {
                  clearEntries();
                  setConfirmClear(false);
                }
              }}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                confirmClear
                  ? "bg-destructive text-white"
                  : "text-content-muted hover:bg-content/10 hover:text-destructive",
              )}
            >
              <Trash2 className="size-3.5" />
              <span>{t(confirmClear ? "scratchpad.confirmClear" : "scratchpad.clear")}</span>
            </button>
          </footer>
        </>
      )}
    </div>
  );
}

interface ScratchpadPanelGroupProps {
  group: ScratchpadGroup;
  currentKey: string | null;
  isPlaying: boolean;
  freshKeys: ReadonlySet<string>;
  onMove: (fromIndex: number, toIndex: number) => void;
  onPlay: (entry: ScratchpadEntry) => void;
  onEnqueueGroup: () => void;
  onSaveGroup: () => void;
  onEnqueueEntry: (entry: ScratchpadEntry) => void;
  onSaveEntry: (entry: ScratchpadEntry) => void;
  onRemoveEntry: (entry: ScratchpadEntry) => void;
}

function ScratchpadPanelGroup({
  group,
  currentKey,
  isPlaying,
  freshKeys,
  onMove,
  onPlay,
  onEnqueueGroup,
  onSaveGroup,
  onEnqueueEntry,
  onSaveEntry,
  onRemoveEntry,
}: ScratchpadPanelGroupProps) {
  const { t } = useTranslation();
  const ids = useMemo(() => group.entries.map((entry) => entry.key), [group.entries]);

  return (
    <section className="space-y-1">
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-xs font-semibold text-content-muted">
            {providerLabel(group.provider, t)}
          </span>
          <span className="rounded-full bg-content/8 px-1.5 py-0.5 text-[10px] leading-none font-medium text-content-muted tabular-nums">
            {group.entries.length}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onEnqueueGroup}
            title={t("scratchpad.enqueueGroup")}
            aria-label={t("scratchpad.enqueueGroup")}
            className="rounded-full p-1 text-content-muted transition-colors hover:bg-content/10 hover:text-content"
          >
            <ListPlus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onSaveGroup}
            title={t("scratchpad.saveGroupToPlaylist")}
            aria-label={t("scratchpad.saveGroupToPlaylist")}
            className="rounded-full p-1 text-content-muted transition-colors hover:bg-content/10 hover:text-content"
          >
            <FolderPlus className="size-3.5" />
          </button>
        </div>
      </div>

      <SortableList
        ids={ids}
        onMove={onMove}
        renderOverlay={(id) => {
          const entry = group.entries.find((item) => item.key === String(id));
          if (!entry) return null;
          return (
            <DragThumbnail
              cover={entry.track.album?.coverUrl ?? ""}
              title={entry.track.title}
              subtitle={formatTrackArtists(entry.track)}
            />
          );
        }}
      >
        <div className="space-y-0.5">
          {group.entries.map((entry) => (
            <SortableScratchpadRow
              key={entry.key}
              entry={entry}
              isActive={entry.key === currentKey}
              isPlaying={entry.key === currentKey && isPlaying}
              isFresh={freshKeys.has(entry.key)}
              onPlay={() => onPlay(entry)}
              onEnqueue={() => onEnqueueEntry(entry)}
              onSave={() => onSaveEntry(entry)}
              onRemove={() => onRemoveEntry(entry)}
            />
          ))}
        </div>
      </SortableList>
    </section>
  );
}

interface SortableScratchpadRowProps {
  entry: ScratchpadEntry;
  isActive: boolean;
  isPlaying: boolean;
  isFresh: boolean;
  onPlay: () => void;
  onEnqueue: () => void;
  onSave: () => void;
  onRemove: () => void;
}

function SortableScratchpadRow({
  entry,
  isActive,
  isPlaying,
  isFresh,
  onPlay,
  onEnqueue,
  onSave,
  onRemove,
}: SortableScratchpadRowProps) {
  const { t } = useTranslation();
  const drag = useSortableListItem(entry.key);
  const coverUrl = resolveCoverUrl(entry.track.album?.coverUrl ?? undefined);
  const artists = formatTrackArtists(entry.track);
  const subtitle = entry.origin?.label ? `${artists} · ${entry.origin.label}` : artists;

  return (
    <div
      ref={drag.setNodeRef}
      {...drag.rowProps}
      style={drag.style}
      onClick={onPlay}
      className={cn(
        "group relative flex h-14 cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors",
        isActive ? "bg-content/10" : "hover:bg-content/10",
        isFresh && "bg-brand/10 ring-1 ring-brand/30",
      )}
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-surface-elevated">
        {coverUrl ? (
          <Image
            width={80}
            height={80}
            src={getSizedImageUrl(coverUrl, 120)}
            alt={entry.track.title}
            className="size-full object-cover"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-content-muted">
            <Music2 className="size-4" />
          </span>
        )}
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-black/45 text-white transition-opacity",
            isActive && isPlaying ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <Play className="size-4 fill-current" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={cn("truncate text-sm font-medium", isActive ? "text-brand" : "text-content")}
          title={entry.track.title}
        >
          {entry.track.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-content-muted" title={subtitle}>
          {subtitle}
        </p>
      </div>

      <div className="shrink-0">
        <span className="text-xs text-content-muted tabular-nums group-hover:hidden">
          {formatDuration(entry.track.durationMs)}
        </span>
        <div
          className="hidden items-center gap-0.5 group-hover:flex"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={onEnqueue}
            title={t("scratchpad.enqueue")}
            aria-label={t("scratchpad.enqueue")}
            className="rounded-full p-1 text-content-muted transition-colors hover:bg-content/12 hover:text-content"
          >
            <ListPlus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onSave}
            title={t("scratchpad.saveToPlaylist")}
            aria-label={t("scratchpad.saveToPlaylist")}
            className="rounded-full p-1 text-content-muted transition-colors hover:bg-content/12 hover:text-content"
          >
            <FolderPlus className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            title={t("scratchpad.remove")}
            aria-label={t("scratchpad.remove")}
            className="rounded-full p-1 text-content-muted transition-colors hover:bg-content/12 hover:text-destructive"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
