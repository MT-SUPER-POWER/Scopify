"use client";

import { useState } from "react";

import { FoliaThemeColorEditor } from "@/components/lyrics/FoliaThemeColorEditor";
import { FoliaThemeIdentityControls } from "@/components/lyrics/FoliaThemeIdentityControls";
import { FoliaThemeJsonTransfer } from "@/components/lyrics/FoliaThemeJsonTransfer";
import { colorWithAlpha } from "@/components/lyrics/folia/src/components/visualizer/colorMix";
import { getFoliaThemeColors } from "@scopify/ui/folia";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useI18n } from "@/store/module/i18n";
import type { FoliaThemeEditorPanelProps, FoliaThemeEditorTab } from "@/types/components/lyrics";

export function FoliaThemeEditorPanel({
  draftTheme,
  onDeleteTheme,
  onDraftChange,
  onSelectTheme,
}: FoliaThemeEditorPanelProps) {
  const { t } = useI18n();
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const [editorTab, setEditorTab] = useState<FoliaThemeEditorTab>("edit");
  const activeColors = getFoliaThemeColors(draftTheme, themeVariant);
  const tabs = [
    { key: "edit" as const, label: t("folia.options.themeEdit") },
    { key: "import-export" as const, label: t("folia.options.themeImportExport") },
  ];

  return (
    <div className="visualizer-overlay-scrollbar flex h-full min-h-0 flex-col gap-3 overflow-y-auto pr-1">
      <div
        className="sticky top-0 z-20 flex rounded-xl p-1 backdrop-blur-xl"
        style={{ backgroundColor: colorWithAlpha(activeColors.backgroundColor, 0.82) }}
      >
        {tabs.map((tab) => {
          const active = editorTab === tab.key;
          return (
            <button
              className="flex flex-1 items-center justify-center rounded-lg border py-2 text-xs font-medium transition-all"
              key={tab.key}
              onClick={() => setEditorTab(tab.key)}
              style={{
                backgroundColor: active
                  ? colorWithAlpha(activeColors.accentColor, 0.15)
                  : "transparent",
                borderColor: active ? colorWithAlpha(activeColors.accentColor, 0.5) : "transparent",
                color: active ? activeColors.primaryColor : `${activeColors.secondaryColor}99`,
              }}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {editorTab === "edit" ? (
        <>
          <FoliaThemeIdentityControls
            draftTheme={draftTheme}
            onDeleteTheme={onDeleteTheme}
            onDraftChange={onDraftChange}
          />
          <FoliaThemeColorEditor
            onDraftChange={onDraftChange}
            theme={draftTheme}
            variant={themeVariant}
          />
        </>
      ) : (
        <FoliaThemeJsonTransfer onSelectTheme={onSelectTheme} theme={draftTheme} />
      )}
    </div>
  );
}
