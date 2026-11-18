"use client";

import {
  Activity,
  CheckCheck,
  FastForward,
  Music,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Volume2,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MCP_PLAYBACK_CAPABILITIES, type McpCapability } from "@scopify/desktop-contract";
import { useTranslation } from "react-i18next";

import type {
  CapabilityItemDef,
  McpCapabilitiesModalProps,
  McpGranularCapability,
} from "@/types/settings/components";
import { Toggle } from "./SettingsUI";

// 完全对齐 Ctrl + / 快捷键帮助界面的沉浸式深色二级弹窗，Portal 挂载至 document.body
// 统合音频操作 playback tools 下的所有状态读取与播放控制权限

const ALL_GRANULAR_CAPABILITIES = MCP_PLAYBACK_CAPABILITIES;

/**
 * 将配置数组中的粗粒度或细粒度权限解析为当前激活的细粒度权限集合
 */
export function resolveActiveGranularCapabilities(
  capabilities: readonly McpCapability[],
): Set<McpGranularCapability> {
  const active = new Set<McpGranularCapability>();
  for (const cap of capabilities) {
    if (cap === "playback.read") {
      active.add("playback.read.status");
      active.add("playback.read.track");
    } else if (cap === "playback.control") {
      active.add("playback.control.play");
      active.add("playback.control.pause");
      active.add("playback.control.toggle");
      active.add("playback.control.next");
      active.add("playback.control.previous");
      active.add("playback.control.seek");
      active.add("playback.control.volume");
    } else if ((ALL_GRANULAR_CAPABILITIES as readonly string[]).includes(cap)) {
      active.add(cap as McpGranularCapability);
    }
  }
  return active;
}

const PLAYBACK_CAPABILITY_ITEMS: readonly CapabilityItemDef[] = [
  {
    capability: "playback.read.status",
    icon: Activity,
    labelKey: "settings.mcp.capability.readStatus.label",
    sublabelKey: "settings.mcp.capability.readStatus.sublabel",
    toolName: "get_playback_status",
  },
  {
    capability: "playback.read.track",
    icon: Music,
    labelKey: "settings.mcp.capability.readTrack.label",
    sublabelKey: "settings.mcp.capability.readTrack.sublabel",
    toolName: "get_now_playing",
  },
  {
    capability: "playback.control.play",
    icon: Play,
    labelKey: "settings.mcp.capability.controlPlay.label",
    sublabelKey: "settings.mcp.capability.controlPlay.sublabel",
    toolName: "play",
  },
  {
    capability: "playback.control.pause",
    icon: Pause,
    labelKey: "settings.mcp.capability.controlPause.label",
    sublabelKey: "settings.mcp.capability.controlPause.sublabel",
    toolName: "pause",
  },
  {
    capability: "playback.control.toggle",
    icon: SlidersHorizontal,
    labelKey: "settings.mcp.capability.controlToggle.label",
    sublabelKey: "settings.mcp.capability.controlToggle.sublabel",
    toolName: "toggle_playback",
  },
  {
    capability: "playback.control.next",
    icon: SkipForward,
    labelKey: "settings.mcp.capability.controlNext.label",
    sublabelKey: "settings.mcp.capability.controlNext.sublabel",
    toolName: "next_track",
  },
  {
    capability: "playback.control.previous",
    icon: SkipBack,
    labelKey: "settings.mcp.capability.controlPrevious.label",
    sublabelKey: "settings.mcp.capability.controlPrevious.sublabel",
    toolName: "previous_track",
  },
  {
    capability: "playback.control.seek",
    icon: FastForward,
    labelKey: "settings.mcp.capability.controlSeek.label",
    sublabelKey: "settings.mcp.capability.controlSeek.sublabel",
    toolName: "seek",
  },
  {
    capability: "playback.control.volume",
    icon: Volume2,
    labelKey: "settings.mcp.capability.controlVolume.label",
    sublabelKey: "settings.mcp.capability.controlVolume.sublabel",
    toolName: "set_volume",
  },
];

export function McpCapabilitiesModal({
  capabilities,
  onCapabilitiesChange,
  onClose,
  open,
}: McpCapabilitiesModalProps) {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);
  const activeSet = resolveActiveGranularCapabilities(capabilities);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const toggleItem = (capability: McpGranularCapability) => {
    const nextSet = new Set<McpCapability>(activeSet);
    if (nextSet.has(capability)) {
      nextSet.delete(capability);
    } else {
      nextSet.add(capability);
    }
    onCapabilitiesChange([...nextSet]);
  };

  const handleEnableAll = () => {
    onCapabilitiesChange([...ALL_GRANULAR_CAPABILITIES]);
  };

  const handleDisableAll = () => {
    onCapabilitiesChange([]);
  };

  if (!isMounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-120 flex items-center justify-center bg-overlay p-4 backdrop-blur-sm"
          onMouseDown={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="relative scrollbar-thin h-[min(78dvh,720px)] max-h-[calc(100dvh-2rem)] w-full max-w-[806px] [scrollbar-gutter:stable] overflow-y-auto rounded-2xl border border-border bg-surface-overlay px-5 pt-[18px] pb-10 text-content shadow-floating sm:px-18"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <h2 className="text-[22px] leading-7 font-semibold tracking-[-0.02em]">
                  {t("settings.mcp.modal.title")}
                </h2>
                <p className="mt-1 text-[15px] leading-5 text-content-muted">
                  {t("settings.mcp.modal.description")}
                </p>
              </div>
              <button
                type="button"
                title={t("common.action.close") || "关闭"}
                aria-label={t("common.action.close") || "关闭"}
                onClick={onClose}
                className="absolute top-4 right-6 flex size-8 items-center justify-center rounded text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
              >
                <X className="stroke-1.5 size-[18px]" />
              </button>
            </header>

            {/* 快捷操作：全部开启 / 全部关闭 */}
            <div className="mt-4 flex max-w-155 items-center justify-end gap-2 border-b border-border pb-3">
              <button
                type="button"
                onClick={handleEnableAll}
                className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium transition-colors hover:bg-surface-sunken"
              >
                <CheckCheck className="size-3.5 text-brand" />
                {t("settings.mcp.modal.enableAll")}
              </button>
              <button
                type="button"
                onClick={handleDisableAll}
                className="inline-flex items-center gap-1.5 rounded border border-border bg-surface-elevated px-2.5 py-1 text-xs font-medium transition-colors hover:bg-surface-sunken"
              >
                <XCircle className="size-3.5 text-danger" />
                {t("settings.mcp.modal.disableAll")}
              </button>
            </div>

            {/* 内容区：单一受控音频播放工具列表 */}
            <div className="mt-6 max-w-155 space-y-6">
              <section>
                <h3 className="mb-2 text-[13px] font-semibold tracking-normal text-content-muted uppercase">
                  {t("settings.mcp.modal.group.playback")}
                </h3>
                <div className="divide-y divide-border">
                  {PLAYBACK_CAPABILITY_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isEnabled = activeSet.has(item.capability);
                    return (
                      <div
                        key={item.capability}
                        className="grid min-h-10 grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-1 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Icon className="size-3.5 shrink-0 text-content-muted" />
                          <span className="truncate text-[15px] leading-5">{t(item.labelKey)}</span>
                          <span className="font-mono text-xs text-content-muted">
                            ({item.toolName})
                          </span>
                        </div>
                        <Toggle enabled={isEnabled} onChange={() => toggleItem(item.capability)} />
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
