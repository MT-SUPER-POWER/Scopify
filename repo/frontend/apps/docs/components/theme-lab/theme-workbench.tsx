"use client";

import { LoaderCircle, RotateCcw } from "lucide-react";

import { Button } from "@scopify/ui/shadcn/components/button";

import { ThemeControlPanel } from "@/components/theme-lab/theme-control-panel";
import { ThemeExportPanel } from "@/components/theme-lab/theme-export-panel";
import { ThemePreview } from "@/components/theme-lab/theme-preview";
import { useThemeLab } from "@/hooks/use-theme-lab";
import type { ThemeLabScope } from "@/types/theme-lab";

interface ThemeWorkbenchProps {
  scope: ThemeLabScope;
}

export function ThemeWorkbench({ scope }: ThemeWorkbenchProps) {
  const themeLab = useThemeLab(scope);
  const isReady = Boolean(themeLab.draft.light["--background"]);

  if (themeLab.error) {
    return (
      <div className="not-prose border-destructive/40 bg-destructive/10 text-destructive my-6 rounded-xl border p-5 text-sm">
        {themeLab.error}
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="not-prose my-6 flex min-h-64 items-center justify-center rounded-xl border">
        <LoaderCircle className="animate-spin" />
        正在读取主题变量
      </div>
    );
  }

  return (
    <div className="not-prose my-8 space-y-4">
      <div className="bg-card text-card-foreground flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div>
          <p className="font-semibold">
            {scope === "shadcn" ? "Shadcn Theme Lab" : "Scopify Theme Lab"}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {scope === "shadcn"
              ? "只编辑 Shadcn 标准 Token，导出一份基础主题。"
              : "分别编辑基础与扩展 Token，导出两份同 ID 主题文件。"}
          </p>
        </div>
        <Button variant="outline" onClick={themeLab.reset}>
          <RotateCcw />
          恢复默认值
        </Button>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(24rem,0.75fr)]">
        <div className="xl:sticky xl:top-20">
          <ThemePreview
            mode={themeLab.mode}
            scope={scope}
            sourceThemeId={themeLab.sourceThemeId}
            style={themeLab.previewStyle}
          />
        </div>
        <ThemeControlPanel
          definitions={themeLab.definitions}
          layer={themeLab.layer}
          mode={themeLab.mode}
          onLayerChange={themeLab.setLayer}
          onModeChange={themeLab.setMode}
          onTokenChange={themeLab.updateToken}
          scope={scope}
          values={themeLab.draft[themeLab.mode]}
        />
      </div>

      <ThemeExportPanel
        artifacts={themeLab.artifacts}
        onThemeIdChange={themeLab.setThemeId}
        themeId={themeLab.themeId}
      />
    </div>
  );
}
