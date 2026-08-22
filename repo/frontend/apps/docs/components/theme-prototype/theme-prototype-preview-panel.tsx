"use client";

import { Inspect, Maximize2, Minimize2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@scopify/ui/shadcn/components/button";
import { Tabs, TabsList, TabsTrigger } from "@scopify/ui/shadcn/components/tabs";

import { ShadcnThemeScope } from "@/components/theme-prototype/shadcn-theme-scope";
import { ThemePrototypeCardsShowcase } from "@/components/theme-prototype/theme-prototype-cards-showcase";
import { ThemePrototypeComponentsShowcase } from "@/components/theme-prototype/theme-prototype-components-showcase";
import { ThemePrototypeShowcase } from "@/components/theme-prototype/theme-prototype-showcase";
import type { ThemePrototypePreviewPanelProps } from "@/types/theme-lab";

export function ThemePrototypePreviewPanel({
  draft,
  mode,
  themeId,
}: ThemePrototypePreviewPanelProps) {
  const [activeTab, setActiveTab] = useState("cards");
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <section
      className={
        fullscreen
          ? "bg-background fixed inset-0 z-50 flex min-h-0 flex-col"
          : "flex min-h-0 flex-1 flex-col"
      }
    >
      <div className="flex h-12 shrink-0 items-center border-b px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="gap-1 bg-transparent p-0">
            <TabsTrigger className="rounded-full" value="custom">
              Custom
            </TabsTrigger>
            <TabsTrigger className="rounded-full" value="cards">
              Cards
            </TabsTrigger>
            <TabsTrigger className="rounded-full" value="dashboard">
              Dashboard
            </TabsTrigger>
            <TabsTrigger className="rounded-full" value="application">
              Application
            </TabsTrigger>
            <TabsTrigger className="rounded-full" value="marketing">
              Marketing
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-1">
          <Button asChild className="px-2.5" size="sm" variant="ghost">
            <Link href="/docs/shadcn">Open in UI Library</Link>
          </Button>
          <Button size="icon" variant="ghost" aria-label="检查组件">
            <Inspect />
          </Button>
          <Button size="icon" variant="ghost" aria-label="更多预览">
            <MoreVertical />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={fullscreen ? "退出全屏" : "全屏预览"}
            onClick={() => setFullscreen((current) => !current)}
          >
            {fullscreen ? <Minimize2 /> : <Maximize2 />}
          </Button>
        </div>
      </div>

      <div className="bg-background min-h-0 flex-1 overflow-auto">
        <ShadcnThemeScope className="min-h-full" draft={draft} mode={mode} themeId={themeId}>
          {activeTab === "cards" ? (
            <ThemePrototypeCardsShowcase />
          ) : activeTab === "custom" ? (
            <ThemePrototypeComponentsShowcase />
          ) : (
            <ThemePrototypeShowcase />
          )}
        </ShadcnThemeScope>
      </div>
    </section>
  );
}
