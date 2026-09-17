"use client";

import { useState } from "react";
import { Clock3, SlidersHorizontal } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useAppearanceBackground } from "@/hooks/settings/useAppearanceBackground";
import { useThemeOptions } from "@/hooks/settings/useThemeOptions";
import { useAppearanceStore } from "@/store/module/appearance";
import { useI18n } from "@/store/module/i18n";
import type { ThemeRotationDialogProps } from "@/types/appearance";
import { SettingRow, SettingSelect } from "./SettingsUI";
import { ThemeRotationDialog } from "./ThemeRotationDialog";
import { ThemeTimeline } from "./ThemeTimeline";

export function BackgroundRotationControl() {
  const { t } = useI18n();
  const { settings } = useAppearanceBackground();
  const options = useThemeOptions();
  const schedule = useAppearanceStore((state) => state.schedule);
  const update = useAppearanceStore((state) => state.updateBackground);
  const [mode, setMode] = useState<ThemeRotationDialogProps["mode"] | null>(null);
  return (
    <div className="mb-6 border-t border-border pt-6">
      <SettingRow
        label={t("appearance.rotation")}
        control={
          <SettingSelect
            value={settings.rotation}
            onChange={(value) => {
              if (value === "fixed") update({ ...settings, rotation: "fixed" });
              else if (value === "daily" || value === "schedule") setMode(value);
            }}
          >
            <option className="bg-popover" value="fixed">
              {t("appearance.rotation.fixed")}
            </option>
            <option className="bg-popover" value="daily">
              {t("appearance.rotation.daily")}
            </option>
            <option className="bg-popover" value="schedule">
              {t("appearance.rotation.schedule")}
            </option>
          </SettingSelect>
        }
      />
      {settings.rotation !== "fixed" && (
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <Clock3 className="size-4 text-muted-foreground" />
              {t(`appearance.rotation.${settings.rotation}`)}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setMode(settings.rotation === "daily" ? "daily" : "schedule")}
            >
              <SlidersHorizontal className="size-3.5" />
              {t("appearance.rotation.configure")}
            </Button>
          </div>
          {settings.rotation === "schedule" && <ThemeTimeline slots={schedule} options={options} />}
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t("appearance.rotation.active")}
          </p>
        </div>
      )}
      {mode && <ThemeRotationDialog mode={mode} onClose={() => setMode(null)} />}
    </div>
  );
}
