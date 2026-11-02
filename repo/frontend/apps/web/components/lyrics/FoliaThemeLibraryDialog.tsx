"use client";

import { useEffect, useRef } from "react";
import { useFoliaModalFocus } from "@/hooks/lyrics/useFoliaModalFocus";
import { useFoliaSettingsStore } from "@/store/module/foliaSettings";
import { useLyricStageStore } from "@/store/module/lyrics";
import { AnimatePresence } from "framer-motion";

import { FoliaThemeUnsavedDialog } from "@/components/lyrics/FoliaThemeUnsavedDialog";
import { FoliaThemeWorkbenchHeader } from "@/components/lyrics/FoliaThemeWorkbenchHeader";
import { FoliaThemeWorkbenchLayout } from "@/components/lyrics/FoliaThemeWorkbenchLayout";
import { useFoliaThemeWorkbench } from "@/hooks/lyrics/useFoliaThemeWorkbench";
import { useTranslation } from "react-i18next";

import type { FoliaThemeLibraryDialogProps } from "@/types/lyrics/components";
import { FoliaStudioWindow } from "@scopify/ui/scopify/components/folia-studio/window";

export function FoliaThemeLibraryDialog({
  assets,
  isOpen,
  onClose,
  theme,
}: FoliaThemeLibraryDialogProps) {
  const { t } = useTranslation();
  const model = useFoliaThemeWorkbench(isOpen, onClose);
  const closeRequest = useFoliaSettingsStore((state) => state.themeCloseRequest);
  const seenCloseRequest = useRef(0);
  const warningOpen = useLyricStageStore((state) => state.sonnetPerformanceWarningOpen);
  const dialogRef = useFoliaModalFocus(
    isOpen && !model.pendingAction && !warningOpen,
    model.requestClose,
  );
  const requestClose = model.requestClose;
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;
  useEffect(() => {
    if (seenCloseRequest.current === closeRequest) return;
    seenCloseRequest.current = closeRequest;
    if (isOpen && closeRequest > 0) requestCloseRef.current();
  }, [closeRequest, isOpen]);
  const isDaylight = theme.name === "snow";

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <FoliaStudioWindow
            panelRef={dialogRef}
            layer={150}
            title={t("folia.options.themeLibrary")}
            backLabel={t("folia.ui.close")}
            onClose={model.requestClose}
            isDaylight={isDaylight}
            colors={theme}
            header={
              <FoliaThemeWorkbenchHeader
                activeThemeId={model.activeThemeId}
                draftTheme={model.draftTheme}
                isDirty={model.isDirty}
                onClose={model.requestClose}
                onReset={model.resetDraft}
                onSaveAndApply={model.saveAndApply}
                saveState={model.saveState}
                selectedThemeId={model.selectedThemeId}
              />
            }
          >
            <div className="min-h-0 flex-1 p-4 sm:p-5">
              <FoliaThemeWorkbenchLayout
                activeThemeId={model.activeThemeId}
                assets={assets}
                draftTheme={model.draftTheme}
                isDirty={model.isDirty}
                onDeleteTheme={model.deleteSelectedTheme}
                onDraftChange={model.setDraftTheme}
                onSelectTheme={model.requestSelectTheme}
                selectedTheme={model.selectedTheme}
                selectedThemeId={model.selectedThemeId}
                themeEditorContext={{
                  isApplied: model.selectedThemeId === model.activeThemeId,
                  isDirty: model.isDirty,
                  saveState: model.saveState,
                  variant: model.themeVariant,
                }}
              />
            </div>
          </FoliaStudioWindow>
        ) : null}
      </AnimatePresence>
      <FoliaThemeUnsavedDialog
        isDaylight={isDaylight}
        onCancel={() => model.setPendingAction(null)}
        onDiscard={() => model.completePendingAction(false)}
        onSave={() => model.completePendingAction(true)}
        open={model.pendingAction !== null}
      />
    </>
  );
}
