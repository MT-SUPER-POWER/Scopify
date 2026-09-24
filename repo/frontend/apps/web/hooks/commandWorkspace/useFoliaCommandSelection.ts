"use client";

import { useShallow } from "zustand/react/shallow";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaCommandEntry } from "@/types/foliaCommands";

export function useFoliaCommandSelection(entries: FoliaCommandEntry[]) {
  return useLyricStageStore(
    useShallow((state) =>
      entries.map(({ action }) => {
        if (action.kind === "visualizer") return action.mode === state.mode;
        if (action.kind === "lyric-toggle")
          return action.inverted ? !state[action.setting] : state[action.setting];
        if (action.kind === "lyric-content")
          return !state.hideTranslationSubtitle && action.mode === state.subtitleContentMode;
        return false;
      }),
    ),
  );
}
