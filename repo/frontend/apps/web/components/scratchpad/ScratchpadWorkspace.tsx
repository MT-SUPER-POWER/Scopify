"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Grid3X3,
  History,
  LayoutGrid,
  ListMusic,
  ListPlus,
  NotebookPen,
  Search,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ScratchpadHistoryCanvas } from "@/components/scratchpad/ScratchpadHistoryCanvas";
import { ScratchpadNotesCanvas } from "@/components/scratchpad/ScratchpadNotesCanvas";
import { ScratchpadOverviewView } from "@/components/scratchpad/ScratchpadOverviewView";
import { ScratchpadQueueCanvas } from "@/components/scratchpad/ScratchpadQueueCanvas";
import { isPersonalFmPlaybackSource } from "@/constants/personalFm";
import { useScratchpadActions } from "@/hooks/scratchpad/useScratchpadActions";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/module/player";
import { useScratchpadStore } from "@/store/module/scratchpad";
import { useUiStore } from "@/store/module/ui";
import { Input } from "@scopify/ui/shadcn/components/input";
import type { ScratchpadWorkspaceTab } from "@/types/scratchpad/model";

const WORKSPACE_TABS: readonly {
  id: ScratchpadWorkspaceTab;
  icon: typeof NotebookPen;
}[] = [
  { id: "overview", icon: LayoutGrid },
  { id: "notes", icon: NotebookPen },
  { id: "queue", icon: ListMusic },
  { id: "history", icon: History },
];

const PROVIDER_FILTER_IDS = ["all", "netease", "qq"] as const;

/**
 * 速记簿全屏扩展工作区：通过 Portal 渲染在 z-40（确保通知与歌单选择弹窗位于其上方），
 * 集合「总览」「速记簿」「播放队列」「播放历史」四大画布，提供搜索、音源筛选、密度切换与键盘工作流。
 */
export default function ScratchpadWorkspace() {
  const { t } = useTranslation();
  const entries = useScratchpadStore((s) => s.entries);
  const localHistory = useScratchpadStore((s) => s.localHistory);
  const activeTab = useScratchpadStore((s) => s.workspaceTab);
  const density = useScratchpadStore((s) => s.density);
  const setWorkspaceTab = useScratchpadStore((s) => s.setWorkspaceTab);
  const setDensity = useScratchpadStore((s) => s.setDensity);
  const closeWorkspace = useScratchpadStore((s) => s.closeWorkspace);
  const clearEntries = useScratchpadStore((s) => s.clearEntries);
  const clearHistory = useScratchpadStore((s) => s.clearHistory);

  const queue = usePlayerStore((s) => s.queue);
  const playlistId = usePlayerStore((s) => s.playlistId);
  const reshuffleQueue = usePlayerStore((s) => s.reshuffleQueue);
  const isFm = isPersonalFmPlaybackSource(playlistId);
  const lyricsOpen = useUiStore((s) => s.isLyricsOpen || s.isCenterLyricsOpen);
  const actions = useScratchpadActions();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [providerFilter, setProviderFilter] = useState<"all" | "netease" | "qq">("all");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lyricsOpen) closeWorkspace();
  }, [closeWorkspace, lyricsOpen]);

  useEffect(() => {
    setConfirmClear(false);
  }, [activeTab]);

  useEffect(() => {
    if (!confirmClear) return;
    const timer = window.setTimeout(() => setConfirmClear(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirmClear]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Only close on Escape if no modal dialog is open above the workspace.
      if (useScratchpadStore.getState().saveDialog.open) return;
      event.preventDefault();
      closeWorkspace();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeWorkspace]);

  const countOf = (tab: ScratchpadWorkspaceTab) => {
    if (tab === "notes") return entries.length;
    if (tab === "queue") return queue.length;
    if (tab === "history") return localHistory.length;
    return null;
  };

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={t("scratchpad.workspaceTitle")}
        initial={{ opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.99 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-surface text-content"
      >
        <header className="flex h-15 shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-surface-raised/85 px-5 backdrop-blur-md">
          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex size-8 items-center justify-center rounded-lg bg-brand/12 text-brand">
                <NotebookPen className="size-4" />
              </span>
              <h1 className="text-sm font-bold tracking-tight text-content">
                {t("scratchpad.workspaceTitle")}
              </h1>
            </div>

            <nav
              role="tablist"
              aria-label={t("scratchpad.workspaceTitle")}
              className="flex items-center gap-1 rounded-full bg-surface-sunken p-1"
            >
              {WORKSPACE_TABS.map(({ id, icon: Icon }) => {
                const isActive = activeTab === id;
                const count = countOf(id);
                const label =
                  id === "overview"
                    ? t("scratchpad.tabOverview")
                    : id === "notes"
                      ? t("scratchpad.title")
                      : id === "queue"
                        ? t("scratchpad.tabQueue")
                        : t("scratchpad.tabHistory");
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setWorkspaceTab(id)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      isActive
                        ? "bg-surface-raised text-content shadow-xs"
                        : "text-content-muted hover:text-content",
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{label}</span>
                    {count !== null && count > 0 && (
                      <span className="rounded-full bg-content/8 px-1.5 text-[10px] leading-4 text-content-muted tabular-nums">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {activeTab !== "overview" && (
              <>
                <div className="relative hidden w-48 md:block lg:w-60">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-content-muted" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder={t("scratchpad.searchPlaceholder")}
                    className="h-8 rounded-full border-border/70 bg-surface-sunken pr-7 pl-8 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label={t("scratchpad.clearSearch")}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-0.5 text-content-muted hover:text-content"
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                <div className="hidden items-center gap-1 rounded-full bg-surface-sunken p-0.5 xl:flex">
                  {PROVIDER_FILTER_IDS.map((filterId) => (
                    <button
                      key={filterId}
                      type="button"
                      onClick={() => setProviderFilter(filterId)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                        providerFilter === filterId
                          ? "bg-surface-raised text-content shadow-xs"
                          : "text-content-muted hover:text-content",
                      )}
                    >
                      {filterId === "all"
                        ? t("scratchpad.filterAll")
                        : filterId === "netease"
                          ? t("scratchpad.providerNetease")
                          : t("scratchpad.providerQq")}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setDensity(density === "standard" ? "compact" : "standard")}
                  title={t(
                    density === "standard"
                      ? "scratchpad.densityCompact"
                      : "scratchpad.densityStandard",
                  )}
                  aria-label={t(
                    density === "standard"
                      ? "scratchpad.densityCompact"
                      : "scratchpad.densityStandard",
                  )}
                  className="flex size-8 items-center justify-center rounded-full bg-content/8 text-content-muted transition-colors hover:bg-content/14 hover:text-content"
                >
                  {density === "standard" ? (
                    <Grid3X3 className="size-4" />
                  ) : (
                    <LayoutGrid className="size-4" />
                  )}
                </button>
              </>
            )}

            {activeTab === "notes" && entries.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => actions.enqueueTracks(entries.map((entry) => entry.track))}
                  className="hidden items-center gap-1.5 rounded-full bg-content px-3 py-1.5 text-xs font-semibold text-surface transition-opacity hover:opacity-90 sm:inline-flex"
                >
                  <ListPlus className="size-3.5" />
                  <span>{t("scratchpad.enqueueAll")}</span>
                </button>
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
                    "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    confirmClear
                      ? "bg-destructive text-white"
                      : "bg-content/8 text-content-muted hover:text-destructive",
                  )}
                >
                  <Trash2 className="size-3.5" />
                  <span>{t(confirmClear ? "scratchpad.confirmClear" : "scratchpad.clear")}</span>
                </button>
              </>
            )}

            {activeTab === "queue" && queue.length > 1 && !isFm && (
              <button
                type="button"
                onClick={() => reshuffleQueue()}
                className="inline-flex items-center gap-1.5 rounded-full bg-content/8 px-3 py-1.5 text-xs font-medium text-content transition-colors hover:bg-content/14"
              >
                <Shuffle className="size-3.5" />
                <span>{t("scratchpad.shuffleQueue")}</span>
              </button>
            )}

            {activeTab === "history" && localHistory.length > 0 && (
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
                  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  confirmClear
                    ? "bg-destructive text-white"
                    : "bg-content/8 text-content-muted hover:text-destructive",
                )}
              >
                <Trash2 className="size-3.5" />
                <span>
                  {t(confirmClear ? "scratchpad.confirmClear" : "scratchpad.clearHistory")}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => closeWorkspace()}
              aria-label={t("ui.close")}
              title={`${t("ui.close")} (Esc)`}
              className="flex size-8 items-center justify-center rounded-full bg-content/8 text-content transition-colors hover:bg-content/16"
            >
              <X className="size-4" />
            </button>
          </div>
        </header>

        {activeTab === "overview" && (
          <ScratchpadOverviewView
            onOpenTab={(tab) => setWorkspaceTab(tab)}
            onCloseWorkspace={closeWorkspace}
          />
        )}
        {activeTab === "notes" && (
          <ScratchpadNotesCanvas
            searchQuery={searchQuery}
            providerFilter={providerFilter}
            density={density}
            onEscape={closeWorkspace}
          />
        )}
        {activeTab === "queue" && (
          <ScratchpadQueueCanvas
            searchQuery={searchQuery}
            providerFilter={providerFilter}
            density={density}
            onEscape={closeWorkspace}
          />
        )}
        {activeTab === "history" && (
          <ScratchpadHistoryCanvas
            searchQuery={searchQuery}
            providerFilter={providerFilter}
            density={density}
            onEscape={closeWorkspace}
          />
        )}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
