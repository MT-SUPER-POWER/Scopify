"use client";

import { useState } from "react";
import { Eye, Pencil, Plus } from "lucide-react";
import { SETTINGS_ACTION_BUTTON_CLASS_NAME } from "@/constants/settings";
import { useRouter } from "next/navigation";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useSubtitlePalette } from "@/hooks/settings/useSubtitlePalette";
import { useSubtitleThemeStore } from "@/store/module/subtitleThemes";
import { useI18n } from "@/store/module/i18n";
import { subtitleThemeEditorHref } from "@/lib/settings/subtitleTheme";
import { SettingRow, SettingSection } from "./SettingsUI";
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
      <SettingRow
        label={t("themeEditor.paletteLabel")}
        sublabel={active?.name ?? t("subtitlePalette.current")}
        control={
          <button
            type="button"
            className={SETTINGS_ACTION_BUTTON_CLASS_NAME}
            onClick={() => router.push(subtitleThemeEditorHref(active?.id))}
          >
            {active?.id.startsWith("builtin:") ? (
              <Eye aria-hidden className="size-4" />
            ) : (
              <Pencil aria-hidden className="size-4" />
            )}
            {t(active?.id.startsWith("builtin:") ? "themeEditor.view" : "themeEditor.edit")}
          </button>
        }
      />

      <SettingSection title={t("subtitlePalette.builtin")}>
        <div className="mb-5 flex flex-wrap gap-2">
          {builtins.map((theme) => (
            <button
              type="button"
              key={theme.id}
              aria-pressed={active?.id === theme.id}
              onClick={() => apply(theme)}
              className={`${SETTINGS_ACTION_BUTTON_CLASS_NAME} ${active?.id === theme.id ? "border-brand bg-brand/10 text-brand" : ""}`}
            >
              <span
                className="size-3 rounded-full"
                style={{
                  background:
                    theme.settings.colorMode === "gradient"
                      ? `linear-gradient(90deg, ${theme.settings.color}, ${theme.settings.gradientColor})`
                      : theme.settings.color,
                }}
              />
              {theme.name}
            </button>
          ))}
        </div>
      </SettingSection>
      <SettingSection
        title={t("subtitlePalette.library")}
        actions={
          themes.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setManaging(!managing);
                setSelected([]);
              }}
            >
              {t(managing ? "subtitleSystem.done" : "subtitleSystem.manage")}
            </Button>
          ) : undefined
        }
      >
        <SettingRow
          label={t("subtitlePalette.new")}
          control={
            <button
              type="button"
              className={SETTINGS_ACTION_BUTTON_CLASS_NAME}
              onClick={() => router.push(subtitleThemeEditorHref())}
            >
              <Plus aria-hidden="true" className="size-4" />
              {t("appearance.library.new")}
            </button>
          }
        />
        {!themes.length && (
          <p className="mb-4 text-sm text-muted-foreground">{t("subtitlePalette.empty")}</p>
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
        {themes.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                onUpdate={() => router.push(subtitleThemeEditorHref(theme.id, true))}
                onDelete={() => setDeleting([theme.id])}
              />
            ))}
          </div>
        ) : null}
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
