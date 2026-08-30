"use client";

import { MonitorCog, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/store/module/ui";

interface CommandWorkspaceSettingsProps {
  onClose(): void;
}

export function CommandWorkspaceSettings({ onClose }: CommandWorkspaceSettingsProps) {
  const router = useRouter();
  const openLyrics = useUiStore((state) => state.setIsLyricsOpen);

  return (
    <div className="space-y-2 p-3">
      <button
        type="button"
        onClick={() => {
          router.push("/setting", { scroll: false });
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-zinc-200 hover:bg-white/8 hover:text-white"
      >
        <Settings2 className="size-4 text-zinc-300" />
        <span>
          <span className="block text-sm font-medium">应用设置</span>
          <span className="text-xs text-zinc-500">账户、播放、快捷键与网络</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          openLyrics(true);
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-zinc-200 hover:bg-white/8 hover:text-white"
      >
        <Sparkles className="size-4 text-zinc-300" />
        <span>
          <span className="block text-sm font-medium">Folia 舞台</span>
          <span className="text-xs text-zinc-500">打开沉浸歌词和视觉设置</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          router.push("/setting?tab=desktop", { scroll: false });
          onClose();
        }}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-zinc-200 hover:bg-white/8 hover:text-white"
      >
        <MonitorCog className="size-4 text-zinc-300" />
        <span>
          <span className="block text-sm font-medium">桌面播放</span>
          <span className="text-xs text-zinc-500">壁纸、图标与桌面播放偏好</span>
        </span>
      </button>
    </div>
  );
}
