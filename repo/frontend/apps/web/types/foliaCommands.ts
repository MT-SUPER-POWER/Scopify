import type { PersonalFmModeId, PersonalFmSceneCategory } from "@/types/personalFm";
import type { FoliaStageEditSection } from "@/types/foliaStage";
import type { LyricVisualizerMode } from "@/types/lyrics";

export type FoliaCommandGroup =
  "folia-settings" | "folia-visual-settings" | "folia-visualizers" | "personal-fm";
export type FoliaCommandAction =
  | { kind: "group"; group: FoliaCommandGroup }
  | { kind: "settings"; section: FoliaStageEditSection }
  | {
      kind: "personal-fm";
      mode: PersonalFmModeId;
      scene?: string;
      category: "mode" | PersonalFmSceneCategory;
    }
  | { kind: "theme" }
  | { kind: "visualizer"; mode: LyricVisualizerMode };

export interface FoliaCommandEntry {
  id: string;
  parentId: FoliaCommandGroup | null;
  label: string;
  summary: string;
  keywords: string;
  path: string;
  action: FoliaCommandAction;
}

export interface FoliaCommandListProps {
  entries: FoliaCommandEntry[];
  selectedIndex: number;
  onSelect(entry: FoliaCommandEntry): void;
  onHighlight?(index: number): void;
  showPath?: boolean;
}

export interface CommandWorkspaceFoliaProps {
  group: FoliaCommandGroup;
  onNavigate(group: FoliaCommandGroup): void;
  onBack(): void;
  onClose(): void;
}
