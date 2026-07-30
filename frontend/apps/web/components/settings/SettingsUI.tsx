"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import type React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

const selectClass =
  "bg-transparent border border-[#727272] text-white py-2 pl-4 pr-10 rounded text-sm font-medium cursor-pointer hover:border-white transition-colors appearance-none outline-none focus:ring-1 focus:ring-white";

export function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        enabled ? "bg-[#1ed760] hover:bg-[#1fdf64]" : "bg-[#535353] hover:bg-[#b3b3b3]",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0",
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
  placeholder,
}: {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        "rounded border border-[#727272] bg-transparent px-3 py-1.5 text-right text-sm font-medium text-white transition-colors outline-none placeholder:text-[#727272] focus:border-white focus:ring-1 focus:ring-white",
        disabled && "cursor-not-allowed opacity-40",
        className,
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
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "mb-6 flex w-full",
        isColumn ? "flex-col items-start gap-3" : "items-center justify-between",
      )}
    >
      <div className={cn("flex flex-col gap-1", !isColumn && "max-w-[75%]")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-medium text-white">{label}</span>
          {requiresRestart ? (
            <span className="inline-flex items-center gap-1 rounded border border-[#f59e0b]/40 bg-[#f59e0b]/10 px-1.5 py-0.5 text-xs font-medium text-[#f59e0b]">
              <RotateCcw className="size-2.5" />
              {t("settings.restartRequired")}
            </span>
          ) : null}
        </div>
        {sublabel ? (
          <span className="text-sm leading-relaxed text-[#a7a7a7]">{sublabel}</span>
        ) : null}
      </div>
      {control}
    </div>
  );
}

export function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-6 border-b border-[#282828] pb-2 text-xs font-bold tracking-widest text-white uppercase">
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
    <div className={cn("relative", disabled && "cursor-not-allowed opacity-40")}>
      <select
        className={cn(selectClass, disabled && "pointer-events-none")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white" />
    </div>
  );
}

export function SettingsLoadingState() {
  return (
    <div className="animate-in fade-in relative flex min-h-[80vh] w-full flex-col rounded-lg bg-[#121212] p-10 text-[#b3b3b3] duration-500 md:p-14">
      {/* 标题骨架 */}
      <div className="mt-4.5 mb-10 flex items-center justify-between">
        <Skeleton className="h-12 w-32 bg-white/10" />
      </div>

      <div className="grid grow grid-cols-1 items-start gap-x-16 gap-y-10 pb-20 lg:grid-cols-2">
        {/* 左侧栏骨架 */}
        <div className="flex flex-col gap-10">
          <div>
            <div className="mb-6 border-b border-[#282828] pb-2">
              <Skeleton className="h-4 w-28 bg-white/10" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-40 bg-white/10" />
                    <Skeleton className="h-3 w-64 bg-white/10" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6 border-b border-[#282828] pb-2">
              <Skeleton className="h-4 w-32 bg-white/10" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-32 bg-white/10" />
                    <Skeleton className="h-3 w-48 bg-white/10" />
                  </div>
                  <Skeleton className="h-8 w-24 bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧栏骨架 */}
        <div className="flex flex-col gap-10">
          <div>
            <div className="mb-6 border-b border-[#282828] pb-2">
              <Skeleton className="h-4 w-24 bg-white/10" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-44 bg-white/10" />
                    <Skeleton className="h-3 w-56 bg-white/10" />
                  </div>
                  <Skeleton className="h-8 w-28 bg-white/10" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6 border-b border-[#282828] pb-2">
              <Skeleton className="h-4 w-28 bg-white/10" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-36 bg-white/10" />
                    <Skeleton className="h-3 w-52 bg-white/10" />
                  </div>
                  <Skeleton className="h-8 w-20 bg-white/10" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SaveChangesButton({ visible, onClick }: { visible: boolean; onClick: () => void }) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "fixed bottom-28 left-1/2 z-50 -translate-x-1/2 transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex cursor-pointer items-center gap-2 rounded-full bg-[#1ed760] px-8 py-3.5 text-base font-bold text-black shadow-[0_8px_24px_rgba(30,215,96,0.3)] transition-all hover:scale-105 hover:bg-[#1fdf64] active:scale-100"
      >
        {t("settings.save")}
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
  const { t } = useI18n();

  if (!open) return null;

  const subtitle = isWeb
    ? t("settings.confirm.subtitle.web")
    : requiresRestart
      ? t("settings.confirm.subtitle.restart")
      : t("settings.confirm.subtitle.instant");

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex w-100 flex-col items-center rounded-xl bg-[#282828] p-8 text-center shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {t("settings.confirm.title")}
          </h2>
          <p className="text-sm text-[#b3b3b3]">{subtitle}</p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex w-full flex-col items-center justify-center rounded-full bg-[#1ed760] py-3.5 transition-all hover:scale-105 hover:bg-[#1fdf64] active:scale-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="text-base font-bold text-black">
              {isSaving ? `${t("settings.confirm.confirm")}...` : t("settings.confirm.confirm")}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full flex-col items-center justify-center rounded-full border border-[#727272] bg-transparent py-3.5 transition-all hover:scale-105 hover:border-white active:scale-100"
          >
            <span className="text-base font-bold text-white">{t("settings.confirm.cancel")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
