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
import type {
  ScratchpadPanelGroupProps,
  SortableScratchpadRowProps,
} from "@/types/scratchpad/components";
import { useTranslation } from "react-i18next";
import { NowPlayingHistorySubView } from "@/components/scratchpad/NowPlayingHistorySubView";
import { NowPlayingMomentsSubView } from "@/components/scratchpad/NowPlayingMomentsSubView";
import { ScratchpadQueueList } from "./ScratchpadQueueList";
import ScratchpadShape from "./ScratchpadShape";
import ScratchpadPanel from "./ScratchpadPanel";
import { SCRATCHPAD_TABS } from "@/lib/scratchpad/scratchpadLook";
import { useSlimOrder } from "@/hooks/scratchpad/useSlimOrder";
import { ScratchpadEmpty } from "@/components/scratchpad/ScratchpadEmpty";
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
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/module/player";
import { collectTracksToScratchpad, useScratchpadStore } from "@/store/module/scratchpad";
import { useUiStore } from "@/store/module/ui";

/**
 * 右侧面板中的速记簿视图：保留 Scopify 面板卡片/行密度与配色语言，
 * 按音源分组并支持组内拖拽排序、单曲/整组入队、存为歌单，以及一键展开至全屏画布工作区。
 */
export function NowPlayingScratchpadView() {
  const { t } = useTranslation();
  const entries = useScratchpadStore((s) => s.entries);
  const localHistory = useScratchpadStore((s) => s.localHistory);
  const momentsByKey = useScratchpadStore((s) => s.momentsByKey);
  const panelTab = useScratchpadStore((s) => s.panelTab);
  const setPanelTab = useScratchpadStore((s) => s.setPanelTab);
  const lastAddedKeys = useScratchpadStore((s) => s.lastAddedKeys);
  const addNonce = useScratchpadStore((s) => s.addNonce);
  const removeKeys = useScratchpadStore((s) => s.removeKeys);
  const clearEntries = useScratchpadStore((s) => s.clearEntries);
  const clearHistory = useScratchpadStore((s) => s.clearHistory);
  const moveGroupEntries = useScratchpadStore((s) => s.moveGroupEntries);
  const openWorkspace = useScratchpadStore((s) => s.openWorkspace);

  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const queueLength = usePlayerStore((s) => s.queue.length);

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
    setConfirmClear(false);
  }, [entries.length, localHistory.length, panelTab]);

  const groups = useMemo(() => groupScratchpadEntries(entries), [entries]);
  const momentsCount = useMemo(() => Object.keys(momentsByKey).length, [momentsByKey]);
  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;
  const isCurrentCollected = useMemo(
    () => (currentKey ? entries.some((entry) => entry.key === currentKey) : false),
    [currentKey, entries],
  );

  const expandTarget = panelTab === "notes" && !entries.length ? "overview" : panelTab;

  const slimOrder = useSlimOrder(SCRATCHPAD_TABS, panelTab);
  return (
    <div className="scratchpad-root min-h-0 flex-1 overflow-hidden">
      <ScratchpadPanel
        tab={panelTab}
        counts={{
          notes: entries.length,
          history: localHistory.length,
          queue: queueLength,
          moments: momentsCount,
        }}
        slimOrder={slimOrder}
        onSelectTab={setPanelTab}
        onClose={() => useUiStore.getState().setNowPlayingPanelTab("overview")}
        expandLabel={t("scratchpad.expandWorkspace")}
        onExpand={() => openWorkspace(expandTarget)}
        showIntro={panelTab !== "moments"}
      >
        <div className="scratchpad-panel-page" data-page={panelTab}>
          {panelTab !== "moments" && (
            <div className="scratchpad-hint flex items-center justify-between gap-2">
              <span>
                {t(
                  panelTab === "history"
                    ? "scratchpad.historyHint"
                    : panelTab === "queue"
                      ? "scratchpad.queueHint"
                      : "scratchpad.hint",
                )}
              </span>
              {panelTab === "notes" && currentTrack && (
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
              {panelTab === "history" && localHistory.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (!confirmClear) setConfirmClear(true);
                    else {
                      clearHistory();
                      setConfirmClear(false);
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors",
                    confirmClear
                      ? "bg-destructive text-white"
                      : "text-content-muted hover:bg-content/10 hover:text-destructive",
                  )}
                >
                  <Trash2 className="size-3" />
                  <span>{t(confirmClear ? "scratchpad.confirmClear" : "scratchpad.clear")}</span>
                </button>
              )}
            </div>
          )}
          {panelTab === "queue" ? (
            <ScratchpadQueueList />
          ) : panelTab === "history" ? (
            <NowPlayingHistorySubView />
          ) : panelTab === "moments" ? (
            <NowPlayingMomentsSubView />
          ) : entries.length === 0 ? (
            <ScratchpadEmpty
              icon={NotebookPen}
              title={t("scratchpad.emptyTitle")}
              description={t("scratchpad.emptyDescription")}
            >
              <button
                type="button"
                onClick={() => openWorkspace("overview")}
                className="inline-flex items-center gap-1.5 rounded-sm border-b border-brand/40 py-1 text-xs font-semibold text-content hover:text-brand"
              >
                <Maximize2 className="size-3.5" />
                <span>{t("scratchpad.openOverview")}</span>
              </button>
            </ScratchpadEmpty>
          ) : (
            <>
              <ScrollArea className="min-h-0 flex-1">
                <div className="scratchpad-list">
                  {groups.map((group) => (
                    <ScratchpadPanelGroup
                      key={group.key}
                      group={group}
                      currentKey={currentKey}
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
                      onSaveEntry={(entry) =>
                        actions.openSaveToPlaylist([entry.track], "scratchpad")
                      }
                      onRemoveEntry={(entry) => removeKeys([entry.key])}
                    />
                  ))}
                </div>
              </ScrollArea>

              <footer className="scratchpad-footer flex-wrap">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => actions.enqueueTracks(entries.map((entry) => entry.track))}
                    className="scratchpad-pill is-solid"
                  >
                    <ListPlus className="size-3.5" />
                    <span>{t("scratchpad.enqueueAll")}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => actions.replaceQueueAndPlay(entries.map((entry) => entry.track))}
                    title={t("scratchpad.replaceQueueHint")}
                    className="scratchpad-pill"
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
                    className="scratchpad-pill"
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
      </ScratchpadPanel>
    </div>
  );
}

function ScratchpadPanelGroup({
  group,
  currentKey,
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
    <section className="scratchpad-group">
      <div className="scratchpad-group-header">
        <ScratchpadShape kind="circle" size={10} fill="var(--scratchpad-mark-wall)" />
        <span className="scratchpad-group-label">{providerLabel(group.provider, t)}</span>
        <span className="scratchpad-group-count">
          {t("scratchpad.count", { count: group.entries.length })}
        </span>
        <span aria-hidden className="scratchpad-group-rule" />
        <span className="scratchpad-group-actions">
          <button
            type="button"
            className="scratchpad-icon-button"
            onClick={onEnqueueGroup}
            title={t("scratchpad.enqueueGroup")}
            aria-label={t("scratchpad.enqueueGroup")}
          >
            <ListPlus />
          </button>
          <button
            type="button"
            className="scratchpad-icon-button"
            onClick={onSaveGroup}
            title={t("scratchpad.saveGroupToPlaylist")}
            aria-label={t("scratchpad.saveGroupToPlaylist")}
          >
            <FolderPlus />
          </button>
        </span>
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

function SortableScratchpadRow({
  entry,
  isActive,
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
      className={cn("scratchpad-row", isActive && "is-current", isFresh && "is-fresh")}
    >
      <span className="scratchpad-cover" aria-hidden>
        {coverUrl ? (
          <Image width={80} height={80} src={getSizedImageUrl(coverUrl, 120)} alt="" />
        ) : (
          <Music2 size={16} />
        )}
      </span>
      <div className="scratchpad-song">
        <span className="scratchpad-name">{entry.track.title}</span>
        <span className="scratchpad-meta">{subtitle}</span>
      </div>
      <span
        className="scratchpad-row-actions"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="scratchpad-icon-button"
          onClick={onPlay}
          aria-label={t("scratchpad.play")}
          title={t("scratchpad.play")}
        >
          <Play />
        </button>
        <button
          type="button"
          className="scratchpad-icon-button"
          onClick={onEnqueue}
          aria-label={t("scratchpad.enqueue")}
          title={t("scratchpad.enqueue")}
        >
          <ListPlus />
        </button>
        <button
          type="button"
          className="scratchpad-icon-button"
          onClick={onSave}
          aria-label={t("scratchpad.saveToPlaylist")}
          title={t("scratchpad.saveToPlaylist")}
        >
          <FolderPlus />
        </button>
        <button
          type="button"
          className="scratchpad-icon-button"
          onClick={onRemove}
          aria-label={t("scratchpad.remove")}
          title={t("scratchpad.remove")}
        >
          <X />
        </button>
      </span>
    </div>
  );
}
