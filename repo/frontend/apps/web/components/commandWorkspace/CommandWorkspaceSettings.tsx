"use client";

import { MonitorCog, Palette, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShortcutCommands } from "@/hooks/shortcuts/useShortcutCommands";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import type {
  CommandWorkspaceSettingsItem,
  CommandWorkspaceSettingsProps,
} from "@/types/commandWorkspace";

export function CommandWorkspaceSettings({ onClose }: CommandWorkspaceSettingsProps) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const executeShortcut = useShortcutCommands();
  const commands = useShortcutRegistry().commands;
  const navigate = useCallback(
    (path: string) => {
      router.push(path, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    setIsDesktop(runtime.isDesktop);
  }, []);

  const items: CommandWorkspaceSettingsItem[] = useMemo(() => {
    const list: CommandWorkspaceSettingsItem[] = [
      {
        action: () => {
          navigate("/setting");
          onClose();
        },
        icon: Settings2,
        id: "app-settings",
        label: "应用设置",
        summary: "账户、播放、快捷键与网络",
      },
      {
        action: () => {
          executeShortcut("open-folia-settings");
          onClose();
        },
        icon: Sparkles,
        id: "folia-settings",
        label: "Folia 视觉设置",
        shortcutId: "open-folia-settings",
        summary: "歌词、外观和舞台效果",
      },
      {
        action: () => {
          executeShortcut("open-folia-theme-library");
          onClose();
        },
        icon: Palette,
        id: "folia-theme-library",
        label: "Folia 主题库",
        shortcutId: "open-folia-theme-library",
        summary: "浏览、应用和管理视觉主题",
      },
    ];

    if (isDesktop) {
      list.push({
        action: () => {
          navigate("/setting?tab=desktop");
          onClose();
        },
        icon: MonitorCog,
        id: "desktop-playback",
        label: "桌面播放",
        summary: "壁纸、图标与桌面播放偏好",
      });
    }

    return list;
  }, [executeShortcut, isDesktop, navigate, onClose]);

  return (
    <ScrollArea className="h-[min(52vh,32rem)]">
      <div className="space-y-0.5 px-2.5 py-2">
        {items.map((item, index) => {
          const Icon = item.icon;
          const shortcut = item.shortcutId ? commands.find((c) => c.id === item.shortcutId) : null;
          const bindingLabel = shortcut?.binding ? getShortcutBindingLabel(shortcut.binding) : null;

          return (
            <button
              key={item.id}
              type="button"
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={item.action}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors",
                selectedIndex === index ? "bg-white/10" : "hover:bg-white/6",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/8 text-zinc-300">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">{item.label}</span>
                <span className="block truncate text-xs text-zinc-500">{item.summary}</span>
              </span>
              {bindingLabel ? (
                <kbd className="rounded-md border border-white/15 bg-white/8 px-2 py-1 font-mono text-xs leading-none text-zinc-200 shadow-sm">
                  {bindingLabel}
                </kbd>
              ) : null}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
