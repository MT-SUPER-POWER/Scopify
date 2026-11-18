"use client";

import { getPersonalFmCommandSelection } from "@/lib/commandWorkspace/personalFmCommands";
import { usePersonalFmStore } from "@/store/module/personalFm";
import { useMemo } from "react";
import { toast } from "sonner";
import {
  DEFAULT_NEBBIA_TUNING,
  NEBBIA_BEHIND,
  NEBBIA_GLASS,
} from "@/components/lyrics/folia/src/components/visualizer/nebbia/types";
import { useProviderCapability } from "@/hooks/provider/useActiveProvider";
import { buildFoliaCommands, filterFoliaCommands } from "@/lib/commandWorkspace/foliaCommands";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useUiStore } from "@/store/module/ui";
import { useTranslation } from "react-i18next";

import type { FoliaCommandEntry, FoliaCommandGroup } from "@/types/lyrics/folia/commands";

function cycleOption<Element extends string>(choices: readonly Element[], current: Element) {
  return choices[(choices.indexOf(current) + 1) % choices.length] ?? current;
}

export function useFoliaCommands(group: FoliaCommandGroup | null, query: string) {
  const { t } = useTranslation();
  const nebbiaControls = useLyricStageStore((state) => state.mode === "nebbia");
  const hasFmModes = useProviderCapability("recommend.fm.modes");
  const catalog = useMemo(
    () => buildFoliaCommands(t, { personalFmModes: hasFmModes, nebbiaControls }),
    [t, hasFmModes, nebbiaControls],
  );
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
    if (action.kind === "lyric-toggle") {
      const lyrics = useLyricStageStore.getState();
      lyrics.patchSettings({ [action.setting]: !lyrics[action.setting] });
      return;
    }
    if (action.kind === "lyric-content") {
      useLyricStageStore.getState().patchSettings({
        subtitleContentMode: action.mode,
        showSubtitleTranslation: action.mode !== "none",
        hideTranslationSubtitle: false,
      });
      return;
    }
    if (action.kind === "nebbia-cycle") {
      const lyrics = useLyricStageStore.getState();
      if (lyrics.mode !== "nebbia") return;
      const tuning = lyrics.tunings.nebbia ?? DEFAULT_NEBBIA_TUNING;
      if (action.control === "behind") {
        const behind = cycleOption(NEBBIA_BEHIND, tuning.behind);
        lyrics.patchTuning("nebbia", { behind });
        toast.success(t(`folia.options.nebbiaBehind_${behind}`));
      } else {
        const glass = cycleOption(NEBBIA_GLASS, tuning.glass);
        lyrics.patchTuning("nebbia", { glass });
        toast.success(t(`folia.options.nebbiaGlass_${glass}`));
      }
      close();
      return;
    }
    close();
    const settings = useFoliaSettingsStore.getState();
    if (action.kind === "settings") settings.openVisualSettings(action.section);
    if (action.kind === "theme") settings.openThemeLibrary();
    if (action.kind === "visualizer")
      useLyricStageStore.getState().requestVisualizerMode(action.mode);
    if (action.kind === "stage-panel") {
      const ui = useUiStore.getState();
      if (!ui.isLyricsOpen) ui.setIsLyricsOpen(true);
      settings.setStagePanelOpen(true);
    }
  };
  return { catalog, entries, execute };
}
