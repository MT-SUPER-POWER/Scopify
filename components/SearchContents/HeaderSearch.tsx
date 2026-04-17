"use client";

import { Clock, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { searchDefault, searchSuggest } from "@/lib/api/search";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { cn } from "@/lib/utils";
import { useSearchStore } from "@/store/module/search";
import { HighlightText, type SuggestItem, SuggestTag } from "./SearchHelper";

const NAV_BTN = "bg-black/50 hover:bg-black/70";
const GLASS = cn(
  "bg-[#111]/80 backdrop-blur-2xl",
  "border border-white/[0.08]",
  "shadow-[0_20px_48px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)]",
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SEARCH COMPONENT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function HeaderSearch() {
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
        const res = await searchSuggest(localValue.trim());
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
        const res = await searchDefault();
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
          "group flex items-center gap-3 px-5 transition-all duration-200 relative h-11",
          !focused && !dropdownVisible && `${NAV_BTN} rounded-full border border-transparent`,
          (focused || dropdownVisible) && GLASS,
          dropdownVisible
            ? "rounded-t-2xl rounded-b-none border-b-white/3"
            : focused && "rounded-full",
        )}
      >
        <Search
          className={cn(
            "w-4 h-4 shrink-0 transition-colors",
            focused ? "text-zinc-400" : "text-zinc-500 group-hover:text-zinc-400",
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
          className="flex-1 bg-transparent border-none text-white text-sm font-medium
            outline-none placeholder:text-zinc-600 transition-all caret-[#1ed760]"
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
            className="p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5 text-zinc-500 hover:text-white" />
          </button>
        ) : (
          <div
            className="hidden lg:flex items-center gap-1 shrink-0 text-zinc-600
            border border-zinc-700/60 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-white/3"
          >
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
              "absolute top-full left-0 right-0 z-50 overflow-hidden",
              GLASS,
              "rounded-t-none rounded-b-2xl border-t-0 pt-2",
            )}
          >
            {/* 最近搜索 */}
            {showRecent && (
              <>
                <div className="flex items-center justify-between px-5 pb-1 pt-2">
                  <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">
                    Recent Searches
                  </span>
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => useSearchStore.getState().clearRecent()}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Clear All
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
                    className="group/item flex items-center justify-between gap-3 px-5 py-3
                      hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-[15px] text-zinc-300 truncate">{item}</span>
                    </div>
                    <button
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecent(item);
                      }}
                      className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-full
                        hover:bg-white/10 transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-zinc-500 hover:text-white" />
                    </button>
                  </motion.div>
                ))}
              </>
            )}

            {/* 加载状态 */}
            {loading && (
              <div className="flex items-center justify-center py-6">
                <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
              </div>
            )}

            {/* 建议列表 */}
            {showSuggests && (
              <>
                <div className="px-5 pb-1">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    Related Searches
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
                    className="flex items-center justify-between gap-3 px-5 py-3
                      hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span className="text-base truncate">
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
              <div className="py-6 text-center text-sm text-zinc-600">
                No relevant content found
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
