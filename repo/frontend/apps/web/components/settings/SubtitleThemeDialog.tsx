"use client";

import { SubtitlePaletteEditor } from "./SubtitlePaletteEditor";
import { useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@scopify/ui/shadcn/components/dialog";
import { useSubtitleThemeStore } from "@/store/module/subtitleThemes";
import { useI18n } from "@/store/module/i18n";
import type { SubtitleThemeDialogProps } from "@/types/subtitle-preview";

export function SubtitleThemeDialog({ theme, onClose }: SubtitleThemeDialogProps) {
  const { t } = useI18n();
  const [settings, setSettings] = useState(theme.settings);
  const [name, setName] = useState(theme.name);
  const themes = useSubtitleThemeStore((state) => state.themes);
  const save = useSubtitleThemeStore((state) => state.save);
  const valid =
    name.trim().length > 0 &&
    !themes.some(
      (item) =>
        item.id !== theme.id && item.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
    );
  const submit = () => {
    if (valid) {
      save({ ...theme, settings, name: name.trim() });
      onClose();
    }
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t(theme.kind === "palette" ? "subtitlePalette.save" : "subtitleSystem.saveTheme")}
          </DialogTitle>
          <DialogDescription>
            {t(theme.kind === "palette" ? "subtitlePalette.hint" : "subtitleSystem.saveHint")}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="space-y-4"
        >
          <label className="block space-y-2 text-sm">
            <span>{t("subtitleSystem.name")}</span>
            <input
              autoFocus
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!valid}
              className="w-full rounded border border-input bg-transparent px-3 py-2 outline-none focus:ring-1 focus:ring-ring"
            />
          </label>
          {!valid && <p className="text-sm text-danger">{t("appearance.theme.nameError")}</p>}
          {theme.kind === "palette" && (
            <SubtitlePaletteEditor settings={settings} onChange={setSettings} />
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("appearance.theme.cancel")}
            </Button>
            <Button type="submit" disabled={!valid}>
              {t("subtitleSystem.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
