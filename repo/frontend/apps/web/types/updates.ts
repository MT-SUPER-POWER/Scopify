/** Changelog groups produced by cliff.toml: feat → added, fix → fixed, perf → improved. */
export type UpdateGroup = "added" | "fixed" | "improved";

export interface UpdateGroupDefinition {
  id: UpdateGroup;
  /** `### heading` written by git-cliff. */
  heading: string;
}

export interface UpdateEntry {
  /** Full commit hash; also the stable React key. */
  commit: string;
  group: UpdateGroup;
  /** Commit subject, written for users (see the git-conventions skill). */
  text: string;
}

export interface UpdateRelease {
  /** `null` for the dev-only preview of commits after the latest tag. */
  version: string | null;
  date: string | null;
  entries: UpdateEntry[];
}

export interface UpdatesManifest {
  currentVersion: string;
  releases: UpdateRelease[];
}

export interface UpdatesStore {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export interface UpdateReleaseContentProps {
  release: UpdateRelease;
}

export interface UpdatesHeaderProps {
  release: UpdateRelease | undefined;
  onClose: () => void;
}

export interface UpdatesFooterProps {
  releaseKey: string;
  onReleaseChange: (releaseKey: string) => void;
  onClose: () => void;
}
