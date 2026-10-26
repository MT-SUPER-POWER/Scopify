"use client";

import { ArrowUpRight, CornerDownLeft, LoaderCircle } from "lucide-react";
import { CommandWorkspaceQueryInput } from "@/components/commandWorkspace/CommandWorkspaceQueryInput";
import { CommandWorkspaceSearchResultList } from "@/components/commandWorkspace/CommandWorkspaceSearchResultList";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COMMAND_WORKSPACE_SEARCH_CATEGORY_HINT } from "@/constants/commandWorkspace";
import { useCommandWorkspaceSearch } from "@/hooks/commandWorkspace/useCommandWorkspaceSearch";
import type { CommandWorkspaceSearchProps } from "@/types/commandWorkspace";

export function CommandWorkspaceSearch(props: CommandWorkspaceSearchProps) {
  const {
    inputRef,
    filter,
    setFilter,
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    opensSearchPage,
    search,
    items,
    openSearchPage,
    selectItem,
    appendItem,
    insertItemNext,
  } = useCommandWorkspaceSearch(props);

  return (
    <>
      <CommandWorkspaceQueryInput
        autoFocus
        filter={filter}
        inputRef={inputRef}
        onFilterChange={(nextFilter) => {
          setFilter(nextFilter);
          setSelectedIndex(0);
        }}
        onQueryChange={(nextQuery) => {
          setQuery(nextQuery);
          setSelectedIndex(0);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSelectedIndex((index) => (items.length ? (index + 1) % items.length : 0));
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSelectedIndex((index) =>
              items.length ? (index - 1 + items.length) % items.length : 0,
            );
          }
          if (event.key === "Enter" && opensSearchPage) {
            event.preventDefault();
            openSearchPage();
            return;
          }
          if (event.key === "Enter" && items[selectedIndex]) {
            event.preventDefault();
            selectItem(items[selectedIndex]);
          }
        }}
        placeholder={`搜索${COMMAND_WORKSPACE_SEARCH_CATEGORY_HINT}`}
        query={query}
      />
      <div className="mx-5 h-px bg-white/8" />
      <ScrollArea className="h-[min(52vh,32rem)]">
        {!query.trim() ? (
          <p className="px-5 py-10 text-center text-sm text-zinc-500">
            输入关键词，或用 @ 筛选{COMMAND_WORKSPACE_SEARCH_CATEGORY_HINT}。
          </p>
        ) : opensSearchPage ? (
          <button
            type="button"
            onClick={openSearchPage}
            className="flex w-full items-center justify-between gap-3 px-5 py-6 text-left text-sm text-zinc-200 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <span>
              搜索{filter?.label}：{query.trim()}
            </span>
            <ArrowUpRight className="size-4 shrink-0" />
          </button>
        ) : search.loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-zinc-400">
            <LoaderCircle className="size-4 animate-spin" />
            正在搜索
          </div>
        ) : (
          <CommandWorkspaceSearchResultList
            items={items}
            selectedIndex={selectedIndex}
            onSelect={selectItem}
            onAppend={appendItem}
            onInsertNext={insertItemNext}
          />
        )}
      </ScrollArea>
      <footer className="flex items-center gap-2 border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-zinc-400">
        <CornerDownLeft className="size-3.5 text-zinc-300" />
        {opensSearchPage ? "Enter 查看搜索结果" : "Enter 播放歌曲 / 查看详情"}
        {!opensSearchPage ? <span className="ml-auto">+ 加入队列</span> : null}
      </footer>
    </>
  );
}
