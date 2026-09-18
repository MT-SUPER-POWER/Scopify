"use client";

import { useState } from "react";
import { SUBTITLE_COLOR_PRESETS } from "@/constants/subtitle-preview";
import { subtitlePalette } from "@/lib/settings/subtitlePalette";
import { isThemeNameValid, uniqueThemeName } from "@/lib/settings/themeNames";
import { useAppearanceStore } from "@/store/module/appearance";
import { useSubtitleThemeStore } from "@/store/module/subtitleThemes";
import { useI18n } from "@/store/module/i18n";
import type {
  SavedSubtitleTheme,
  SubtitlePalette,
  SubtitleThemeEditorProps,
} from "@/types/subtitle-preview";

export function useSubtitleThemeEditor({
  themeId,
  copyFrom,
  useCurrent,
}: SubtitleThemeEditorProps) {
  const { t } = useI18n();
  const themes = useSubtitleThemeStore((state) => state.themes);
  const save = useSubtitleThemeStore((state) => state.save);
  const setActiveId = useSubtitleThemeStore((state) => state.setActiveId);
  const current = useAppearanceStore((state) => state.lyricsPreview);
  const apply = useAppearanceStore((state) => state.updateLyricsPreview);
  const sourceId = copyFrom ?? themeId;
  const builtin = SUBTITLE_COLOR_PRESETS.find((item) => item.id === sourceId);
  const existing = themes.find((item) => item.id === sourceId);
  const readOnly = !!builtin && !copyFrom;
  const missing = !!sourceId && !builtin && !existing;
  const [initial, setInitial] = useState<SavedSubtitleTheme>(() => {
    const name = builtin ? t(`subtitlePreview.${builtin.label}`) : existing?.name;
    return {
      id: copyFrom || !sourceId ? crypto.randomUUID() : sourceId,
      name: copyFrom
        ? uniqueThemeName(t("themeEditor.copyName", { name: name ?? "" }), themes)
        : (name ??
          uniqueThemeName(t("subtitlePalette.untitled", { number: themes.length + 1 }), themes)),
      settings: subtitlePalette(
        builtin?.settings ?? (existing && !useCurrent ? existing.settings : current),
      ),
    };
  });
  const [draft, setDraft] = useState(initial);
  const update = (patch: Partial<SubtitlePalette>) => {
    if (readOnly) return;
    setDraft((previous) => ({
      ...previous,
      settings: subtitlePalette({ ...previous.settings, ...patch }),
    }));
  };
  const saveDraft = (asNew = false) => {
    if (readOnly || missing || !isThemeNameValid(draft, themes)) return null;
    const saved = {
      ...draft,
      name: draft.name.trim(),
      ...(asNew ? { id: crypto.randomUUID(), name: uniqueThemeName(draft.name, themes) } : {}),
    };
    save(saved);
    apply(saved.settings);
    setActiveId(saved.id);
    setDraft(saved);
    setInitial(saved);
    return saved.id;
  };
  return {
    draft,
    readOnly,
    missing,
    previewSettings: { ...current, ...draft.settings },
    isNew: !themes.some((theme) => theme.id === draft.id),
    dirty: JSON.stringify(draft) !== JSON.stringify(initial),
    valid: !missing && isThemeNameValid(draft, themes),
    setName: (name: string) => {
      if (!readOnly) setDraft((previous) => ({ ...previous, name }));
    },
    update,
    reset: () => setDraft(initial),
    save: () => saveDraft(),
    duplicate: () => saveDraft(true),
  };
}
