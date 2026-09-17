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
import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { ThemeBulkDeleteDialogProps } from "@/types/appearance";

export function ThemeBulkDeleteDialog({ themes, onClose, onConfirm }: ThemeBulkDeleteDialogProps) {
  const { t } = useI18n();
  const { palette, settings } = useAppearanceBackground();
  const daily = useAppearanceStore((state) => state.dailyThemeIds);
  const slots = useAppearanceStore((state) => state.schedule);
  const ids = new Set<string>(themes.map((theme) => theme.id));
  const dailyCount = daily.filter((id) => ids.has(id)).length;
  const slotCount = slots.filter((slot) => ids.has(slot.themeId)).length;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("appearance.bulk.confirmTitle", { count: themes.length })}</DialogTitle>
          <DialogDescription>{t("appearance.bulk.confirmHint")}</DialogDescription>
        </DialogHeader>
        <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
          {themes.map((theme) => (
            <li key={theme.id} className="flex min-w-0 items-center gap-3 text-sm">
              <span
                aria-hidden
                className="size-6 shrink-0 rounded"
                style={{ background: `linear-gradient(125deg, ${theme.top}, ${theme.bottom})` }}
              />
              <span className="break-all">{theme.name}</span>
            </li>
          ))}
        </ul>
        <div className="space-y-2 text-sm text-muted-foreground">
          {ids.has(palette.id) && (
            <p>
              {t(
                settings.rotation === "fixed"
                  ? "appearance.bulk.activeFixed"
                  : "appearance.bulk.activeRotation",
              )}
            </p>
          )}
          {dailyCount > 0 && <p>{t("appearance.bulk.daily", { count: dailyCount })}</p>}
          {slotCount > 0 && <p>{t("appearance.bulk.slots", { count: slotCount })}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("appearance.theme.cancel")}
          </Button>
          <Button variant="destructive" disabled={!themes.length} onClick={onConfirm}>
            {t("appearance.bulk.delete", { count: themes.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
