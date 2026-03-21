"use client";

import React from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const selectClass =
  "bg-transparent border border-[#727272] text-white py-2 pl-4 pr-10 rounded text-sm font-medium cursor-pointer hover:border-white transition-colors appearance-none outline-none focus:ring-1 focus:ring-white";

export function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        enabled ? "bg-[#1ed760] hover:bg-[#1fdf64]" : "bg-[#535353] hover:bg-[#b3b3b3]"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function SettingInput({
  value,
  onChange,
  type = "text",
  className = "w-28",
  disabled = false,
}: {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      className={cn(
        "bg-transparent border border-[#727272] text-white py-1.5 px-3 rounded text-sm font-medium outline-none focus:border-white transition-colors text-right focus:ring-1 focus:ring-white",
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
    />
  );
}

export function SettingRow({
  label,
  sublabel,
  control,
  isColumn = false,
  requiresRestart = false,
}: {
  label: React.ReactNode;
  sublabel?: string;
  control: React.ReactNode;
  isColumn?: boolean;
  requiresRestart?: boolean;
}) {
  return (
    <div className={cn("mb-6 w-full flex", isColumn ? "flex-col items-start gap-3" : "justify-between items-center")}>
      <div className={cn("flex flex-col gap-1", !isColumn && "max-w-[75%]")}>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white text-base font-medium">{label}</span>
          {requiresRestart && (
            <span className="inline-flex items-center gap-1 text-xs text-[#f59e0b] border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-1.5 py-0.5 rounded font-medium">
              <RotateCcw className="w-2.5 h-2.5" />
              Restart Required
            </span>
          )}
        </div>
        {sublabel ? <span className="text-[#a7a7a7] text-sm leading-relaxed">{sublabel}</span> : null}
      </div>
      {control}
    </div>
  );
}

export function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-xs font-bold text-white uppercase tracking-widest border-b border-[#282828] pb-2 mb-6">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function SettingSelect({
  value,
  onChange,
  children,
  disabled = false,
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={cn("relative", disabled && "opacity-40 cursor-not-allowed")}>
      <select
        className={cn(selectClass, disabled && "pointer-events-none")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 text-white absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

export function SettingsLoadingState() {
  return (
    <div className="w-full bg-[#121212] rounded-lg min-h-[80vh] flex items-center justify-center">
      <span className="text-white animate-pulse text-3xl">Loading settings...</span>
    </div>
  );
}

export function SaveChangesButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  return (
    <div
      className={cn(
        "fixed bottom-28 left-1/2 -translate-x-1/2 z-50 transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <button
        onClick={onClick}
        className="flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-base bg-[#1ed760] text-black hover:bg-[#1fdf64] hover:scale-105 active:scale-100 shadow-[0_8px_24px_rgba(30,215,96,0.3)] transition-all cursor-pointer"
      >
        Save Changes
      </button>
    </div>
  );
}

export function SaveConfirmModal({
  open,
  isSaving,
  onClose,
  onConfirm,
  requiresRestart = false,
  isWeb = false,
}: {
  open: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
  requiresRestart?: boolean;
  isWeb?: boolean;
}) {
  if (!open) return null;

  const subtitle = isWeb
    ? "网络设置将在页面刷新后完全生效，其余设置立即生效。"
    : requiresRestart
    ? '标记"重启生效"的配置需要重启应用程序才能完全生效，其余配置立即生效。'
    : "是否确认保存？修改将立即生效。";

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#282828] w-100 rounded-xl shadow-2xl p-8 flex flex-col items-center text-center relative"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight">Confirm Changes</h2>
          <p className="text-[#b3b3b3] text-sm">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <button
            onClick={onConfirm}
            disabled={isSaving}
            className="flex flex-col items-center justify-center w-full py-3.5 rounded-full bg-[#1ed760] hover:bg-[#1fdf64] hover:scale-105 transition-all active:scale-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="text-black font-bold text-base">
              {isSaving ? "Saving..." : "Confirm"}
            </span>
          </button>
          <button
            onClick={onClose}
            className="flex flex-col items-center justify-center w-full py-3.5 rounded-full bg-transparent border border-[#727272] hover:border-white hover:scale-105 transition-all active:scale-100"
          >
            <span className="text-white font-bold text-base">Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
