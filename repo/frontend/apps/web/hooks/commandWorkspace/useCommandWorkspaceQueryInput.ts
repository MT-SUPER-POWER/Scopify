"use client";

import { type KeyboardEvent, useMemo, useRef, useState } from "react";
import { COMMAND_WORKSPACE_SEARCH_FILTERS } from "@/constants/commandWorkspace";
import type {
  CommandWorkspaceQueryInputProps,
  CommandWorkspaceSearchFilter,
} from "@/types/commandWorkspace";

export function useCommandWorkspaceQueryInput({
  filter,
  inputRef,
  onFilterChange,
  onKeyDown,
  query,
}: CommandWorkspaceQueryInputProps) {
  const localInputRef = useRef<HTMLInputElement>(null);
  const resolvedInputRef = inputRef ?? localInputRef;
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
    resolvedInputRef.current?.focus();
  };
  // Capture Escape for the entire picker, including keyboard-focused choices.
  const handleEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isPickerOpen && event.key === "Escape" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.stopPropagation();
      closePicker();
      resolvedInputRef.current?.focus();
    }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.defaultPrevented) return;
    if (isPickerOpen) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setPickerIndex((index) =>
          filters.length
            ? (index + (event.key === "ArrowDown" ? 1 : filters.length - 1)) % filters.length
            : 0,
        );
        return;
      }
      if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        const selected = filters[pickerIndex];
        if (selected) chooseFilter(selected);
        return;
      }
      if (event.key === "Backspace") {
        event.preventDefault();
        if (!pickerQuery) closePicker();
        else {
          setPickerQuery((value) => value.slice(0, -1));
          setPickerIndex(0);
        }
        return;
      }
      if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        setPickerQuery((value) => value + event.key);
        setPickerIndex(0);
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
  return {
    resolvedInputRef,
    isPickerOpen,
    pickerIndex,
    filters,
    closePicker,
    chooseFilter,
    handleEscape,
    handleKeyDown,
  };
}
