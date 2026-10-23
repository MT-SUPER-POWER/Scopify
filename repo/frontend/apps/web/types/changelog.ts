import type { UpdateCategory } from "@/types/updates";
import type { AppLocale } from "@/types/config";

export interface ParsedChangelogEntry {
  id: string;
  category: UpdateCategory;
  title: string;
  description: string;
  line: number;
  historical: boolean;
  commits: string[];
  translations?: Partial<Record<AppLocale, { title: string; description: string }>>;
}

export interface ParsedChangelogRelease {
  version: string;
  date: string | null;
  entries: ParsedChangelogEntry[];
}

export interface ChangelogGitCommit {
  hash: string;
  subject: string;
}
