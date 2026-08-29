"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { areFoliaThemesEqual } from "@/lib/lyrics/foliaThemeDraft";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemePendingAction, FoliaThemeSaveState } from "@/types/components/lyrics";
import { getFoliaStageTheme } from "@scopify/ui/folia";

export function useFoliaThemeWorkbench(isOpen: boolean, onClose: () => void) {
  const activeThemeId = useLyricStageStore((state) => state.themeId);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const themes = useLyricStageStore((state) => state.themes);
  const updateTheme = useLyricStageStore((state) => state.updateTheme);
  const setThemeId = useLyricStageStore((state) => state.setThemeId);
  const deleteTheme = useLyricStageStore((state) => state.deleteTheme);
  const [selectedThemeId, setSelectedThemeId] = useState(activeThemeId);
  const selectedTheme = useMemo(
    () => getFoliaStageTheme(themes, selectedThemeId),
    [selectedThemeId, themes],
  );
  const [draftTheme, setDraftTheme] = useState(selectedTheme);
  const [pendingAction, setPendingAction] = useState<FoliaThemePendingAction | null>(null);
  const [saveState, setSaveState] = useState<FoliaThemeSaveState>("idle");
  const saveTimerRef = useRef<number | null>(null);
  const isDirty = useMemo(
    () => !areFoliaThemesEqual(draftTheme, selectedTheme),
    [draftTheme, selectedTheme],
  );

  const selectImmediately = useCallback((id: string) => {
    const nextTheme = getFoliaStageTheme(useLyricStageStore.getState().themes, id);
    setSelectedThemeId(nextTheme.id);
    setDraftTheme(nextTheme);
    setSaveState("idle");
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    selectImmediately(activeThemeId);
    setPendingAction(null);
  }, [activeThemeId, isOpen, selectImmediately]);

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    },
    [],
  );

  const saveDraft = (apply: boolean) => {
    updateTheme(draftTheme);
    if (apply) setThemeId(draftTheme.id);
    setDraftTheme(getFoliaStageTheme(useLyricStageStore.getState().themes, draftTheme.id));
    setSaveState("saved");
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => setSaveState("idle"), 1_800);
  };

  const requestSelectTheme = (id: string) => {
    if (id === selectedThemeId) return;
    if (isDirty) setPendingAction({ kind: "select", themeId: id });
    else selectImmediately(id);
  };

  const requestClose = () => {
    if (isDirty) setPendingAction({ kind: "close" });
    else onClose();
  };

  const completePendingAction = (save: boolean) => {
    const action = pendingAction;
    if (!action) return;
    if (save) updateTheme(draftTheme);
    setPendingAction(null);
    if (action.kind === "close") onClose();
    else selectImmediately(action.themeId);
  };

  const deleteSelectedTheme = () => {
    deleteTheme(selectedThemeId);
    selectImmediately(useLyricStageStore.getState().themeId);
  };

  return {
    activeThemeId,
    completePendingAction,
    deleteSelectedTheme,
    draftTheme,
    isDirty,
    pendingAction,
    requestClose,
    requestSelectTheme,
    resetDraft: () => setDraftTheme(selectedTheme),
    saveAndApply: () => saveDraft(true),
    saveState,
    selectedTheme,
    selectedThemeId,
    setDraftTheme,
    setPendingAction,
    themeVariant,
  };
}
