"use client";

import { useState } from "react";

import { FoliaThemeEditor } from "@/components/lyrics/FoliaThemeEditor";
import { FoliaThemeLibraryList } from "@/components/lyrics/FoliaThemeLibraryList";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import type {
  FoliaThemeLibraryPanelHandle,
  FoliaThemeWorkbenchLayoutProps,
} from "@/types/components/lyrics";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@scopify/ui/shadcn/components/resizable";

export function FoliaThemeWorkbenchLayout({
  activeThemeId,
  assets,
  draftTheme,
  isDirty,
  onDeleteTheme,
  onDraftChange,
  onSelectTheme,
  selectedTheme,
  selectedThemeId,
  themeEditorContext,
}: FoliaThemeWorkbenchLayoutProps) {
  const isDesktopLayout = useMediaQuery("(min-width: 1024px)");
  const [collapsed, setCollapsed] = useState(false);
  const [libraryPanel, setLibraryPanel] = useState<FoliaThemeLibraryPanelHandle | null>(null);
  const toggleLibrary = () => {
    const nextCollapsed = !collapsed;
    setCollapsed(nextCollapsed);
    if (!libraryPanel) {
      return;
    }
    if (nextCollapsed) libraryPanel.collapse();
    else libraryPanel.expand();
  };
  const library = (
    <FoliaThemeLibraryList
      activeThemeId={activeThemeId}
      collapsed={collapsed}
      isDirty={isDirty}
      onSelectTheme={onSelectTheme}
      onToggleCollapsed={toggleLibrary}
      selectedThemeId={selectedThemeId}
    />
  );
  const editor = (
    <FoliaThemeEditor
      assets={assets}
      draftTheme={draftTheme}
      onDeleteTheme={onDeleteTheme}
      onDraftChange={onDraftChange}
      onSelectTheme={onSelectTheme}
      selectedTheme={selectedTheme}
      themeEditorContext={themeEditorContext}
    />
  );

  if (!isDesktopLayout) {
    return (
      <div className="visualizer-overlay-scrollbar grid h-full min-h-0 gap-4 overflow-y-auto">
        <div className="min-h-52">{library}</div>
        {editor}
      </div>
    );
  }

  return (
    <ResizablePanelGroup className="min-h-0" orientation="horizontal">
      <ResizablePanel
        collapsedSize="64px"
        collapsible
        defaultSize="18%"
        maxSize="320px"
        minSize="176px"
        onResize={(size) => {
          if (size.inPixels <= 80) {
            setCollapsed(true);
            return;
          }
          if (collapsed) requestAnimationFrame(() => libraryPanel?.collapse());
        }}
        panelRef={setLibraryPanel}
      >
        <div className={`h-full min-h-0 ${collapsed ? "pr-0" : "pr-2"}`}>{library}</div>
      </ResizablePanel>
      <ResizableHandle
        className={collapsed ? "mx-0 bg-transparent" : "mx-1 bg-white/10"}
        withHandle={!collapsed}
      />
      <ResizablePanel defaultSize="82%" minSize="52%">
        <div className="h-full min-h-0 pl-2">{editor}</div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
