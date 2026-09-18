"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useAppearanceStore } from "@/store/module/appearance";
import { useSubtitleThemeStore } from "@/store/module/subtitleThemes";
import { useI18n } from "@/store/module/i18n";
import {
  isSubtitleThemeActive,
  subtitleThemePatch,
  subtitleThemeEditorHref,
} from "@/lib/settings/subtitleTheme";
import type { SubtitleThemeLibraryProps } from "@/types/subtitle-preview";
import { SettingSection } from "./SettingsUI";
import { SubtitleColorPresets } from "./SubtitleColorPresets";
import { SubtitleThemeDeleteDialog } from "./SubtitleThemeDeleteDialog";
import { SubtitleThemeCard } from "./SubtitleThemeCard";

export function SubtitleThemeLibrary({ paletteOnly = false }: SubtitleThemeLibraryProps) {
  const { t } = useI18n();
  const allThemes = useSubtitleThemeStore((state) => state.themes);
  const themes = allThemes.filter((theme) => (theme.kind === "palette") === paletteOnly);
  const remove = useSubtitleThemeStore((state) => state.remove);
  const settings = useAppearanceStore((state) => state.lyricsPreview);
  const update = useAppearanceStore((state) => state.updateLyricsPreview);
  const router = useRouter();
  const kind = paletteOnly ? "palette" : "style";
  const [managing, setManaging] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string[] | null>(null);
  const create = () => {
    const active = themes.find((theme) => isSubtitleThemeActive(theme, settings));
    router.push(subtitleThemeEditorHref(kind, active?.id));
  };
  return (
    <SettingSection title={t(paletteOnly ? "subtitlePalette.library" : "subtitleSystem.library")}>
      {paletteOnly && <SubtitleColorPresets settings={settings} onChange={update} />}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={create}>
          {t(paletteOnly ? "themeEditor.editPalette" : "themeEditor.editSubtitle")}
        </Button>
        {themes.length > 0 && (
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
        )}
        {managing && (
          <>
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
          </>
        )}
      </div>
      {themes.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {themes.map((theme) => (
            <SubtitleThemeCard
              key={theme.id}
              theme={theme}
              selected={
                managing ? selected.includes(theme.id) : isSubtitleThemeActive(theme, settings)
              }
              managing={managing}
              onSelect={() =>
                managing
                  ? setSelected((ids) =>
                      ids.includes(theme.id)
                        ? ids.filter((id) => id !== theme.id)
                        : [...ids, theme.id],
                    )
                  : update(subtitleThemePatch(theme))
              }
              onEdit={() => router.push(subtitleThemeEditorHref(kind, theme.id))}
              onUpdate={() => router.push(subtitleThemeEditorHref(kind, theme.id, true))}
              onDelete={() => setDeleting([theme.id])}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("subtitleSystem.emptyLibrary")}</p>
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
  );
}
