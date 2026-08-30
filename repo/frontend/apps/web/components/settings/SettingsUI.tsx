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
import { Skeleton } from "@scopify/ui/shadcn/components/skeleton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";
import type { SaveConfirmModalProps } from "@/types/components/settings";

const selectClass =
  "w-full border-input text-foreground hover:border-content focus:ring-ring cursor-pointer appearance-none rounded border bg-transparent py-2 pr-10 pl-4 text-sm font-medium transition-colors outline-none focus:ring-1";

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
          "pointer-events-none inline-block size-5 transform rounded-full bg-content shadow ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function SettingInput({
  value,
  onChange,
  onBlur,
  type = "text",
  className = "w-28",
  disabled = false,
  placeholder,
  align,
  isInvalid = false,
}: {
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  type?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  align?: "left" | "right";
  isInvalid?: boolean;
}) {
  const textAlign = align ?? (type === "number" ? "right" : "left");

  return (
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      className={cn(
        "rounded border border-input bg-transparent px-3 py-1.5 text-sm font-medium text-foreground transition-colors outline-none placeholder:text-content-subtle hover:border-content focus:border-ring focus:ring-1 focus:ring-ring",
        textAlign === "right" ? "text-right" : "text-left",
        isInvalid &&
          "border-danger text-danger hover:border-danger focus:border-danger focus:ring-danger",
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
  className,
}: {
  label: React.ReactNode;
  sublabel?: string;
  control: React.ReactNode;
  isColumn?: boolean;
  requiresRestart?: boolean;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "mb-6 flex w-full",
        isColumn ? "flex-col items-start gap-3" : "items-center justify-between gap-6",
        className,
      )}
    >
      <div className={cn("flex flex-col gap-1", isColumn ? "w-full" : "min-w-0 flex-1")}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-base font-medium text-foreground">{label}</span>
          {requiresRestart ? (
            <span className="inline-flex items-center gap-1 rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-xs font-medium text-warning">
              <RotateCcw className="size-2.5" />
              {t("settings.restartRequired")}
            </span>
          ) : null}
        </div>
        {sublabel ? (
          <span className="text-sm leading-relaxed break-words text-muted-foreground">
            {sublabel}
          </span>
        ) : null}
      </div>
      <div className={cn(isColumn ? "w-full" : "shrink-0")}>{control}</div>
    </div>
  );
}

export function SettingSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-6 border-b border-border pb-2 text-xs font-bold tracking-widest text-foreground uppercase">
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
  className,
  disabled = false,
}: {
  value: string | number;
  onChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative",
        className ?? "w-fit min-w-30",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <select
        className={cn(selectClass, disabled && "pointer-events-none")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-content" />
    </div>
  );
}

export function SettingsLoadingState() {
  return (
    <div className="relative flex min-h-[80vh] w-full animate-in flex-col rounded-lg bg-surface-raised p-10 text-muted-foreground duration-500 fade-in md:p-14">
      {/* 标题骨架 */}
      <div className="mt-4.5 mb-10 flex items-center justify-between">
        <Skeleton className="h-12 w-32 bg-skeleton" />
      </div>

      <div className="grid grow grid-cols-1 items-start gap-x-16 gap-y-10 pb-20 lg:grid-cols-2">
        {/* 左侧栏骨架 */}
        <div className="flex flex-col gap-10">
          <div>
            <div className="mb-6 border-b border-border pb-2">
              <Skeleton className="h-4 w-28 bg-skeleton" />
            </div>
            <div className="space-y-6">
              {[1, 2, 3].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-40 bg-skeleton" />
                    <Skeleton className="h-3 w-64 bg-skeleton" />
                  </div>
                  <Skeleton className="h-6 w-11 rounded-full bg-skeleton" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6 border-b border-border pb-2">
              <Skeleton className="h-4 w-32 bg-skeleton" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-32 bg-skeleton" />
                    <Skeleton className="h-3 w-48 bg-skeleton" />
                  </div>
                  <Skeleton className="h-8 w-24 bg-skeleton" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧栏骨架 */}
        <div className="flex flex-col gap-10">
          <div>
            <div className="mb-6 border-b border-border pb-2">
              <Skeleton className="h-4 w-24 bg-skeleton" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-44 bg-skeleton" />
                    <Skeleton className="h-3 w-56 bg-skeleton" />
                  </div>
                  <Skeleton className="h-8 w-28 bg-skeleton" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-6 border-b border-border pb-2">
              <Skeleton className="h-4 w-28 bg-skeleton" />
            </div>
            <div className="space-y-6">
              {[1, 2].map((id) => (
                <div key={id} className="flex items-center justify-between">
                  <div className="max-w-[70%] flex-1 space-y-1.5">
                    <Skeleton className="h-5 w-36 bg-skeleton" />
                    <Skeleton className="h-3 w-52 bg-skeleton" />
                  </div>
                  <Skeleton className="h-8 w-20 bg-skeleton" />
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
        className="flex cursor-pointer items-center gap-2 rounded-full bg-brand px-8 py-3.5 text-base font-bold text-brand-foreground shadow-brand transition-all hover:scale-105 hover:bg-brand-hover active:scale-100"
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
        className="w-100 rounded-xl border-none bg-surface-overlay p-8 text-center shadow-floating"
        overlayClassName="backdrop-blur-sm"
      >
        <AlertDialogHeader className="mb-8 w-full space-y-2 text-center sm:place-items-center sm:text-center">
          <AlertDialogTitle className="text-2xl font-bold tracking-tight text-foreground">
            {t("settings.confirm.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {subtitle}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex w-full flex-col gap-4 sm:flex-col">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="flex w-full flex-col items-center justify-center rounded-full bg-brand py-3.5 transition-all hover:scale-105 hover:bg-brand-hover active:scale-100 disabled:opacity-50 disabled:hover:scale-100"
          >
            <span className="text-base font-bold text-brand-foreground">
              {isSaving ? `${t("settings.confirm.confirm")}...` : t("settings.confirm.confirm")}
            </span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex w-full flex-col items-center justify-center rounded-full border border-input bg-transparent py-3.5 text-foreground transition-all hover:scale-105 hover:border-content active:scale-100"
          >
            <span className="text-base font-bold">{t("settings.confirm.cancel")}</span>
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
