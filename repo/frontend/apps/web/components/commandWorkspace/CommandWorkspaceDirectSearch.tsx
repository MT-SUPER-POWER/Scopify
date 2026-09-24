"use client";

import { CommandWorkspaceQueryInput } from "@/components/commandWorkspace/CommandWorkspaceQueryInput";
import { CommandWorkspaceDirectSearchResults } from "@/components/commandWorkspace/CommandWorkspaceDirectSearchResults";
import { useCommandWorkspaceDirectSearch } from "@/hooks/commandWorkspace/useCommandWorkspaceDirectSearch";
import type { CommandWorkspaceDirectSearchProps } from "@/types/commandWorkspace";

export function CommandWorkspaceDirectSearch(props: CommandWorkspaceDirectSearchProps) {
  const model = useCommandWorkspaceDirectSearch(props);
  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          props.onClose();
        }
      }}
    >
      <CommandWorkspaceQueryInput
        autoFocus
        filter={model.filter}
        inputRef={model.inputRef}
        onFilterChange={model.onFilterChange}
        onQueryChange={model.handleQueryChange}
        onKeyDown={model.handleKeyDown}
        placeholder={model.placeholder}
        query={model.query}
      />
      <div className="mx-5 h-px bg-white/8" />
      <CommandWorkspaceDirectSearchResults
        isLoading={model.isLoading}
        onClearRecent={model.clearRecent}
        onRemoveRecent={model.removeRecent}
        onSubmit={model.submit}
        query={model.query}
        recent={model.recent}
        selectedIndex={model.selectedIndex}
        suggestions={model.suggestions}
      />
      <footer className="flex items-center gap-2 border-t border-white/10 bg-black/20 px-5 py-3 text-xs text-zinc-400">
        <kbd className="rounded border border-white/15 bg-white/8 px-1.5 py-0.5 text-zinc-200">
          @
        </kbd>
        选择分类
        <span className="ml-auto">Enter 查看搜索结果</span>
      </footer>
    </div>
  );
}
