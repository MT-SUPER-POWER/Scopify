"use client";

import { AnimatePresence, motion } from "framer-motion";

import { FoliaThemeUnsavedDialog } from "@/components/lyrics/FoliaThemeUnsavedDialog";
import { FoliaThemeWorkbenchHeader } from "@/components/lyrics/FoliaThemeWorkbenchHeader";
import { FoliaThemeWorkbenchLayout } from "@/components/lyrics/FoliaThemeWorkbenchLayout";
import { useFoliaThemeWorkbench } from "@/hooks/lyrics/useFoliaThemeWorkbench";
import { useI18n } from "@/store/module/i18n";
import type { FoliaThemeLibraryDialogProps } from "@/types/components/lyrics";
import { getFoliaThemeColors } from "@scopify/ui/folia";

export function FoliaThemeLibraryDialog({
  assets,
  isOpen,
  onClose,
  theme,
}: FoliaThemeLibraryDialogProps) {
  const { t } = useI18n();
  const model = useFoliaThemeWorkbench(isOpen, onClose);
  const draftColors = getFoliaThemeColors(model.draftTheme, model.themeVariant);
  const workbenchTheme = { ...theme, ...draftColors };
  const isDaylight = theme.name === "snow";
  const overlayBackground = isDaylight ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.65)";
  const surfaceClass = isDaylight ? "border-black/5 bg-white/76" : "border-white/10 bg-zinc-950/90";

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-150 p-3 backdrop-blur-xl sm:p-5"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onPointerDown={model.requestClose}
            style={{ backgroundColor: overlayBackground }}
          >
            <motion.section
              animate={{ opacity: 1, y: 0 }}
              aria-label={String(t("folia.options.themeLibrary"))}
              aria-modal="true"
              className={`mx-auto flex h-full max-w-360 flex-col overflow-hidden rounded-[32px] border shadow-[0_24px_80px_rgba(0,0,0,0.28)] ${surfaceClass}`}
              exit={{ opacity: 0, y: 40 }}
              initial={{ opacity: 0, y: 40 }}
              onPointerDown={(event) => event.stopPropagation()}
              role="dialog"
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <FoliaThemeWorkbenchHeader
                activeThemeId={model.activeThemeId}
                draftTheme={model.draftTheme}
                isDirty={model.isDirty}
                onClose={model.requestClose}
                onReset={model.resetDraft}
                onSaveAndApply={model.saveAndApply}
                saveState={model.saveState}
                selectedThemeId={model.selectedThemeId}
                theme={workbenchTheme}
              />
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
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <FoliaThemeUnsavedDialog
        onCancel={() => model.setPendingAction(null)}
        onDiscard={() => model.completePendingAction(false)}
        onSave={() => model.completePendingAction(true)}
        open={model.pendingAction !== null}
      />
    </>
  );
}
