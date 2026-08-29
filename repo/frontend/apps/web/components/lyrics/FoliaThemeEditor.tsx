"use client";

import { useMemo } from "react";

import { FoliaSettingsPreview } from "@/components/lyrics/FoliaSettingsPreview";
import { FoliaThemeEditorPanel } from "@/components/lyrics/FoliaThemeEditorPanel";
import type { Theme } from "@/components/lyrics/folia/src/types";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useLyricStageStore } from "@/store/module/lyrics";
import type { FoliaThemeEditorProps } from "@/types/components/lyrics";
import { getFoliaThemeColors } from "@scopify/ui/folia";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@scopify/ui/shadcn/components/resizable";

export function FoliaThemeEditor({
  assets,
  draftTheme,
  onDeleteTheme,
  onDraftChange,
  onSelectTheme,
  selectedTheme,
  themeEditorContext,
}: FoliaThemeEditorProps) {
  const fontFamily = useLyricStageStore((state) => state.fontFamily);
  const fontStyle = useLyricStageStore((state) => state.fontStyle);
  const themeVariant = useLyricStageStore((state) => state.themeVariant);
  const isDesktopLayout = useMediaQuery("(min-width: 1024px)");
  const activeColors = getFoliaThemeColors(draftTheme, themeVariant);
  const previewTheme = useMemo<Theme>(
    () => ({
      ...activeColors,
      animationIntensity: "normal",
      fontFamily: fontFamily ?? undefined,
      fontFamilyStack: [],
      fontStyle,
      name: themeVariant === "light" ? "snow" : draftTheme.id,
    }),
    [activeColors, draftTheme.id, fontFamily, fontStyle, themeVariant],
  );
  const editor = (
    <FoliaThemeEditorPanel
      draftTheme={draftTheme}
      onDeleteTheme={onDeleteTheme}
      onDraftChange={onDraftChange}
      onSelectTheme={onSelectTheme}
      selectedTheme={selectedTheme}
    />
  );
  const preview = (
    <FoliaSettingsPreview
      activeSection="common"
      assets={assets}
      onSectionChange={() => undefined}
      theme={previewTheme}
      themeEditorContext={themeEditorContext}
    />
  );

  if (!isDesktopLayout) {
    return (
      <div className="grid min-h-0 gap-4 lg:hidden">
        <div className="min-h-80">{preview}</div>
        <div className="min-h-0">{editor}</div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup className="min-h-0" orientation="horizontal">
      <ResizablePanel defaultSize="68%" minSize="46%">
        <div className="h-full min-h-0 pr-2">{preview}</div>
      </ResizablePanel>
      <ResizableHandle className="mx-1 bg-white/10" withHandle />
      <ResizablePanel defaultSize="32%" minSize="320px" maxSize="460px">
        <div className="h-full min-h-0 pl-2">{editor}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
