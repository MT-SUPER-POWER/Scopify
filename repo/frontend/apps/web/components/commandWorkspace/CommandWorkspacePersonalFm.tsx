"use client";

import { ChevronLeft, RadioTower, X } from "lucide-react";
import { CommandWorkspaceFmPlayback } from "@/components/commandWorkspace/CommandWorkspaceFmPlayback";
import { CommandWorkspaceFmHeader } from "@/components/commandWorkspace/CommandWorkspaceFmHeader";
import { CommandWorkspaceFmMatrix } from "@/components/commandWorkspace/CommandWorkspaceFmMatrix";
import { CommandWorkspaceQueue } from "@/components/commandWorkspace/CommandWorkspaceQueue";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCommandWorkspacePersonalFm } from "@/hooks/commandWorkspace/useCommandWorkspacePersonalFm";
import type { CommandWorkspacePersonalFmProps } from "@/types/commandWorkspacePersonalFm";

export function CommandWorkspacePersonalFm({ onBack, onClose }: CommandWorkspacePersonalFmProps) {
  const model = useCommandWorkspacePersonalFm(onBack);
  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.defaultPrevented && !event.nativeEvent.isComposing) {
          event.preventDefault();
          event.stopPropagation();
          model.back();
        }
      }}
    >
      {model.showQueue ? (
        <>
          <header className="flex items-center gap-3 border-b border-white/8 px-4 py-4 text-sm text-zinc-200">
            <button
              autoFocus
              type="button"
              onClick={model.back}
              aria-label="返回私人 FM"
              className="rounded p-1 hover:bg-white/10"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="flex-1">播放队列</span>
            <button type="button" onClick={onClose} aria-label="关闭搜索">
              <X className="size-4" />
            </button>
          </header>
          <CommandWorkspaceQueue onClose={onClose} />
        </>
      ) : (
        <>
          <CommandWorkspaceFmHeader
            query={model.query}
            onQueryChange={model.setQuery}
            onKeyDown={model.handleKeyDown}
            onBack={model.back}
            onClose={onClose}
            onToggleHelp={model.toggleHelp}
            showHelp={model.showHelp}
          />
          <ScrollArea className="h-[min(64vh,28rem)]">
            <div className="space-y-6 px-5 py-7 sm:px-12 sm:py-9">
              <header className="flex items-center gap-3">
                <RadioTower
                  className={`text-brand size-5 shrink-0 ${model.isLoading ? "animate-pulse" : ""}`}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-semibold text-zinc-200">
                    {model.t("personalFm.settings.title")}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    {model.t("personalFm.settings.description")}
                  </p>
                </div>
                <span
                  role="status"
                  className="max-w-36 text-right text-sm font-semibold text-zinc-200"
                >
                  {model.isLoading ? model.t("personalFm.status.loading") : model.selectionLabel}
                </span>
              </header>
              {model.showHelp ? (
                <p className="rounded-lg bg-white/5 p-3 text-xs leading-6 text-zinc-400">
                  可搜索模式、场景、曲风和语种；↑↓ 选择，Enter 应用，Esc 返回。正在播放私人 FM
                  时，切换会重新生成歌曲；其他播放来源下仅保存偏好，点击「开始私人 FM」后播放。
                </p>
              ) : null}
              <CommandWorkspaceFmMatrix
                groups={model.groups}
                selection={model.selection}
                highlightedId={model.highlightedId}
                disabled={model.isLoading}
                onSelect={model.select}
              />
              {model.error ? (
                <div
                  role="alert"
                  className="flex items-center justify-between gap-3 text-xs text-red-300"
                >
                  <span>{model.error}</span>
                  <button
                    type="button"
                    disabled={model.isLoading}
                    onClick={model.start}
                    className="shrink-0 underline"
                  >
                    重试
                  </button>
                </div>
              ) : null}
              {!model.isActive && !model.error ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={model.isLoading}
                    onClick={model.start}
                    className="bg-brand text-brand-foreground rounded-full px-4 py-2 text-xs font-medium disabled:opacity-45"
                  >
                    开始私人 FM
                  </button>
                </div>
              ) : null}
            </div>
          </ScrollArea>
          <CommandWorkspaceFmPlayback isLoading={model.isLoading} onOpenQueue={model.openQueue} />
        </>
      )}
    </div>
  );
}
