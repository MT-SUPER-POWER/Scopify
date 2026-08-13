"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import type React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SaveConfirmModalProps } from "@/types/components/settings";

const selectClass =
  "border-input text-foreground hover:border-content focus:ring-ring cursor-pointer appearance-none rounded border bg-transparent py-2 pr-10 pl-4 text-sm font-medium transition-colors outline-none focus:ring-1";

export function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
        enabled ? "bg-brand hover:bg-brand-hover" : "bg-muted hover:bg-accent",
      )}
    >
      <span
        className={cn(
          "bg-content pointer-events-none inline-block size-5 transform rounded-full shadow ring-0 transition duration-200 ease-in-out",
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
        "border-input text-foreground placeholder:text-content-subtle hover:border-content focus:border-ring focus:ring-ring rounded border bg-transparent px-3 py-1.5 text-right text-sm font-medium transition-colors outline-none focus:ring-1",
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
          <span className="text-foreground text-base font-medium">{label}</span>
          {requiresRestart ? (
            <span className="border-warning/40 bg-warning/10 text-warning inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium">
              <RotateCcw className="size-2.5" />
              {t("settings.restartRequired")}
            </span>
          ) : null}
        </div>
        {sublabel ? (
          <span className="text-muted-foreground text-sm leading-relaxed">{sublabel}</span>
        ) : null}
      </div>
      {control}
    </div>
  );
}

export function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-foreground border-border mb-6 border-b pb-2 text-xs font-bold tracking-widest uppercase">
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
      <ChevronDown className="text-content pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
    </div>
  );
}

export function SettingsLoadingState() {
  return (
    <div className="bg-surface-raised text-muted-foreground animate-in fade-in relative flex min-h-[80vh] w-full flex-col rounded-lg p-10 duration-500 md:p-14">
      {/* 标题骨架 */}
      <div className="mt-4.5 mb-10 flex items-center justify-between">
        <Skeleton className="bg-skeleton h-12 w-32" />
      </div>

      <div className="grid grow grid-cols-1 items-start gap-x-16 gap-y-10 pb-20 lg:grid-cols-2">
        {/* 左侧栏骨架 */}
        <div className="flex flex-col gap-10">
          <div>
            <div className="border-border mb-6 border-b pb-2">
              <Skeleton className="bg-skeleton h-4 w-28" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="bg-skeleton h-5 w-40" />
                    <Skeleton className="bg-skeleton h-3 w-64" />
                  </div>
                  <Skeleton className="bg-skeleton h-6 w-11 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="border-border mb-6 border-b pb-2">
              <Skeleton className="bg-skeleton h-4 w-32" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="bg-skeleton h-5 w-32" />
                    <Skeleton className="bg-skeleton h-3 w-48" />
                  </div>
                  <Skeleton className="bg-skeleton h-8 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧栏骨架 */}
        <div className="flex flex-col gap-10">
          <div>
            <div className="border-border mb-6 border-b pb-2">
              <Skeleton className="bg-skeleton h-4 w-24" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="bg-skeleton h-5 w-44" />
                    <Skeleton className="bg-skeleton h-3 w-56" />
                  </div>
                  <Skeleton className="bg-skeleton h-8 w-28" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="border-border mb-6 border-b pb-2">
              <Skeleton className="bg-skeleton h-4 w-28" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="bg-skeleton h-5 w-36" />
                    <Skeleton className="bg-skeleton h-3 w-52" />
                  </div>
                  <Skeleton className="bg-skeleton h-8 w-20" />
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
        className="bg-brand text-brand-foreground shadow-brand hover:bg-brand-hover flex cursor-pointer items-center gap-2 rounded-full px-8 py-3.5 text-base font-bold transition-all hover:scale-105 active:scale-100"
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
}: SaveConfirmModalProps) {
  const { t } = useI18n();

  const subtitle = isWeb
    ? t("settings.confirm.subtitle.web")
    : requiresRestart
      ? t("settings.confirm.subtitle.restart")
      : t("settings.confirm.subtitle.instant");

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <AlertDialogContent
        className="bg-surface-overlay shadow-floating w-100 rounded-xl border-none p-8 text-center"
        overlayClassName="backdrop-blur-sm"
      >
        <AlertDialogHeader className="mb-8 w-full space-y-2 text-center sm:place-items-center sm:text-center">
          <AlertDialogTitle className="text-foreground text-2xl font-bold tracking-tight">
            {t("settings.confirm.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm">
            {subtitle}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex w-full flex-col gap-4 sm:flex-col">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-brand hover:bg-brand-hover flex w-full flex-col items-center justify-center rounded-full py-3.5 transition-all hover:scale-105 active:scale-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="text-brand-foreground text-base font-bold">
              {isSaving ? `${t("settings.confirm.confirm")}...` : t("settings.confirm.confirm")}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="border-input hover:border-content text-foreground flex w-full flex-col items-center justify-center rounded-full border bg-transparent py-3.5 transition-all hover:scale-105 active:scale-100"
          >
            <span className="text-base font-bold">{t("settings.confirm.cancel")}</span>
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
