"use client";

import { CircleHelp, Search, X } from "lucide-react";
import { useI18n } from "@/store/module/i18n";
import type { CommandWorkspaceFmHeaderProps } from "@/types/commandWorkspacePersonalFm";

export function CommandWorkspaceFmHeader({
  query,
  onQueryChange,
  onKeyDown,
  onBack,
  onClose,
  onToggleHelp,
  showHelp,
}: CommandWorkspaceFmHeaderProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2 border-b border-white/8 p-4 sm:gap-3">
      <Search className="size-4 shrink-0 text-zinc-400" />
      <button
        type="button"
        onClick={onBack}
        aria-label="返回上一级"
        className="flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-zinc-200"
      >
        {t("personalFm.settings.title")}
        <X className="size-3" />
      </button>
      <input
        autoFocus
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="输入以筛选模式和场景"
        aria-label="筛选私人 FM 模式和场景"
        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
      />
      <button
        type="button"
        onClick={onToggleHelp}
        aria-label="私人 FM 操作帮助"
        aria-expanded={showHelp}
        className="shrink-0 rounded p-1 text-zinc-400 hover:bg-white/10"
      >
        <CircleHelp className="size-4" />
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="关闭搜索"
        className="shrink-0 rounded p-1 text-zinc-400 hover:bg-white/10"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
