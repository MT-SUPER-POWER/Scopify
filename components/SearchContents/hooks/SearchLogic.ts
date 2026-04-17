import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { searchSuggest } from "@/lib/api/search";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { useSearchStore } from "@/store/module/search";
import type { SuggestItem } from "../SearchHelper";

interface UseSearchLogicProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose?: () => void; // 触发搜索或按 Esc 时的回调（关闭弹窗或下拉）
  isActive?: boolean; // 组件是否处于激活状态 (例如 Modal isOpen)
}

export function useSearchLogic({ inputRef, onClose, isActive = true }: UseSearchLogicProps) {
  const smartRouter = useSmartRouter();

  const persistedQuery = useSearchStore((s) => s.query);
  const setGlobalQuery = useSearchStore((s) => s.setQuery);
  const addRecent = useSearchStore((s) => s.addRecent);
  const removeRecent = useSearchStore((s) => s.removeRecent);
  const recentList = useSearchStore((s) => s.recent);
  const placeholder = useSearchStore((s) => s.placeholder);

  const [localValue, setLocalValue] = useState(persistedQuery || "");
  const [suggests, setSuggests] = useState<SuggestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // 派生状态计算
  const showRecent = !localValue && recentList.length > 0;
  const showSuggests = !!localValue && suggests.length > 0;
  const showEmpty = !!localValue && !loading && suggests.length === 0;
  const hasContent = showRecent || showSuggests || loading || showEmpty;

  // 用于键盘导航的一维数组映射
  const items = useMemo(() => {
    if (showRecent) return recentList;
    if (showSuggests) return suggests.map((s) => s.keyword);
    return [];
  }, [showRecent, recentList, showSuggests, suggests]);

  // ─────────────────────────────────────────────────────────────────
  // 1. 数据同步与请求 (防抖)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isActive && persistedQuery !== localValue) setLocalValue(persistedQuery);
  }, [persistedQuery, isActive, localValue]);

  useEffect(() => {
    if (!isActive) return;
    const t = setTimeout(() => setGlobalQuery(localValue), 300);
    return () => clearTimeout(t);
  }, [localValue, setGlobalQuery, isActive]);

  useEffect(() => {
    if (!isActive) return;
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
  }, [localValue, isActive]);

  // ─────────────────────────────────────────────────────────────────
  // 2. 行为拦截与处理 (单击/双击)
  // ─────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(
    (keyword?: string) => {
      const trimmed = (keyword ?? localValue).trim();
      const query = trimmed || placeholder;
      if (!query) return;
      if (trimmed) addRecent(trimmed);

      inputRef.current?.blur();
      smartRouter.replace(`/search?keywords=${encodeURIComponent(query)}`);
      onClose?.();
    },
    [localValue, placeholder, addRecent, smartRouter, onClose, inputRef],
  );

  const handleSelect = useCallback(
    (keyword: string) => {
      setLocalValue(keyword);
      setTimeout(() => inputRef.current?.focus(), 0);
    },
    [inputRef],
  );

  const clickTimeoutRef = useRef<number | null>(null);

  const handleItemClick = useCallback(
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

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) window.clearTimeout(clickTimeoutRef.current);
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // 3. 键盘导航
  // ─────────────────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isActive) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          handleSearch(items[selectedIndex]);
        } else {
          handleSearch(localValue);
        }
      } else if (e.key === "Escape") {
        onClose?.();
      }
    },
    [isActive, items, selectedIndex, handleSearch, localValue, onClose],
  );

  // 开放给 UI 层的状态和方法
  return {
    localValue,
    setLocalValue,
    suggests,
    setSuggests,
    loading,
    selectedIndex,
    placeholder,
    recentList,
    removeRecent,
    showRecent,
    showSuggests,
    showEmpty,
    hasContent,
    handleSearch,
    handleItemClick,
    handleKeyDown,
  };
}
