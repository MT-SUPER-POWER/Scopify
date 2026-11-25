"use client";

import { Check, FolderPlus, ListPlus, MessageSquareQuote, NotebookPen, Tag, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ScratchpadCanvas } from "@/components/scratchpad/ScratchpadCanvas";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { formatTrackArtists } from "@/lib/player/trackDisplay";
import { playerTrackKey } from "@/lib/player/trackIdentity";
import { spacingForDensity } from "@/lib/scratchpad/canvasLayout";
import { scratchpadCanvasTips } from "@/lib/scratchpad/scratchpadModel";
import { buildMomentTagGroups, formatMomentAt } from "@/lib/scratchpad/songNotesModel";
import { usePlayerStore } from "@/store/module/player";
import {
  collectTracksToScratchpad,
  openTrackMoments,
  useScratchpadStore,
} from "@/store/module/scratchpad";
import { Input } from "@scopify/ui/shadcn/components/input";
import type { PlayerTrack } from "@/types/player/model";
import type {
  CanvasAction,
  CanvasEntry,
  CanvasGroup,
  CanvasSideConfig,
} from "@/types/scratchpad/canvas";
import type { ScratchpadFilterProps } from "@/types/scratchpad/components";

interface ScratchpadMomentsCanvasProps extends ScratchpadFilterProps {
  onEscape: () => void;
}

/**
 * 工作区「时刻」画布：按标签归纳所有做过笔记/打过标签的曲目，
 * 支持搜索、跨标签框选批量打标签、入队、收进速记簿与打开单曲时间轴详情。
 */
export function ScratchpadMomentsCanvas({
  searchQuery,
  providerFilter,
  density,
  onEscape,
}: ScratchpadMomentsCanvasProps) {
  const { t } = useTranslation();
  const momentsByKey = useScratchpadStore((s) => s.momentsByKey);
  const tags = useScratchpadStore((s) => s.tags);
  const addTagToTracks = useScratchpadStore((s) => s.addTagToTracks);
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const actions = useScratchpadActions();

  const [batchTagTargets, setBatchTagTargets] = useState<PlayerTrack[] | null>(null);
  const [batchTagInput, setBatchTagInput] = useState("");

  const currentKey = currentTrack ? playerTrackKey(currentTrack) : null;
  const tagMap = useMemo(() => new Map(tags.map((tag) => [tag.key, tag.name])), [tags]);

  const tagGroups = useMemo(
    () =>
      buildMomentTagGroups(
        momentsByKey,
        tags,
        searchQuery,
        providerFilter,
        t("scratchpad.momentsUntagged"),
      ),
    [momentsByKey, providerFilter, searchQuery, t, tags],
  );

  const groups = useMemo<CanvasGroup[]>(() => {
    return tagGroups.map((group) => {
      const groupTracks = group.records.map((record) => record.track);
      return {
        key: group.key,
        label: group.tagKey ? `#${group.name}` : group.name,
        jumpLabel: group.tagKey ? `#${group.name}` : group.name,
        entries: group.records.map((record) => {
          const latest = record.comments[0];
          const quote =
            latest?.text ||
            (latest?.at !== undefined
              ? t("scratchpad.momentMarkOnly", { time: formatMomentAt(latest.at) })
              : undefined);
          const tagLine = record.tags
            .slice(0, 2)
            .map((key) => `#${tagMap.get(key) ?? key}`)
            .join(" ");
          const counts =
            record.comments.length > 0
              ? t("scratchpad.momentsCommentCount", { count: record.comments.length })
              : t("scratchpad.momentsTagsOnly", { count: record.tags.length });
          return {
            key: `${group.key}|${record.key}`,
            track: record.track,
            meta: formatTrackArtists(record.track),
            tagLine: tagLine || undefined,
            quote,
            counts,
            isCurrent: currentKey === record.key,
          };
        }),
        buttons: [
          {
            id: "enqueue-group",
            label: t("scratchpad.enqueueGroup"),
            icon: ListPlus,
            run: () => actions.enqueueTracks(groupTracks),
          },
          {
            id: "save-group",
            label: t("scratchpad.saveToPlaylist"),
            icon: FolderPlus,
            run: () => actions.openSaveToPlaylist(groupTracks, "moments"),
          },
        ],
      };
    });
  }, [actions, currentKey, t, tagGroups, tagMap]);

  const side = useMemo<CanvasSideConfig>(
    () => ({
      jumpLabel: t("scratchpad.jumpTo"),
      tipsLabel: t("scratchpad.tipsTitle"),
      tips: scratchpadCanvasTips("moments", t),
    }),
    [t],
  );

  const selectionActions = useCallback(
    (selected: CanvasEntry[]): CanvasAction[] => {
      const tracks = selected.map((item) => item.track);
      const list: CanvasAction[] = [];
      if (selected.length === 1) {
        list.push({
          id: "open-moments",
          label: t("scratchpad.openMoments"),
          icon: MessageSquareQuote,
          run: () => openTrackMoments(selected[0].track),
        });
      }
      list.push(
        {
          id: "batch-tag",
          label: t("scratchpad.batchTag"),
          icon: Tag,
          run: () => {
            setBatchTagTargets(tracks);
            setBatchTagInput("");
          },
        },
        {
          id: "enqueue",
          label: t("scratchpad.enqueue"),
          icon: ListPlus,
          run: () => actions.enqueueTracks(tracks),
        },
        {
          id: "collect",
          label: t("scratchpad.collect"),
          icon: NotebookPen,
          run: () => collectTracksToScratchpad(tracks, { label: t("scratchpad.tabMoments") }),
        },
        {
          id: "save-to-playlist",
          label: t("scratchpad.saveToPlaylist"),
          icon: FolderPlus,
          run: () => actions.openSaveToPlaylist(tracks, "moments"),
        },
      );
      return list;
    },
    [actions, t],
  );

  const applyBatchTag = (rawName: string) => {
    if (!batchTagTargets || batchTagTargets.length === 0) return;
    if (addTagToTracks(batchTagTargets, rawName)) {
      toast.success(
        t("scratchpad.toastBatchTagged", {
          count: batchTagTargets.length,
          tag: rawName.replace(/^#+/, "").trim(),
        }),
      );
      setBatchTagTargets(null);
      setBatchTagInput("");
    }
  };

  if (Object.keys(momentsByKey).length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-content/6 text-content-muted">
          <MessageSquareQuote className="size-8" />
        </span>
        <h3 className="text-base font-semibold text-content">
          {t("scratchpad.momentsEmptyTitle")}
        </h3>
        <p className="max-w-md text-sm text-content-muted">{t("scratchpad.momentsEmptyDesc")}</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center text-sm text-content-muted">
        {t("scratchpad.noSearchResults")}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {batchTagTargets && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-surface-raised/90 px-5 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Tag className="size-4 shrink-0 text-brand" />
            <span className="shrink-0 text-xs font-medium text-content">
              {t("scratchpad.batchTagPrompt", { count: batchTagTargets.length })}
            </span>
            <Input
              value={batchTagInput}
              onChange={(event) => setBatchTagInput(event.target.value)}
              placeholder={t("scratchpad.tagPlaceholder")}
              className="h-7 max-w-60 text-xs"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyBatchTag(batchTagInput);
                } else if (event.key === "Escape") {
                  setBatchTagTargets(null);
                }
              }}
            />
            {tags.slice(0, 6).map((tag) => (
              <button
                key={tag.key}
                type="button"
                onClick={() => applyBatchTag(tag.name)}
                className="hidden rounded-full bg-content/8 px-2 py-0.5 text-[11px] text-content-muted hover:bg-content/15 hover:text-content sm:inline-flex"
              >
                #{tag.name}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={!batchTagInput.trim()}
              onClick={() => applyBatchTag(batchTagInput)}
              className="inline-flex items-center gap-1 rounded-full bg-content px-3 py-1 text-xs font-semibold text-surface disabled:opacity-40"
            >
              <Check className="size-3.5" />
              <span>{t("common.action.confirm")}</span>
            </button>
            <button
              type="button"
              onClick={() => setBatchTagTargets(null)}
              aria-label={t("ui.close")}
              className="rounded-full p-1 text-content-muted hover:bg-content/10 hover:text-content"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <ScratchpadCanvas
        groups={groups}
        ariaLabel={t("scratchpad.tabMoments")}
        playLabel={t("scratchpad.play")}
        onPlay={(entry) => actions.playNow(entry.track)}
        selectionActions={selectionActions}
        onEscape={onEscape}
        spacing={spacingForDensity(density, "moments")}
        variant="moment"
        side={side}
        currentLabel={t("scratchpad.nowPlaying")}
      />
    </div>
  );
}
