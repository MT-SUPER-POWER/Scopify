"use client";

import { Clock, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { searchDefault, searchSuggest } from "@/lib/api/search";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { getStoredMusicCookie } from "@/lib/web/auth";
import { useI18n } from "@/store/module/i18n";
import { useSearchStore } from "@/store/module/search";
import { HighlightText, type SuggestItem, SuggestTag } from "./SearchHelper";

const NAV_BTN = "bg-surface-sunken/80 hover:bg-surface-elevated";
const GLASS = cn(
  "bg-surface-overlay/90 backdrop-blur-2xl",
  "border border-border",
  "shadow-floating",
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SEARCH COMPONENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function HeaderSearch() {
  const { t } = useI18n();
  const smartRouter = useSmartRouter();
  const intervalRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const clickTimeoutRef = useRef<number | null>(null);

  const addRecent = useSearchStore((s) => s.addRecent);
  const recentList = useSearchStore((s) => s.recent);
  const removeRecent = useSearchStore((s) => s.removeRecent);
  const persistedQuery = useSearchStore((s) => s.query);
  const setGlobalQuery = useSearchStore((s) => s.setQuery);
  const isSearching = useSearchStore((s) => s.isSearching);
  const placeholder = useSearchStore((s) => s.placeholder);
  const setStorePlaceholder = useSearchStore((s) => s.setPlaceholder);

  const [localValue, setLocalValue] = useState(persistedQuery || "");
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const [suggests, setSuggests] = useState<SuggestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // 客户端检测系统，替代 node:os
  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.userAgent));
  }, []);

  // 同步全局状态到本地
  useEffect(() => {
    setLocalValue(persistedQuery);
  }, [persistedQuery]);

  // 输入防抖同步到全局
  useEffect(() => {
    const t = setTimeout(() => setGlobalQuery(localValue), 300);
    return () => clearTimeout(t);
  }, [localValue, setGlobalQuery]);

  // 请求搜索建议
  useEffect(() => {
    if (!localValue.trim()) {
      setSuggests([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchSuggest(localValue.trim(), getStoredMusicCookie());
        setSuggests(res.data?.data?.suggests ?? []);
      } catch {
        setSuggests([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [localValue]);

  // 轮播默认热搜
  useEffect(() => {
    let isActive = true;
    const fetchHot = async () => {
      try {
        const res = await searchDefault(getStoredMusicCookie());
        if (!isActive) return;
        const kws = res.data?.data.algWords.map((w: { keyword: string }) => w.keyword) || [];
        if (!kws.length) return;
        let idx = 0;
        if (!localValue && !isSearching) setStorePlaceholder(kws[0]);
        const iv = setInterval(() => {
          if (!localValue && !isSearching) {
            idx = (idx + 1) % kws.length;
            setStorePlaceholder(kws[idx]);
          }
        }, 10000);
        intervalRef.current = iv as unknown as number;
      } catch (e) {
        console.error(e);
      }
    };
    fetchHot();
    return () => {
      isActive = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [localValue, isSearching, setStorePlaceholder]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = useCallback(
    (keyword?: string) => {
      const trimmed = (keyword ?? localValue).trim();
      const query = trimmed || placeholder;
      if (!query) return;
      if (trimmed) addRecent(trimmed);
      setOpen(false);
      setFocused(false);
      inputRef.current?.blur();
      smartRouter.replace(`/search?keywords=${encodeURIComponent(query)}`);
    },
    [localValue, placeholder, addRecent, smartRouter],
  );

  const handleSelect = useCallback(
    (keyword: string) => {
      setLocalValue(keyword);
      setGlobalQuery(keyword);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [setGlobalQuery],
  );

  // 单双击拦截器
  const _handleItemClick = useCallback(
    (keyword: string) => {
      if (clickTimeoutRef.current) {
        window.clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
        handleSearch(keyword);
      } else {
        clickTimeoutRef.current = window.setTimeout(() => {
          handleSelect(keyword);
          clickTimeoutRef.current = null;
        }, 250);
      }
    },
    [handleSearch, handleSelect],
  );

  const showRecent = !localValue && recentList.length > 0;
  const showSuggests = !!localValue && suggests.length > 0;
  const showEmpty = !!localValue && !loading && suggests.length === 0;
  const dropdownVisible = open && (showRecent || showSuggests || loading || showEmpty);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      {/* ── 搜索输入框 ── */}
      <div
        className={cn(
          "group relative flex h-11 items-center gap-3 px-5 transition-all duration-200",
          !focused && !dropdownVisible && `${NAV_BTN} rounded-full border border-transparent`,
          (focused || dropdownVisible) && GLASS,
          dropdownVisible
            ? "border-border rounded-t-2xl rounded-b-none border-b"
            : focused && "rounded-full",
        )}
      >
        <Search
          className={cn(
            "size-4 shrink-0 transition-colors",
            focused ? "text-content-muted" : "text-content-subtle group-hover:text-content-muted",
          )}
        />

        <input
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              if (!wrapperRef.current?.contains(document.activeElement)) setFocused(false);
            }, 100);
          }}
          className="text-content caret-brand placeholder:text-content-subtle flex-1 border-none bg-transparent text-sm font-medium transition-all outline-none"
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
            if (e.key === "Escape") {
              setOpen(false);
              setFocused(false);
              inputRef.current?.blur();
            }
          }}
        />

        {localValue ? (
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setLocalValue("");
              setSuggests([]);
            }}
            className="hover:bg-accent shrink-0 rounded-full p-1 transition-colors"
          >
            <X className="text-content-subtle hover:text-content size-3.5" />
          </button>
        ) : (
          <div className="bg-surface-elevated border-border text-content-subtle hidden shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold lg:flex">
            <span>{isMac ? "⌘" : "Ctrl"}</span>
            <span>K</span>
          </div>
        )}
      </div>

      {/* ── 下坠面板 ── */}
      <AnimatePresence>
        {dropdownVisible && (
          <motion.div
            initial={{ opacity: 0, y: -4, scaleY: 0.97 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -3, scaleY: 0.98 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "top" }}
            className={cn(
              "absolute inset-x-0 top-full z-50 overflow-hidden",
              GLASS,
              "rounded-t-none rounded-b-2xl border-t-0 pt-2",
            )}
          >
            {/* 最近搜索 */}
            {showRecent && (
              <>
                <div className="flex items-center justify-between px-5 pt-2 pb-1">
                  <span className="text-content-subtle mb-1 text-[11px] font-semibold tracking-widest uppercase">
                    {t("search.modal.recentSearches")}
                  </span>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => useSearchStore.getState().clearRecent()}
                    className="text-content-subtle hover:text-content-muted text-xs transition-colors"
                  >
                    {t("common.action.clearAll")}
                  </button>
                </div>
                {recentList.slice(0, 8).map((item: string, i: number) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onMouseDown={(e) => e.preventDefault()}
                    // onClick={() => handleItemClick(item)}
                    onClick={() => handleSearch(item)}
                    className="hover:bg-accent group/item flex cursor-pointer items-center justify-between gap-3 px-5 py-3 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Clock className="text-content-subtle size-4 shrink-0" />
                      <span className="text-content-muted truncate text-[15px]">{item}</span>
                    </div>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(item);
                      }}
                      className="hover:bg-accent shrink-0 rounded-full p-1.5 opacity-0 transition-all group-hover/item:opacity-100"
                    >
                      <X className="text-content-subtle hover:text-content size-3.5" />
                    </button>
                  </motion.div>
                ))}
              </>
            )}

            {/* 加载状态 */}
            {loading && (
              <div className="flex items-center justify-center py-6">
                <div className="border-input border-t-content-muted size-4 animate-spin rounded-full border-2" />
              </div>
            )}

            {/* 建议列表 */}
            {showSuggests && (
              <>
                <div className="px-5 pb-1">
                  <span className="text-content-subtle text-xs font-semibold tracking-widest uppercase">
                    {t("search.modal.relatedSuggestions")}
                  </span>
                </div>
                {suggests.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    onMouseDown={(e) => e.preventDefault()}
                    // onClick={() => handleItemClick(item.keyword)}
                    onClick={() => handleSearch(item.keyword)}
                    className="hover:bg-accent flex cursor-pointer items-center justify-between gap-3 px-5 py-3 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Search className="text-content-subtle size-4 shrink-0" />
                      <span className="truncate text-base">
                        <HighlightText raw={item.highLightInfo} />
                      </span>
                    </div>
                    <SuggestTag item={item} />
                  </motion.div>
                ))}
              </>
            )}

            {/* 空状态 */}
            {showEmpty && (
              <div className="text-content-subtle py-6 text-center text-sm">
                No relevant content found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
