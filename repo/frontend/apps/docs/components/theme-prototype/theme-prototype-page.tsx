"use client";

import { LoaderCircle } from "lucide-react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@scopify/ui/shadcn/components/resizable";

import { ThemePrototypeActionBar } from "@/components/theme-prototype/theme-prototype-action-bar";
import { ThemePrototypeControls } from "@/components/theme-prototype/theme-prototype-controls";
import { ThemePrototypeHeader } from "@/components/theme-prototype/theme-prototype-header";
import { ThemePrototypePresetBar } from "@/components/theme-prototype/theme-prototype-preset-bar";
import { ThemePrototypePreviewPanel } from "@/components/theme-prototype/theme-prototype-preview-panel";
import { useThemeLab } from "@/hooks/use-theme-lab";
import { useThemePrototype } from "@/hooks/use-theme-prototype";
import { downloadThemeArtifact, normalizeThemeId } from "@/lib/theme-lab";

export function ThemePrototypePage() {
  const themeLab = useThemeLab("shadcn");
  const themePrototype = useThemePrototype();
  const ready = Boolean(themeLab.draft.light["--background"]);

  const saveAndApply = () => {
    const id = themePrototype.saveTheme(themeLab.themeId, themeLab.draft);
    themePrototype.applyTheme(id);
    themePrototype.setMode(themeLab.mode);
  };

  const exportCss = () => {
    const artifact = themeLab.artifacts[0];
    if (artifact) downloadThemeArtifact(artifact);
  };

  if (themeLab.error) {
    return (
      <main className="grid h-svh place-items-center text-sm text-red-500">{themeLab.error}</main>
    );
  }

  if (!ready) {
    return (
      <main className="flex h-svh items-center justify-center gap-2">
        <LoaderCircle className="animate-spin" /> 正在读取 Shadcn Default
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground isolate flex h-svh min-w-[72rem] flex-col overflow-hidden">
      <ThemePrototypeHeader />

      <ResizablePanelGroup className="min-h-0 flex-1" orientation="horizontal">
        <ResizablePanel defaultSize="22%" minSize="20%" maxSize="34%">
          <div className="flex h-full min-h-0 flex-col">
            <ThemePrototypePresetBar
              mode={themeLab.mode}
              themeId={themeLab.themeId}
              values={themeLab.draft[themeLab.mode]}
              onThemeIdChange={themeLab.setThemeId}
            />
            <ThemePrototypeControls
              definitions={themeLab.definitions}
              onTokenChange={themeLab.updateToken}
              values={themeLab.draft[themeLab.mode]}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize="78%">
          <div className="flex h-full min-h-0 flex-col">
            <ThemePrototypeActionBar
              mode={themeLab.mode}
              onExport={exportCss}
              onModeChange={themeLab.setMode}
              onReset={themeLab.reset}
              onSave={saveAndApply}
            />

            <ThemePrototypePreviewPanel
              draft={themeLab.draft}
              mode={themeLab.mode}
              themeId={normalizeThemeId(themeLab.themeId)}
            />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </main>
  );
}
