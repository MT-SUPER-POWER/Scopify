"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@scopify/ui/shadcn/components/tabs";
import { useState } from "react";

import { FoliaThemeColorEditor } from "@/components/lyrics/FoliaThemeColorEditor";
import { FoliaThemeIdentityControls } from "@/components/lyrics/FoliaThemeIdentityControls";
import { FoliaThemeJsonTransfer } from "@/components/lyrics/FoliaThemeJsonTransfer";
import { useLyricStageStore } from "@/store/module/lyrics";
import { useTranslation } from "react-i18next";

import type { FoliaThemeEditorPanelProps, FoliaThemeEditorTab } from "@/types/lyrics/components";

export function FoliaThemeEditorPanel({
  draftTheme,
  onDeleteTheme,
  onDraftChange,
  onSelectTheme,
}: FoliaThemeEditorPanelProps) {
  const { t } = useTranslation();
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const [editorTab, setEditorTab] = useState<FoliaThemeEditorTab>("edit");
  const tabs = [
    { key: "edit" as const, label: t("folia.options.themeEdit") },
    { key: "import-export" as const, label: t("folia.options.themeImportExport") },
  ];

  return (
    <Tabs
      value={editorTab}
      onValueChange={(value) => setEditorTab(value as FoliaThemeEditorTab)}
      className="h-full min-h-0 gap-0"
    >
      <TabsList
        variant="line"
        className="folia-studio-tab-list shrink-0 border-b border-[var(--st-line)]"
      >
        {tabs.map((tab) => (
          <TabsTrigger key={tab.key} value={tab.key} className="folia-studio-tab">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent
        value="edit"
        className="st-scroll m-0 min-h-0 space-y-4 overflow-y-auto pt-5 pr-1 pb-6"
      >
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
      </TabsContent>
      <TabsContent
        value="import-export"
        className="st-scroll m-0 min-h-0 overflow-y-auto pt-5 pr-1 pb-6"
      >
        <FoliaThemeJsonTransfer onSelectTheme={onSelectTheme} theme={draftTheme} />
      </TabsContent>
    </Tabs>
  );
}
