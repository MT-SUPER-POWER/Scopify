import type {
  CacheCategory,
  CacheClearResult,
  CacheSelectionSummary,
  CacheSelectionKey,
  CacheStats,
} from "@/types/cache";

export interface CacheCleanupPageProps {
  error: string | null;
  isClearing: boolean;
  isLoading: boolean;
  onClear: () => Promise<CacheClearResult | null>;
  onRefresh: () => Promise<void>;
  onToggleCategory: (scope: "page" | "playback", category: CacheCategory, checked: boolean) => void;
  onToggleScope: (scope: "page" | "playback", checked: boolean) => void;
  selectedCategories: ReadonlySet<CacheSelectionKey>;
  selection: CacheSelectionSummary;
  stats: CacheStats | null;
}

export interface CacheCheckboxProps {
  checked: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}

export interface CacheCleanupConfirmDialogProps {
  containsLyricData: boolean;
  isClearing: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  selection: CacheSelectionSummary;
}
