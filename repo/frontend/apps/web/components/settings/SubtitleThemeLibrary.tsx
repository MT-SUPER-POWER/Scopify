"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { SETTINGS_ACTION_BUTTON_CLASS_NAME } from "@/constants/settings";
import { useRouter } from "next/navigation";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useSubtitlePalette } from "@/hooks/settings/useSubtitlePalette";
import { useSubtitleThemeStore } from "@/store/module/subtitleThemes";
import { useI18n } from "@/store/module/i18n";
import { subtitleThemeEditorHref } from "@/lib/settings/subtitleTheme";
import { SettingSection } from "./SettingsUI";
import { SubtitleThemeDeleteDialog } from "./SubtitleThemeDeleteDialog";
import { SubtitleThemeCard } from "./SubtitleThemeCard";

export function SubtitleThemeLibrary() {
  const { t } = useI18n();
  const { themes, builtins, active, apply } = useSubtitlePalette();
  const remove = useSubtitleThemeStore((state) => state.remove);
  const router = useRouter();
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string[] | null>(null);
  return (
    <div className="space-y-8">
      <SettingSection title={t("subtitlePalette.builtin")}>
        <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
          {builtins.map((theme) => (
            <SubtitleThemeCard
              key={theme.id}
              theme={theme}
              selected={active?.id === theme.id}
              readOnly
              onSelect={() => apply(theme)}
              onEdit={() => router.push(subtitleThemeEditorHref(theme.id))}
            />
          ))}
        </div>
      </SettingSection>
      <SettingSection
        title={t("subtitlePalette.library")}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={SETTINGS_ACTION_BUTTON_CLASS_NAME}
              onClick={() => router.push(subtitleThemeEditorHref())}
            >
              <Plus aria-hidden className="size-4" />
              {t("subtitlePalette.new")}
            </button>
            {themes.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setManaging(!managing);
                  setSelected([]);
                }}
              >
                {t(managing ? "appearance.bulk.done" : "appearance.bulk.manage")}
              </Button>
            )}
          </div>
        }
      >
        {!themes.length && (
          <p className="rounded-md border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            {t("subtitlePalette.empty")}
          </p>
        )}
        {managing && (
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelected(
                  selected.length === themes.length ? [] : themes.map((theme) => theme.id),
                )
              }
            >
              {t("subtitleSystem.selectAll")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!selected.length}
              onClick={() => setDeleting(selected)}
            >
              {t("subtitleSystem.delete")} ({selected.length})
            </Button>
          </div>
        )}
        {themes.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3">
            {themes.map((theme) => (
              <SubtitleThemeCard
                key={theme.id}
                theme={theme}
                selected={managing ? selected.includes(theme.id) : active?.id === theme.id}
                managing={managing}
                onSelect={() =>
                  managing
                    ? setSelected((ids) =>
                        ids.includes(theme.id)
                          ? ids.filter((id) => id !== theme.id)
                          : [...ids, theme.id],
                      )
                    : apply(theme)
                }
                onEdit={() => router.push(subtitleThemeEditorHref(theme.id))}
              />
            ))}
          </div>
        )}
        {deleting && (
          <SubtitleThemeDeleteDialog
            themes={themes.filter((theme) => deleting.includes(theme.id))}
            onClose={() => setDeleting(null)}
            onConfirm={() => {
              remove(deleting);
              setDeleting(null);
              setSelected([]);
              setManaging(false);
            }}
          />
        )}
      </SettingSection>
    </div>
  );
}
