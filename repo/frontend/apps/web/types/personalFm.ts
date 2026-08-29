import type { PlaybackNextSource } from "@/types/player";

export type PersonalFmModeId =
  "DEFAULT" | "FAMILIAR" | "EXPLORE" | "SCENE_RCMD" | "PUZZLE_MODE_RCMD";

export type PersonalFmSceneCategory = "mood" | "activity" | "genre" | "language";

export interface PersonalFmSelection {
  mode: PersonalFmModeId;
  scene: string | null;
}

export type PersonalFmStatus = "idle" | "loading" | "active" | "error";

export interface PersonalFmStore {
  advance: (source?: PlaybackNextSource) => Promise<void>;
  error: string | null;
  selection: PersonalFmSelection;
  setSelection: (selection: PersonalFmSelection) => Promise<boolean>;
  start: () => Promise<boolean>;
  status: PersonalFmStatus;
}
