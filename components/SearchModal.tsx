'use client';

import { motion, AnimatePresence } from "motion/react";
import { CornerDownLeft, Search, X } from "lucide-react";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchStore } from "@/store/module/search";
import { useSmartRouter } from '@/lib/hooks/useSmartRouter';
import { cn } from "@/lib/utils";
import { searchSuggest } from "@/lib/api/search";
import { HighlightText, SuggestItem, SuggestTag } from "./SearchContents/SearchHelper";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ MODAL ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const SearchModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const smartRouter = useSmartRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const setGlobalQuery = useSearchStore((s) => s.setQuery);
  const setIsSearching = useSearchStore((s) => s.setIsSearching);
  const addRecent = useSearchStore((s) => s.addRecent);
  const removeRecent = useSearchStore((s) => s.removeRecent);
  const persistedQuery = useSearchStore((s) => s.query);
  const recentList = useSearchStore((s) => s.recent);
  const placeholder = useSearchStore((s) => s.placeholder);

  const [localValue, setLocalValue] = useState(persistedQuery || "");
  const [suggests, setSuggests] = useState<SuggestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const showRecent = !localValue && recentList.length > 0;
  const showSuggests = !!localValue && suggests.length > 0;
  const showEmpty = !!localValue && !loading && suggests.length === 0;
  const hasContent = showRecent || showSuggests || loading || showEmpty;

  // 获取当前可见的项
  const items = useMemo(() => {
    if (showRecent) return recentList;
    if (showSuggests) return suggests.map(s => s.keyword);
    return [];
  }, [showRecent, recentList, showSuggests, suggests]);

  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setGlobalQuery(trimmed);
    addRecent(trimmed);
    smartRouter.replace(`/search?keywords=${encodeURIComponent(trimmed)}`);
    onClose();
  }, [smartRouter, onClose, setGlobalQuery, addRecent]);

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
    if (!localValue.trim()) {
      setSuggests([]);
      setSelectedIndex(-1);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchSuggest(localValue.trim());
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
  }, [localValue]);

  // 键盘导航处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        const selected = items[selectedIndex];
        handleSearch(selected);
      } else {
        handleSearch(localValue);
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [isOpen, items, selectedIndex, handleSearch, localValue, onClose]);

  // Esc 关闭 (保持原有的全局监听以防 input 没聚焦时也没法关)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSelect = useCallback((keyword: string) => {
    setLocalValue(keyword);
    // setGlobalQuery(keyword);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // 核心：自定义单击/双击判定拦截器
  // 发现双击跳转有点反直觉，就还是单机跳转好了
  // ─────────────────────────────────────────────────────────────────
  const clickTimeoutRef = useRef<number | null>(null);

  const handleItemClick = useCallback((keyword: string) => {
    if (clickTimeoutRef.current) {
      // 250ms 内触发了第二次点击 -> 判定为【双击】，直接搜索跳转
      window.clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      handleSearch(keyword);
    } else {
      // 第一次点击 -> 开启 250ms 定时器
      clickTimeoutRef.current = window.setTimeout(() => {
        // 超时未触发第二次点击 -> 判定为【单击】，填入输入框
        handleSelect(keyword);
        clickTimeoutRef.current = null;
      }, 250);
    }
  }, [handleSearch, handleSelect]);

  // 组件卸载时清理定时器，防止内存泄漏
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
    };
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
            className="fixed left-1/2 top-[14vh] z-50 w-full max-w-2xl -translate-x-1/2 px-4 no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={cn(
              // 亚克力玻璃感核心：半透明背景 + 强模糊 + 微亮边框
              "rounded-2xl overflow-hidden",
              "bg-white/[0.07] backdrop-blur-2xl",
              "border border-white/12",
              "shadow-[0_32px_64px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.1)]",
            )}>

              {/* ── 输入行 ── */}
              <div className="flex items-center gap-3 px-5 py-4">
                <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={localValue}
                  onChange={(e) => setLocalValue(e.target.value)}
                  placeholder={placeholder}
                  className={cn(
                    "flex-1 bg-transparent border-none outline-none",
                    "text-white text-base font-medium placeholder:text-zinc-500",
                    "caret-[#1ed760]"
                  )}
                  onKeyDown={handleKeyDown}
                />

                {localValue && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => { setLocalValue(""); setSuggests([]); }}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors shrink-0"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-400" />
                  </motion.button>
                )}

                {/* Enter 提示徽章 */}
                <button
                  onClick={() => handleSearch(localValue)}
                  disabled={!localValue.trim()}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1.5 rounded-lg shrink-0",
                    "text-[11px] font-semibold text-zinc-400",
                    "border border-white/10 bg-white/5",
                    "hover:bg-white/10 hover:text-white transition-all",
                    "disabled:opacity-30 disabled:cursor-not-allowed"
                  )}
                >
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ── 分割线（有内容时才显示）── */}
              {hasContent && (
                <div className="h-px bg-white/8 mx-5" />
              )}

              {/* ── 内容区 ── */}
              {hasContent && (
                <div className="max-h-[52vh] overflow-y-auto no-scrollbar py-2">

                  {/* 最近搜索 */}
                  {showRecent && (
                    <div>
                      <div className="flex items-center justify-between px-5 py-2">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Recent Searches
                        </span>
                        <button
                          onClick={() => useSearchStore.getState().clearRecent()}
                          className="text-[11px] text-zinc-500 hover:text-white transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                      {recentList.slice(0, 8).map((item, i) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          // onClick={() => handleItemClick(item)}
                          onClick={() => handleSearch(item)}
                          className={cn(
                            "group/item flex items-center justify-between gap-3 px-5 py-2.5",
                            "hover:bg-white/6 cursor-pointer transition-colors",
                            selectedIndex === i && "bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* 首字母头像 */}
                            <div className="w-9 h-9 rounded-full bg-white/8 border border-white/10
                              flex items-center justify-center shrink-0">
                              <span className="text-sm font-semibold text-zinc-300">
                                {item.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm text-white font-medium truncate">{item}</span>
                              <span className="text-[11px] text-zinc-500">Recent Search</span>
                            </div>
                          </div>
                          <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => { e.stopPropagation(); removeRecent(item); }}
                            className="opacity-0 group-hover/item:opacity-100 p-1.5 rounded-full
                              hover:bg-white/10 transition-all shrink-0"
                          >
                            <X className="w-3 h-3 text-zinc-500 hover:text-white" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* 加载中 */}
                  {loading && (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-4 h-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {/* 建议列表 */}
                  {showSuggests && (
                    <div>
                      <div className="px-5 py-2">
                        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                          Related Suggestions
                        </span>
                      </div>
                      {suggests.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.025 }}
                          // onClick={() => handleItemClick(item.keyword)}
                          onClick={() => handleSearch(item.keyword)}
                          className={cn(
                            "flex items-center justify-between gap-3 px-5 py-2.5",
                            "hover:bg-white/6 cursor-pointer transition-colors",
                            selectedIndex === i && "bg-white/10"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                            <span className="text-sm truncate">
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
                    <div className="py-8 text-center text-sm text-zinc-500">
                      没有找到相关内容
                    </div>
                  )}
                </div>
              )}

              {/* ── 底部提示栏 ── */}
              <div className="flex items-center gap-4 px-5 py-3 border-t border-white/6">
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↑↓</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">↵</kbd>
                  <span>Search</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono">Ctrl + K</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
