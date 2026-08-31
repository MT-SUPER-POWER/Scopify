"use client";

import { CircleHelp } from "lucide-react";
import type { CommandWorkspaceHelpProps } from "@/types/commandWorkspace";

export function CommandWorkspaceHelp({ page }: CommandWorkspaceHelpProps) {
  const details =
    page === "queue"
      ? "可播放、移到下一首、调整顺序或移除曲目。"
      : page === "search"
        ? "Enter 播放歌曲；选择集合可进入曲目列表，使用 + 加入队列。"
        : page === "track-list"
          ? "播放全部，或将单曲加入队列、插到下一首。"
          : "Esc 返回，Ctrl+Home 回到命令根目录。";

  return (
    <div className="flex items-start gap-2 border-t border-white/10 bg-white/5 px-5 py-3 text-xs text-zinc-400">
      <CircleHelp className="mt-0.5 size-3.5 shrink-0 text-zinc-300" />
      {details}
    </div>
  );
}
