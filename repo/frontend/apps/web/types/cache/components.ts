import type { CacheSelectionSummary } from "@/types/cache/model";

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
