"use client";

import { useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@scopify/ui/shadcn/components/dialog";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { ThemeEditorProps } from "@/types/appearance";
import { ThemeEditorFields } from "./ThemeEditorFields";

export function ThemeEditorDialog({ theme, isNew, onClose }: ThemeEditorProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(theme);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const themes = useAppearanceStore((state) => state.themes);
  const save = useAppearanceStore((state) => state.saveTheme);
  const remove = useAppearanceStore((state) => state.deleteTheme);
  const valid =
    draft.name.trim().length > 0 &&
    !themes.some(
      (item) =>
        item.id !== draft.id &&
        item.name.toLocaleLowerCase() === draft.name.trim().toLocaleLowerCase(),
    );
  const submit = () => {
    if (valid) {
      save(draft);
      onClose();
    }
  };
  const duplicate = () => {
    let name = `${draft.name.trim()} (2)`;
    let suffix = 2;
    while (themes.some((item) => item.name.toLocaleLowerCase() === name.toLocaleLowerCase()))
      name = `${draft.name.trim()} (${++suffix})`;
    save({ ...draft, id: `user:${crypto.randomUUID()}`, name });
    onClose();
  };
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(isNew ? "appearance.library.new" : "appearance.theme.edit")}</DialogTitle>
          <DialogDescription>{t("appearance.theme.local")}</DialogDescription>
        </DialogHeader>
        <ThemeEditorFields draft={draft} onChange={setDraft} />
        {!valid && (
          <p role="status" className="text-xs text-danger">
            {t("appearance.theme.nameError")}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border pt-4">
          {!isNew && (
            <Button
              variant="ghost"
              className="mr-auto text-danger"
              onClick={() => {
                if (confirmDelete) {
                  remove(theme.id);
                  onClose();
                } else setConfirmDelete(true);
              }}
            >
              {t(confirmDelete ? "appearance.theme.confirmDelete" : "appearance.theme.delete")}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            {t("appearance.theme.cancel")}
          </Button>
          {!isNew && (
            <Button variant="outline" disabled={!draft.name.trim()} onClick={duplicate}>
              {t("appearance.theme.saveAs")}
            </Button>
          )}
          <Button disabled={!valid} onClick={submit}>
            {t("appearance.theme.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
