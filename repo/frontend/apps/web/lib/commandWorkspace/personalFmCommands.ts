import {
  PERSONAL_FM_MODES,
  PERSONAL_FM_SCENES,
  PERSONAL_FM_SCENE_CATEGORY_LABELS,
} from "@/constants/personalFm";
import type { FoliaCommandEntry } from "@/types/foliaCommands";
import type {
  PersonalFmCommandAction,
  PersonalFmCommandEntry,
} from "@/types/commandWorkspacePersonalFm";
import type { PersonalFmSelection } from "@/types/personalFm";
import type { TranslateFn } from "@/types/i18n.generated";

export function buildPersonalFmCommands(t: TranslateFn): Omit<FoliaCommandEntry, "path">[] {
  return [
    {
      id: "personal-fm",
      parentId: null,
      label: t("personalFm.settings.title"),
      summary: "模式、情绪、场景、曲风与语种",
      keywords: "folia fm radio 私人电台 私人FM",
      action: { kind: "group", group: "personal-fm" },
    },
    ...PERSONAL_FM_MODES.map((mode) => ({
      id: `personal-fm-mode-${mode.id}`,
      parentId: "personal-fm" as const,
      label: t(mode.labelKey),
      summary: t("personalFm.settings.modeLabel"),
      keywords: `fm radio 私人电台 ${mode.id}`,
      action: { kind: "personal-fm" as const, mode: mode.id, category: "mode" as const },
    })),
    ...PERSONAL_FM_SCENES.map((scene) => ({
      id: `personal-fm-scene-${scene.id}`,
      parentId: "personal-fm" as const,
      label: t(scene.labelKey),
      summary: t(PERSONAL_FM_SCENE_CATEGORY_LABELS[scene.category]),
      keywords: `fm radio 私人电台 场景 ${scene.id}`,
      action: {
        kind: "personal-fm" as const,
        mode: "SCENE_RCMD" as const,
        scene: scene.id,
        category: scene.category,
      },
    })),
  ];
}

export function isPersonalFmCommand(entry: FoliaCommandEntry): entry is PersonalFmCommandEntry {
  return entry.action.kind === "personal-fm";
}

export function getPersonalFmCommandSelection(
  action: PersonalFmCommandAction,
  current: PersonalFmSelection,
): PersonalFmSelection {
  return {
    mode: action.mode,
    scene: action.mode === "SCENE_RCMD" ? (action.scene ?? current.scene ?? "FOCUS") : null,
  };
}

export function isPersonalFmCommandSelected(
  action: PersonalFmCommandAction,
  selection: PersonalFmSelection,
) {
  return selection.mode === action.mode && (!action.scene || selection.scene === action.scene);
}
