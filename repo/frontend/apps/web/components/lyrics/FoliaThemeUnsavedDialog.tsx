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
import type { FoliaThemeUnsavedDialogProps } from "@/types/lyrics/components";

export function FoliaThemeUnsavedDialog({
  onCancel,
  onDiscard,
  onSave,
  open,
  isDaylight,
}: FoliaThemeUnsavedDialogProps) {
  const { t } = useI18n();

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <AlertDialogContent
        className={`z-190 rounded-2xl ${isDaylight ? "border-black/8 bg-[#f3f3f5] text-[#171b27]" : "border-white/10 bg-[#1c1c1f] text-[#f0f0f3]"}`}
        overlayClassName="z-190"
      >
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
