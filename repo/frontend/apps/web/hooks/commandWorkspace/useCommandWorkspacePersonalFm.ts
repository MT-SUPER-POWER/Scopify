"use client";

import { type KeyboardEvent, useState } from "react";
import {
  getPersonalFmSelectionLabel,
  isPersonalFmPlaybackSource,
  PERSONAL_FM_SCENE_CATEGORY_LABELS,
} from "@/constants/personalFm";
import { useFoliaCommands } from "@/hooks/commandWorkspace/useFoliaCommands";
import {
  getPersonalFmCommandSelection,
  isPersonalFmCommand,
} from "@/lib/commandWorkspace/personalFmCommands";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { usePlayerStore } from "@/store/module/player";
import { useI18n } from "@/store/module/i18n";
import type {
  PersonalFmCommandEntry,
  PersonalFmCommandGroup,
} from "@/types/commandWorkspacePersonalFm";

export function useCommandWorkspacePersonalFm(onBack: () => void) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showHelp, setShowHelp] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const { entries: candidates } = useFoliaCommands("personal-fm", query);
  const entries = candidates.filter(isPersonalFmCommand);
  const selection = usePersonalFmStore((state) => state.selection);
  const isLoading = usePersonalFmStore((state) => state.status === "loading");
  const error = usePersonalFmStore((state) => state.error);
  const isActive = usePlayerStore((state) => isPersonalFmPlaybackSource(state.playlistId));
  const select = (entry: PersonalFmCommandEntry) => {
    const fm = usePersonalFmStore.getState();
    if (fm.status !== "loading")
      void fm.setSelection(getPersonalFmCommandSelection(entry.action, fm.selection));
  };
  const groups: PersonalFmCommandGroup[] = (
    ["mode", "mood", "activity", "genre", "language"] as const
  )
    .map((id) => ({
      id,
      label: t(
        id === "mode" ? "personalFm.settings.modeLabel" : PERSONAL_FM_SCENE_CATEGORY_LABELS[id],
      ),
      entries: entries.filter((entry) => entry.action.category === id),
    }))
    .filter((group) => group.entries.length > 0);
  const back = () => (showQueue ? setShowQueue(false) : onBack());
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Backspace" && !query) {
      event.preventDefault();
      back();
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) =>
        entries.length
          ? index < 0
            ? event.key === "ArrowDown"
              ? 0
              : entries.length - 1
            : (index + (event.key === "ArrowDown" ? 1 : entries.length - 1)) % entries.length
          : -1,
      );
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const entry = entries[selectedIndex < 0 ? 0 : selectedIndex];
      if (entry) select(entry);
    }
  };
  return {
    t,
    query,
    groups,
    selection,
    isLoading,
    isActive,
    error,
    showQueue,
    showHelp,
    back,
    select,
    handleKeyDown,
    selectionLabel: getPersonalFmSelectionLabel(selection, t),
    highlightedId: entries[selectedIndex]?.id,
    setQuery: (value: string) => {
      setQuery(value);
      setSelectedIndex(value.trim() ? 0 : -1);
    },
    toggleHelp: () => setShowHelp((value) => !value),
    openQueue: () => setShowQueue(true),
    start: () => {
      if (usePersonalFmStore.getState().status !== "loading")
        void usePersonalFmStore.getState().start();
    },
  };
}
