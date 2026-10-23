import type { AppLocale } from "@/types/config";

export type UpdateCommitType =
  "feat" | "fix" | "perf" | "style" | "docs" | "refactor" | "chore" | "build" | "test" | "ci";
export type UpdateText = Record<AppLocale, string>;
export type UpdateCategory = "Added" | "Fixed" | "Visual" | "Quality";

export interface UpdateCategoryDefinition {
  title: UpdateCategory;
}

export interface UpdateEntry {
  id: string;
  type: UpdateCommitType;
  category: UpdateCategory;
  title: UpdateText;
  description: UpdateText;
  commit: string | null;
  sourceType: UpdateCommitType | null;
}

export interface UpdateRelease {
  version: string;
  date: string | null;
  title: UpdateText;
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
  page: number;
}

export interface UpdatesHeaderProps {
  version: string;
  release: UpdateRelease | undefined;
  onClose: () => void;
}

export interface UpdatesFooterProps {
  version: string;
  page: number;
  total: number;
  onVersionChange: (version: string) => void;
  onPageChange: (page: number) => void;
}
