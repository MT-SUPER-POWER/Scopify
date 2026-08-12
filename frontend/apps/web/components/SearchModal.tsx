"use client";

import { Command, CornerDownLeft, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { searchSuggest } from "@/lib/api/search";
import { getStoredMusicCookie } from "@/lib/web/auth";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import { useSearchStore } from "@/store/module/search";
import { useShortcutStore } from "@/store/module/shortcuts";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import type { ShortcutCommandId } from "@/types/shortcuts";
import { HighlightText, type SuggestItem, SuggestTag } from "./SearchContents/SearchHelper";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MODAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SearchModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const smartRouter = useSmartRouter();
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const candidateListRef = useRef<HTMLDivElement>(null);
  const candidateRefs = useRef(new Map<number, HTMLElement>());

  const setGlobalQuery = useSearchStore((s) => s.setQuery);
  const setIsSearching = useSearchStore((s) => s.setIsSearching);
  const addRecent = useSearchStore((s) => s.addRecent);
  const removeRecent = useSearchStore((s) => s.removeRecent);
  const persistedQuery = useSearchStore((s) => s.query);
  const recentList = useSearchStore((s) => s.recent);
  const placeholder = useSearchStore((s) => s.placeholder);
  const usageCounts = useShortcutStore((s) => s.usageCounts);
  const incrementUsage = useShortcutStore((s) => s.incrementUsage);
  const { commands } = useShortcutRegistry();
  const executeCommand = useShortcutCommands();

  const [localValue, setLocalValue] = useState(persistedQuery || "");
  const [suggests, setSuggests] = useState<SuggestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const commandQuery = localValue.trimStart().startsWith(">");
  const commandText = commandQuery ? localValue.trimStart().slice(1).trim() : "";
  const commandMatches = useMemo(
    () =>
      commands
        .filter((command) => (command.scope ?? "global") === "global")
        .filter((command) =>
          t(command.labelKey).toLocaleLowerCase().includes(commandText.toLocaleLowerCase()),
        )
        .sort((a, b) => {
          const countDelta = (usageCounts[b.id] ?? 0) - (usageCounts[a.id] ?? 0);
          if (countDelta !== 0) return countDelta;
          return commands.indexOf(a) - commands.indexOf(b);
        }),
    [commandQuery, commandText, commands, t, usageCounts],
  );

  const showRecent = !localValue && recentList.length > 0;
  const showSuggests = !commandQuery && !!localValue && suggests.length > 0;
  const showCommands = commandQuery && commandMatches.length > 0;
  const showEmpty = !!localValue && !loading && !showCommands && !showSuggests;
  const hasContent = showRecent || showCommands || showSuggests || loading || showEmpty;

  // 获取当前可见的项
  const items = useMemo(() => {
    if (showRecent) return recentList;
    if (showCommands) return commandMatches;
    if (showSuggests) return suggests.map((s) => s.keyword);
    return [];
  }, [showRecent, recentList, showCommands, commandMatches, showSuggests, suggests]);

  const runCommand = useCallback(
    (commandId: ShortcutCommandId) => {
      incrementUsage(commandId);
      executeCommand(commandId);
      onClose();
    },
    [executeCommand, incrementUsage, onClose],
  );

  const handleSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setGlobalQuery(trimmed);
      addRecent(trimmed);
      smartRouter.replace(`/search?keywords=${encodeURIComponent(trimmed)}`);
      onClose();
    },
    [smartRouter, onClose, setGlobalQuery, addRecent],
  );

  // 打开时聚焦 + 通知 store
  useEffect(() => {
    if (isOpen) {
      setIsSearching(true);
      setLocalValue(persistedQuery || "");
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setIsSearching(false);
    }
  }, [isOpen, persistedQuery, setIsSearching]);

  // 防抖同步到全局
  useEffect(() => {
    const t = setTimeout(() => setGlobalQuery(localValue), 300);
    return () => clearTimeout(t);
  }, [localValue, setGlobalQuery]);

  // 防抖拉取 suggest
  useEffect(() => {
    if (!localValue.trim() || commandQuery) {
      setSuggests([]);
      setSelectedIndex(-1);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchSuggest(localValue.trim(), getStoredMusicCookie());
        const newSuggests = res.data?.data?.suggests ?? [];
        setSuggests(newSuggests);
        setSelectedIndex(newSuggests.length > 0 ? 0 : -1);
      } catch {
        setSuggests([]);
        setSelectedIndex(-1);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [commandQuery, localValue]);

  useLayoutEffect(() => {
    if (selectedIndex < 0) return;
    const container = candidateListRef.current;
    const candidate = candidateRefs.current.get(selectedIndex);
    if (!container || !candidate) return;

    const candidateTop = candidate.offsetTop;
    const candidateBottom = candidateTop + candidate.offsetHeight;
    const visibleTop = container.scrollTop;
    const visibleBottom = visibleTop + container.clientHeight;
    if (candidateTop >= visibleTop && candidateBottom <= visibleBottom) return;

    const targetTop =
      candidateTop < visibleTop ? candidateTop : candidateBottom - container.clientHeight;
    container.scrollTop = targetTop;
  }, [selectedIndex]);

  // 键盘导航处理
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          const selected = items[selectedIndex];
          if (commandQuery && typeof selected !== "string") runCommand(selected.id);
          else if (typeof selected === "string") handleSearch(selected);
        } else {
          if (commandQuery) {
            if (commandMatches[0]) runCommand(commandMatches[0].id);
          } else handleSearch(localValue);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [
      isOpen,
      items,
      selectedIndex,
      commandQuery,
      commandMatches,
      runCommand,
      handleSearch,
      localValue,
      onClose,
    ],
  );

  // Esc 关闭 (保持原有的全局监听以防 input 没聚焦时也没法关)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = useCallback((keyword: string) => {
    setLocalValue(keyword);
    // setGlobalQuery(keyword);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue("");
    setSuggests([]);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── 背景遮罩 ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* ── 弹窗主体 ── */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="no-scrollbar fixed top-[14vh] left-1/2 z-50 w-full max-w-2xl -translate-x-1/2 px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                "overflow-hidden rounded-2xl",
                "bg-white/[0.07] backdrop-blur-2xl",
                "border border-white/12",
                "shadow-[0_32px_64px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]",
              )}
            >
              {/* ── 输入行 ── */}
              <div className="flex items-center gap-3 px-5 py-4">
                <Search className="size-5 shrink-0 text-zinc-400" />
                <input
                  ref={inputRef}
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    "flex-1 border-none bg-transparent outline-none",
                    "text-base font-medium text-white placeholder:text-white/40",
                    "caret-[#1ed760]",
                  )}
                  onKeyDown={handleKeyDown}
                />

                {localValue && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => {
                      handleClear();
                    }}
                    className="shrink-0 rounded-full p-1.5 transition-colors hover:bg-white/10"
                  >
                    <X className="size-3.5 text-zinc-400" />
                  </motion.button>
                )}

                {/* Enter 提示徽章 */}
                <button
                  onClick={() => {
                    if (commandQuery) {
                      if (commandMatches[0]) runCommand(commandMatches[0].id);
                    } else handleSearch(localValue);
                  }}
                  disabled={!localValue.trim() || (commandQuery && !commandMatches.length)}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5",
                    "text-[11px] font-semibold text-white/70",
                    "border border-white/15 bg-white/10",
                    "transition-all hover:bg-white/20 hover:text-white",
                    "disabled:cursor-not-allowed disabled:opacity-30",
                  )}
                >
                  <CornerDownLeft className="size-3.5" />
                </button>
              </div>

              {/* ── 分割线（有内容时才显示）── */}
              {hasContent && <div className="mx-5 h-px bg-white/8" />}

              {/* ── 内容区 ── */}
              {hasContent && (
                <div
                  ref={candidateListRef}
                  className="no-scrollbar max-h-[52vh] overflow-y-auto py-2"
                >
                  {/* 最近搜索 */}
                  {showRecent && (
                    <div>
                      <div className="flex items-center justify-between px-5 py-2">
                        <span className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
                          {t("search.modal.recentSearches")}
                        </span>
                        <button
                          onClick={() => useSearchStore.getState().clearRecent()}
                          className="text-[11px] font-medium text-zinc-400 transition-colors hover:text-white"
                        >
                          {t("common.action.clearAll")}
                        </button>
                      </div>
                      {recentList.slice(0, 8).map((item, i) => (
                        <motion.div
                          key={item}
                          ref={(node) => {
                            if (node) candidateRefs.current.set(i, node);
                            else candidateRefs.current.delete(i);
                          }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleSearch(item)}
                          className={cn(
                            "group/item flex items-center justify-between gap-3 px-5 py-2.5",
                            "cursor-pointer hover:bg-white/6",
                            selectedIndex === i && "bg-white/10",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            {/* 首字母头像 */}
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8">
                              <span className="text-sm font-semibold text-zinc-300">
                                {item.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-medium text-white">
                                {item}
                              </span>
                              <span className="text-[11px] text-zinc-400">
                                {t("search.modal.recentSearch")}
                              </span>
                            </div>
                          </div>
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRecent(item);
                            }}
                            className="shrink-0 rounded-full p-1.5 opacity-0 transition-all group-hover/item:opacity-100 hover:bg-white/10"
                          >
                            <X className="size-3 text-zinc-400 hover:text-white" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* 加载中 */}
                  {loading && (
                    <div className="flex items-center justify-center py-6">
                      <div className="size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
                    </div>
                  )}

                  {/* 命令列表 */}
                  {commandQuery && (
                    <div>
                      <div className="px-5 py-2">
                        <span className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
                          {t("shortcuts.commandPalette.title")}
                        </span>
                      </div>
                      {commandMatches.map((command, i) => (
                        <motion.button
                          key={command.id}
                          type="button"
                          ref={(node) => {
                            if (node) candidateRefs.current.set(i, node);
                            else candidateRefs.current.delete(i);
                          }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{ delay: i * 0.025 }}
                          onClick={() => runCommand(command.id)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-5 py-2.5 text-left",
                            "cursor-pointer hover:bg-white/6",
                            selectedIndex === i && "bg-white/10",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Command className="size-3.5 shrink-0 text-[#1ed760]" />
                            <span className="truncate text-sm text-white">
                              {t(command.labelKey)}
                            </span>
                          </div>
                          {command.binding ? (
                            <kbd className="shrink-0 text-xs text-zinc-500">
                              {getShortcutBindingLabel(command.binding)}
                            </kbd>
                          ) : null}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  {/* 建议列表 */}
                  {showSuggests && (
                    <div>
                      <div className="px-5 py-2">
                        <span className="text-[11px] font-bold tracking-wider text-zinc-300 uppercase">
                          {t("search.modal.relatedSuggestions")}
                        </span>
                      </div>
                      {suggests.map((item, i) => (
                        <motion.div
                          key={i}
                          ref={(node) => {
                            if (node) candidateRefs.current.set(i, node);
                            else candidateRefs.current.delete(i);
                          }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{
                            opacity: 1,
                            x: 0,
                          }}
                          transition={{ delay: i * 0.025 }}
                          onClick={() => handleSearch(item.keyword)}
                          className={cn(
                            "flex items-center justify-between gap-3 px-5 py-2.5",
                            "cursor-pointer hover:bg-white/6",
                            selectedIndex === i && "bg-white/10",
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <Search className="size-3.5 shrink-0 text-zinc-400" />
                            <span className="truncate text-sm">
                              <HighlightText raw={item.highLightInfo} />
                            </span>
                          </div>
                          <SuggestTag item={item} />
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* 无结果 */}
                  {showEmpty && (
                    <div className="py-8 text-center text-sm text-zinc-400">
                      {t("search.modal.noResults")}
                    </div>
                  )}
                </div>
              )}

              {/* ── 底部提示栏 ── */}
              <div className="flex items-center gap-5 border-t border-white/10 bg-black/30 px-5 py-3 text-xs">
                <div className="flex items-center gap-1.5 font-medium text-white/80">
                  <kbd className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-xs">
                    ↑↓
                  </kbd>
                  <span>{t("common.action.select")}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-white/80">
                  <kbd className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-xs">
                    ↵
                  </kbd>
                  <span>{t("common.action.search")}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-white/80">
                  <kbd className="rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-white shadow-xs">
                    Ctrl + K
                  </kbd>
                  <span>{t("common.action.close")}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
