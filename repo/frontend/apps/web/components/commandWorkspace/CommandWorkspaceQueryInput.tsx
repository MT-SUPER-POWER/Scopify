"use client";

import { Search, X } from "lucide-react";
import { type KeyboardEvent, useMemo, useState } from "react";
import { CommandWorkspaceFilterPicker } from "@/components/commandWorkspace/CommandWorkspaceFilterPicker";
import { COMMAND_WORKSPACE_SEARCH_FILTERS } from "@/constants/commandWorkspace";
import type {
  CommandWorkspaceQueryInputProps,
  CommandWorkspaceSearchFilter,
} from "@/types/commandWorkspace";

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
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerIndex, setPickerIndex] = useState(0);
  const [pickerQuery, setPickerQuery] = useState("");
  const filters = useMemo(
    () =>
      COMMAND_WORKSPACE_SEARCH_FILTERS.filter((candidate) =>
        `${candidate.token} ${candidate.label}`.includes(pickerQuery.toLowerCase()),
      ),
    [pickerQuery],
  );

  const closePicker = () => {
    setIsPickerOpen(false);
    setPickerQuery("");
    setPickerIndex(0);
  };

  const chooseFilter = (nextFilter: CommandWorkspaceSearchFilter) => {
    onFilterChange(nextFilter);
    closePicker();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (isPickerOpen) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setPickerIndex((index) => (filters.length ? (index + 1) % filters.length : 0));
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setPickerIndex((index) =>
          filters.length ? (index - 1 + filters.length) % filters.length : 0,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const selected = filters[pickerIndex];
        if (!selected) return;
        event.preventDefault();
        chooseFilter(selected);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closePicker();
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        setPickerQuery((value) => value.slice(0, -1));
        return;
      }
      if (event.key.length === 1) {
        event.preventDefault();
        setPickerQuery((value) => value + event.key);
        return;
      }
    }

    if (event.key === "@" && !filter) {
      event.preventDefault();
      setIsPickerOpen(true);
      return;
    }
    if (event.key === "Backspace" && !query && filter) {
      event.preventDefault();
      onFilterChange(null);
      return;
    }
    onKeyDown?.(event);
  };

  return (
    <div className="relative flex items-center gap-3 px-5 py-4">
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
        ref={inputRef}
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
