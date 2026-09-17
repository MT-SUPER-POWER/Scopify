"use client";

import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@scopify/ui/shadcn/components/dialog";
import { useI18n } from "@/store/module/i18n";
import type { SubtitleThemeDeleteProps } from "@/types/subtitle-preview";

export function SubtitleThemeDeleteDialog({
  themes,
  onClose,
  onConfirm,
}: SubtitleThemeDeleteProps) {
  const { t } = useI18n();
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("subtitleSystem.delete")}</DialogTitle>
          <DialogDescription>{t("subtitleSystem.deleteHint")}</DialogDescription>
        </DialogHeader>
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {themes.map((theme) => (
            <li key={theme.id} className="break-all">
              {theme.name}
            </li>
          ))}
        </ul>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("appearance.theme.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("subtitleSystem.delete")} ({themes.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
