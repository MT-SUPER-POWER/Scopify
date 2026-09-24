"use client";

import { Search, X } from "lucide-react";
import { CommandWorkspaceFilterPicker } from "@/components/commandWorkspace/CommandWorkspaceFilterPicker";
import { useCommandWorkspaceQueryInput } from "@/hooks/commandWorkspace/useCommandWorkspaceQueryInput";
import type { CommandWorkspaceQueryInputProps } from "@/types/commandWorkspace";

export function CommandWorkspaceQueryInput({
  autoFocus = false,
  filter,
  inputRef,
  onFilterChange,
  onKeyDown,
  onQueryChange,
  placeholder,
  query,
}: CommandWorkspaceQueryInputProps) {
  const {
    resolvedInputRef,
    isPickerOpen,
    pickerIndex,
    filters,
    closePicker,
    chooseFilter,
    handleEscape,
    handleKeyDown,
  } = useCommandWorkspaceQueryInput({
    filter,
    inputRef,
    onFilterChange,
    onKeyDown,
    onQueryChange,
    placeholder,
    query,
  });

  return (
    <div
      className="relative flex items-center gap-3 px-5 py-4"
      onKeyDownCapture={handleEscape}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closePicker();
      }}
    >
      <Search className="size-5 shrink-0 text-zinc-400" />
      {filter ? (
        <button
          type="button"
          onClick={() => onFilterChange(null)}
          className="flex shrink-0 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white"
        >
          {filter.token}
          <X className="size-3" />
        </button>
      ) : null}
      <input
        ref={resolvedInputRef}
        autoFocus={autoFocus}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isPickerOpen ? "选择搜索分类" : placeholder}
        className="min-w-0 flex-1 border-none bg-transparent text-base font-medium text-white outline-none placeholder:text-white/40"
      />
      {query ? (
        <button
          type="button"
          onClick={() => onQueryChange("")}
          className="shrink-0 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="清空搜索"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
      {isPickerOpen ? (
        <CommandWorkspaceFilterPicker
          filters={filters}
          onChoose={chooseFilter}
          selectedIndex={pickerIndex}
        />
      ) : null}
    </div>
  );
}
