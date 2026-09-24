"use client";

import { getPersonalFmCommandSelection } from "@/lib/commandWorkspace/personalFmCommands";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { useMemo } from "react";
import { buildFoliaCommands, filterFoliaCommands } from "@/lib/commandWorkspace/foliaCommands";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useI18n } from "@/store/module/i18n";
import type { FoliaCommandEntry, FoliaCommandGroup } from "@/types/foliaCommands";

export function useFoliaCommands(group: FoliaCommandGroup | null, query: string) {
  const { t } = useI18n();
  const catalog = useMemo(() => buildFoliaCommands(t), [t]);
  const entries = useMemo(
    () => filterFoliaCommands(catalog, group, query),
    [catalog, group, query],
  );
  const execute = (
    entry: FoliaCommandEntry,
    navigate: (group: FoliaCommandGroup) => void,
    close: () => void,
  ) => {
    const action = entry.action;
    if (action.kind === "group") {
      navigate(action.group);
      return;
    }
    if (action.kind === "personal-fm") {
      navigate("personal-fm");
      const fm = usePersonalFmStore.getState();
      if (fm.status !== "loading")
        void fm.setSelection(getPersonalFmCommandSelection(action, fm.selection));
      return;
    }
    close();
    const settings = useFoliaSettingsStore.getState();
    if (action.kind === "settings") settings.openVisualSettings(action.section);
    if (action.kind === "theme") settings.openThemeLibrary();
    if (action.kind === "visualizer")
      useLyricStageStore.getState().requestVisualizerMode(action.mode);
  };
  return { catalog, entries, execute };
}
