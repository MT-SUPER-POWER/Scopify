"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCacheSize } from "@/lib/cache/presentation";
import { useI18n } from "@/store/module/i18n";
import type { CacheCleanupConfirmDialogProps } from "@/types/components/cache";

export function CacheCleanupConfirmDialog({
  containsLyricData,
  isClearing,
  onClose,
  onConfirm,
  open,
  selection,
}: CacheCleanupConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("settings.cache.cleanup.confirm.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("settings.cache.cleanup.confirm.description", {
              count: selection.entryCount,
              size: formatCacheSize(selection.sizeBytes),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {containsLyricData ? (
          <p className="text-destructive text-sm">
            {t("settings.cache.cleanup.confirm.lyricWarning")}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>
            {t("settings.confirm.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={isClearing} onClick={onConfirm}>
            {isClearing
              ? t("settings.cache.cleanup.confirm.clearing")
              : t("settings.cache.cleanup.confirm.action")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
