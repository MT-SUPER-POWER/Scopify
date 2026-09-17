"use client";

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
import { useThemeOptions } from "@/hooks/settings/useThemeOptions";
import { isValidThemeSchedule } from "@/lib/settings/appearance";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { ThemeRotationDialogProps } from "@/types/appearance";
import { ThemeScheduleEditor } from "./ThemeScheduleEditor";

export function ThemeRotationDialog({ mode, onClose }: ThemeRotationDialogProps) {
  const { t } = useI18n();
  const options = useThemeOptions();
  const savedSlots = useAppearanceStore((state) => state.schedule);
  const savedIds = useAppearanceStore((state) => state.dailyThemeIds);
  const setSchedule = useAppearanceStore((state) => state.setSchedule);
  const setDaily = useAppearanceStore((state) => state.setDailyThemes);
  const [slots, setSlots] = useState(savedSlots);
  const [ids, setIds] = useState(savedIds);
  const valid = mode === "schedule" ? isValidThemeSchedule(slots) : ids.length > 0;
  const save = () => {
    if (!valid) return;
    if (mode === "schedule") setSchedule(slots);
    else setDaily(ids);
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
          <DialogTitle>
            {t(
              mode === "schedule" ? "appearance.rotation.title" : "appearance.rotation.dailyTitle",
            )}
          </DialogTitle>
          <DialogDescription>
            {t(mode === "schedule" ? "appearance.rotation.hint" : "appearance.rotation.dailyHint")}
          </DialogDescription>
        </DialogHeader>
        {mode === "schedule" ? (
          <ThemeScheduleEditor slots={slots} options={options} onChange={setSlots} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {options.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 has-checked:border-brand"
              >
                <input
                  type="checkbox"
                  className="accent-brand"
                  checked={ids.includes(option.id)}
                  onChange={(event) =>
                    setIds(
                      event.target.checked
                        ? [...ids, option.id]
                        : ids.filter((id) => id !== option.id),
                    )
                  }
                />
                <span
                  aria-hidden
                  className="size-9 shrink-0 rounded"
                  style={{ background: `linear-gradient(125deg, ${option.top}, ${option.bottom})` }}
                />
                <span className="truncate text-sm">{option.name}</span>
                {ids.includes(option.id) && (
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {ids.indexOf(option.id) + 1}
                  </span>
                )}
              </label>
            ))}
          </div>
        )}
        {!valid && mode === "schedule" && (
          <p role="alert" className="text-xs text-danger">
            {t("appearance.rotation.error")}
          </p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("appearance.theme.cancel")}
          </Button>
          <Button disabled={!valid} onClick={save}>
            {t("appearance.rotation.apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
