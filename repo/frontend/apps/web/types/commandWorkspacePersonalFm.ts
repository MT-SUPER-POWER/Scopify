import type { KeyboardEvent } from "react";
import type { FoliaCommandAction, FoliaCommandEntry } from "@/types/foliaCommands";
import type { PersonalFmSelection } from "@/types/personalFm";

export type PersonalFmCommandAction = Extract<FoliaCommandAction, { kind: "personal-fm" }>;
export type PersonalFmCommandEntry = FoliaCommandEntry & { action: PersonalFmCommandAction };

export interface CommandWorkspacePersonalFmProps {
  onBack(): void;
  onClose(): void;
}

export interface PersonalFmCommandGroup {
  id: PersonalFmCommandAction["category"];
  label: string;
  entries: PersonalFmCommandEntry[];
}

export interface CommandWorkspaceFmMatrixProps {
  groups: PersonalFmCommandGroup[];
  selection: PersonalFmSelection;
  highlightedId?: string;
  disabled: boolean;
  onSelect(entry: PersonalFmCommandEntry): void;
}

export interface CommandWorkspaceFmHeaderProps extends CommandWorkspacePersonalFmProps {
  query: string;
  onQueryChange(query: string): void;
  onKeyDown(event: KeyboardEvent<HTMLInputElement>): void;
  onToggleHelp(): void;
  showHelp: boolean;
}

export interface CommandWorkspaceFmPlaybackProps {
  isLoading: boolean;
  onOpenQueue(): void;
}
