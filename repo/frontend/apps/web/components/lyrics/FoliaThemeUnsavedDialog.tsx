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
import { useI18n } from "@/store/module/i18n";
import type { FoliaThemeUnsavedDialogProps } from "@/types/components/lyrics";

export function FoliaThemeUnsavedDialog({
  onCancel,
  onDiscard,
  onSave,
  open,
}: FoliaThemeUnsavedDialogProps) {
  const { t } = useI18n();

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("folia.options.themeUnsavedTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("folia.options.themeUnsavedDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{t("folia.ui.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="outline" onClick={onDiscard}>
            {t("folia.options.themeDiscardChanges")}
          </AlertDialogAction>
          <AlertDialogAction onClick={onSave}>
            {t("folia.options.themeSaveChanges")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
