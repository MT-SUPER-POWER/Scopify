"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

import { Button } from "@scopify/ui/shadcn/components/button";
import { Input } from "@scopify/ui/shadcn/components/input";
import { Label } from "@scopify/ui/shadcn/components/label";

import { downloadThemeArtifact, normalizeThemeId } from "@/lib/theme-lab";
import type { ThemeCssArtifact } from "@/types/theme-lab";

interface ThemeExportPanelProps {
  artifacts: ThemeCssArtifact[];
  onThemeIdChange: (value: string) => void;
  themeId: string;
}

export function ThemeExportPanel({ artifacts, onThemeIdChange, themeId }: ThemeExportPanelProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedCss, setCopiedCss] = useState<string>();
  const activeArtifact = artifacts[activeIndex] ?? artifacts[0];
  const copied = activeArtifact?.css === copiedCss;

  const copyCss = async () => {
    if (!activeArtifact) return;
    await navigator.clipboard.writeText(activeArtifact.css);
    setCopiedCss(activeArtifact.css);
  };

  return (
    <section className="bg-background overflow-hidden rounded-xl border">
      <div className="grid gap-4 border-b p-4 lg:grid-cols-[minmax(0,22rem)_1fr] lg:items-end">
        <label className="grid gap-2">
          <Label htmlFor="theme-export-id">主题 ID</Label>
          <Input
            id="theme-export-id"
            onChange={(event) => onThemeIdChange(event.target.value)}
            value={themeId}
          />
          <span className="text-muted-foreground text-xs">
            导出选择器：data-theme=&quot;{normalizeThemeId(themeId)}&quot;
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {artifacts.map((artifact, index) => (
            <Button
              key={artifact.label}
              size="sm"
              variant={activeIndex === index ? "secondary" : "outline"}
              onClick={() => setActiveIndex(index)}
            >
              {artifact.label}
            </Button>
          ))}
        </div>
      </div>
      {activeArtifact ? (
        <>
          <div className="bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2">
            <code className="text-muted-foreground truncate text-xs">{activeArtifact.label}</code>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyCss}>
                {copied ? <Check /> : <Copy />}
                {copied ? "已复制" : "复制"}
              </Button>
              <Button size="sm" onClick={() => downloadThemeArtifact(activeArtifact)}>
                <Download />
                下载 CSS
              </Button>
            </div>
          </div>
          <pre className="max-h-[32rem] overflow-auto p-4 text-xs leading-6">
            <code>{activeArtifact.css}</code>
          </pre>
        </>
      ) : null}
    </section>
  );
}
