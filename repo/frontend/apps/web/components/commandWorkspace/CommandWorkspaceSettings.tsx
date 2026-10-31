"use client";

import { Check, MonitorCog, RectangleEllipsis, Search, Settings2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCommandWorkspaceQuickSettings } from "@/hooks/commandWorkspace/useCommandWorkspaceQuickSettings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShortcutRegistry } from "@/hooks/shortcuts/useShortcutRegistry";
import { getShortcutBindingLabel } from "@/lib/shortcuts/bindings";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import type {
  CommandWorkspaceSettingsItem,
  CommandWorkspaceSettingsProps,
} from "@/types/commandWorkspace/model";

export function CommandWorkspaceSettings({
  onClose,
  onOpenFolia,
  onOpenDynamicIsland,
}: CommandWorkspaceSettingsProps) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const quickSettings = useCommandWorkspaceQuickSettings();
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
        action: () => onOpenFolia("folia-settings"),
        icon: Settings2,
        id: "folia-settings",
        label: "Folia 设置",
        summary: "视觉设置与主题工作台",
      },
      {
        action: () => onOpenFolia("folia-visualizers"),
        icon: Sparkles,
        id: "folia-visualizers",
        label: "选择可视化",
        summary: "切换 Folia 歌词演出效果",
      },
    ];

    if (isDesktop) {
      list.push({
        action: onOpenDynamicIsland,
        icon: RectangleEllipsis,
        id: "dynamic-island",
        label: "灵动岛设置",
        summary: "开关、换行动画、大小、翻译、吸附居中、非遮挡与置顶",
      });
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

    return [
      ...quickSettings.map((item) => ({
        ...item,
        action: () => {
          item.action();
          onClose();
        },
      })),
      ...list,
    ];
  }, [isDesktop, navigate, onClose, onOpenFolia, onOpenDynamicIsland, quickSettings]);

  const terms = query.trim().toLocaleLowerCase().split(/\s+/);
  const filteredItems = items.filter((item) => {
    const text = `${item.label} ${item.summary} ${item.keywords ?? ""}`.toLocaleLowerCase();
    return terms.every((term) => text.includes(term));
  });

  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, query]);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
        <Search className="size-4 shrink-0 text-content-muted" />
        <input
          autoFocus
          aria-label="搜索设置"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const direction = event.key === "ArrowDown" ? 1 : -1;
              setSelectedIndex((index) =>
                filteredItems.length
                  ? (index + direction + filteredItems.length) % filteredItems.length
                  : 0,
              );
            }
            if (event.key === "Enter") {
              event.preventDefault();
              filteredItems[selectedIndex]?.action();
            }
          }}
          placeholder="搜索语言、外观、刷新率或更多设置…"
          className="min-w-0 flex-1 border-none bg-transparent text-sm font-medium text-content outline-none placeholder:text-content/40"
        />
      </div>
      <ScrollArea className="h-[min(52vh,32rem)]">
        <div ref={listRef} className="space-y-0.5 px-2.5 py-2">
          {filteredItems.map((item, index) => {
            const Icon = item.icon;
            const shortcut = item.shortcutId
              ? commands.find((c) => c.id === item.shortcutId)
              : null;
            const bindingLabel = shortcut?.binding
              ? getShortcutBindingLabel(shortcut.binding)
              : null;

            return (
              <button
                key={item.id}
                type="button"
                data-selected={selectedIndex === index}
                aria-pressed={item.active}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={item.action}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3.5 py-2.5 text-left transition-colors",
                  selectedIndex === index ? "bg-content/10" : "hover:bg-content/6",
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-content/8 text-content-muted">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-content">
                    {item.label}
                  </span>
                  <span className="block truncate text-xs text-content-muted">{item.summary}</span>
                </span>
                {item.active ? <Check aria-label="当前选择" className="size-4 shrink-0" /> : null}
                {bindingLabel ? (
                  <kbd className="rounded-md border border-border bg-content/8 px-2 py-1 font-mono text-xs leading-none text-content shadow-sm">
                    {bindingLabel}
                  </kbd>
                ) : null}
              </button>
            );
          })}
          {filteredItems.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-content-muted">没有匹配的设置。</p>
          ) : null}
        </div>
      </ScrollArea>
    </>
  );
}
