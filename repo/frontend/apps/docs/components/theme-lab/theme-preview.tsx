"use client";

import { Heart, MoreHorizontal, Play, Search } from "lucide-react";

import { Badge } from "@scopify/ui/shadcn/components/badge";
import { Button } from "@scopify/ui/shadcn/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@scopify/ui/shadcn/components/card";
import { Input } from "@scopify/ui/shadcn/components/input";
import { Progress } from "@scopify/ui/shadcn/components/progress";
import { Switch } from "@scopify/ui/shadcn/components/switch";

import type { ThemeLabScope, ThemeMode, ThemePreviewStyle } from "@/types/theme-lab";

interface ThemePreviewProps {
  mode: ThemeMode;
  scope: ThemeLabScope;
  sourceThemeId: string;
  style: ThemePreviewStyle;
}

export function ThemePreview({ mode, scope, sourceThemeId, style }: ThemePreviewProps) {
  return (
    <section
      className={mode === "dark" ? "dark" : undefined}
      data-theme={sourceThemeId}
      style={style}
    >
      <div className="bg-background text-foreground min-h-[38rem] overflow-hidden rounded-xl border shadow-sm">
        <header className="bg-card flex items-center gap-3 border-b px-4 py-3">
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg font-bold">
            S
          </span>
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input className="bg-muted h-9 pl-9" placeholder="搜索音乐和组件" />
          </div>
          <Button size="icon" variant="ghost" aria-label="更多">
            <MoreHorizontal />
          </Button>
        </header>

        <div className="grid min-h-[34rem] grid-cols-[8.5rem_1fr]">
          <aside className="bg-sidebar text-sidebar-foreground space-y-2 border-r p-3">
            <Badge className="mb-3" variant="secondary">
              Theme Lab
            </Badge>
            {[
              ["发现音乐", true],
              ["最近播放", false],
              ["我的收藏", false],
            ].map(([label, active]) => (
              <div
                className={
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground rounded-md px-3 py-2 text-sm"
                    : "text-muted-foreground px-3 py-2 text-sm"
                }
                key={String(label)}
              >
                {label}
              </div>
            ))}
          </aside>

          <main className="min-w-0 space-y-4 p-5">
            <div className="from-primary/25 via-accent to-secondary rounded-xl bg-gradient-to-br p-5">
              <Badge>实时预览</Badge>
              <h2 className="mt-4 text-2xl font-semibold">组件会立即读取你修改后的 Token</h2>
              <p className="text-muted-foreground mt-2 text-sm">
                按钮、表单、图表和产品语义都在同一个隔离容器中。
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button>
                  <Play />
                  立即播放
                </Button>
                <Button variant="secondary">
                  <Heart />
                  收藏
                </Button>
                <Button variant="outline">查看详情</Button>
              </div>
            </div>

            <div className="grid gap-4 2xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>本周播放趋势</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex h-24 items-end gap-2">
                    {[42, 68, 54, 86, 72].map((height, index) => (
                      <span
                        className="flex-1 rounded-t-md"
                        key={height}
                        style={{ background: `var(--chart-${index + 1})`, height: `${height}%` }}
                      />
                    ))}
                  </div>
                  <Progress value={68} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>播放设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <label className="flex items-center justify-between gap-3">
                    <span>无缝播放</span>
                    <Switch defaultChecked />
                  </label>
                  <label className="flex items-center justify-between gap-3">
                    <span>桌面歌词</span>
                    <Switch />
                  </label>
                  <Input defaultValue="Scopify Mix" />
                </CardContent>
              </Card>
            </div>

            {scope === "scopify" ? (
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <span className="bg-success text-success-foreground rounded-lg p-3">成功状态</span>
                <span className="bg-info text-info-foreground rounded-lg p-3">信息状态</span>
                <span className="bg-warning text-warning-foreground rounded-lg p-3">警告状态</span>
                <span className="bg-danger text-danger-foreground rounded-lg p-3">危险状态</span>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </section>
  );
}
