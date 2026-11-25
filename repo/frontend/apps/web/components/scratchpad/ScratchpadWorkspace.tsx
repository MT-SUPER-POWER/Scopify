"use client";

import { useReducedMotion } from "framer-motion";
import { Grid3X3, LayoutGrid, ListPlus, Search, Shuffle, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import ScratchpadSheet, { ScratchpadBandActions } from "./ScratchpadSheet";
import { SCRATCHPAD_TABS } from "@/lib/scratchpad/scratchpadLook";
import { useSlimOrder } from "@/hooks/scratchpad/useSlimOrder";
import { useMediaQuery } from "@/hooks/ui/useMediaQuery";
import { SCRATCHPAD_TILT_DEG } from "@/lib/scratchpad/scratchpadTilt";
import { ScratchpadHistoryCanvas } from "@/components/scratchpad/ScratchpadHistoryCanvas";
import { ScratchpadMomentsCanvas } from "@/components/scratchpad/ScratchpadMomentsCanvas";
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

const PROVIDER_FILTER_IDS = ["all", "netease", "qq"] as const;

/**
 * 速记簿全屏扩展工作区：通过 Portal 渲染在 z-40（确保通知与歌单选择弹窗位于其上方），
 * 集合「总览」「速记簿」「播放队列」「播放历史」四大画布，提供搜索、音源筛选、密度切换与键盘工作流。
 */
export default function ScratchpadWorkspace() {
  const { t } = useTranslation();
  const entries = useScratchpadStore((s) => s.entries);
  const localHistory = useScratchpadStore((s) => s.localHistory);
  const momentsByKey = useScratchpadStore((s) => s.momentsByKey);
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

  const panelTab = useScratchpadStore((s) => s.panelTab);
  const sheetTab = activeTab === "overview" ? panelTab : activeTab;
  const calm = Boolean(useReducedMotion());
  const narrow = useMediaQuery("(max-width: 640px)");
  const tilt = calm || narrow ? 0 : SCRATCHPAD_TILT_DEG;
  const slimOrder = useSlimOrder(SCRATCHPAD_TABS, sheetTab);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className={cn("scratchpad-root fixed inset-0 z-40", calm && "is-calm")}>
      <div
        className={cn("scratchpad-drawer is-expanded", activeTab === "overview" && "is-overview")}
        role="dialog"
        aria-modal="true"
        aria-label={t("scratchpad.workspaceTitle")}
      >
        <ScratchpadSheet
          tab={sheetTab}
          tilt={tilt}
          calm={calm}
          slimOrder={slimOrder}
          notesCount={entries.length}
          queueCount={queue.length}
          commentsCount={Object.keys(momentsByKey).length}
          onOpenPage={setWorkspaceTab}
          onShowOverview={() => setWorkspaceTab("overview")}
          onCollapse={closeWorkspace}
          collapseLabel={t("ui.close")}
          overview={
            activeTab === "overview"
              ? (sheetWidth, viewHeight) => (
                  <ScratchpadOverviewView
                    sheetWidth={sheetWidth}
                    viewHeight={viewHeight}
                    tilt={tilt}
                    onOpenTab={setWorkspaceTab}
                    onCloseWorkspace={closeWorkspace}
                  />
                )
              : null
          }
        >
          <ScratchpadBandActions>
            <button
              type="button"
              onClick={() => setDensity(density === "standard" ? "compact" : "standard")}
              title={t(
                density === "standard" ? "scratchpad.densityCompact" : "scratchpad.densityStandard",
              )}
              aria-label={t(
                density === "standard" ? "scratchpad.densityCompact" : "scratchpad.densityStandard",
              )}
              className="scratchpad-pill is-icon"
            >
              {density === "standard" ? (
                <Grid3X3 className="size-4" />
              ) : (
                <LayoutGrid className="size-4" />
              )}
            </button>

            {activeTab === "notes" && entries.length > 0 && (
              <>
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
                  onClick={() => {
                    if (!confirmClear) setConfirmClear(true);
                    else {
                      clearEntries();
                      setConfirmClear(false);
                    }
                  }}
                  className={cn(
                    "scratchpad-pill",
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
              <button type="button" onClick={() => reshuffleQueue()} className="scratchpad-pill">
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
                  "scratchpad-pill",
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
          </ScratchpadBandActions>
          <div className="scratchpad-panel">
            <div className="flex shrink-0 flex-wrap items-center gap-2 px-2 pb-1">
              <div className="relative min-w-24 flex-1 sm:max-w-60">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-content-muted" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder={t("scratchpad.searchPlaceholder")}
                  className="h-7 rounded-none border-0 bg-surface-raised pr-7 pl-8 text-xs"
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

              <div className="flex items-center gap-1">
                {PROVIDER_FILTER_IDS.map((filterId) => (
                  <button
                    key={filterId}
                    type="button"
                    onClick={() => setProviderFilter(filterId)}
                    className={cn(
                      "scratchpad-pill is-small",
                      providerFilter === filterId
                        ? "is-solid"
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
            </div>
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
            {activeTab === "moments" && (
              <ScratchpadMomentsCanvas
                searchQuery={searchQuery}
                providerFilter={providerFilter}
                density={density}
                onEscape={closeWorkspace}
              />
            )}
          </div>
        </ScratchpadSheet>
      </div>
    </div>,
    document.body,
  );
}
