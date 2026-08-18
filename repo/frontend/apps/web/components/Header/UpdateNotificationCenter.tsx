"use client";

import { useEffect, useState } from "react";
import { Bell, BellRing, CircleAlert, Download, Rocket } from "lucide-react";
import { UPDATE_SEEN_VERSION_KEY } from "@/constants/updater";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppUpdater } from "@/hooks/settings/useAppUpdater";
import { useSmartRouter } from "@/lib/hooks/useSmartRouter";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import { useI18n } from "@/store/module/i18n";

// Turns the header bell into the renderer-facing update lifecycle notification center.
const UPDATE_NOTICE_STATUSES = new Set(["available", "downloading", "downloaded"]);

export function UpdateNotificationCenter() {
  const { t } = useI18n();
  const router = useSmartRouter();
  const { state, install } = useAppUpdater();
  const [seenVersion, setSeenVersion] = useState<string | null>(null);

  useEffect(() => {
    setSeenVersion(localStorage.getItem(UPDATE_SEEN_VERSION_KEY));
  }, []);

  const hasUpdateNotice = UPDATE_NOTICE_STATUSES.has(state.status) && Boolean(state.version);
  const hasUnreadUpdate = hasUpdateNotice && seenVersion !== state.version;
  const hasStatusNotice =
    hasUpdateNotice || state.status === "checking" || state.status === "error";

  const handleOpenChange = (open: boolean) => {
    if (!open || !hasUpdateNotice || !state.version) return;
    localStorage.setItem(UPDATE_SEEN_VERSION_KEY, state.version);
    setSeenVersion(state.version);
  };

  const openUpdaterSettings = () => {
    router.push(runtime.isDesktop ? "/setting?tab=desktop#app-updater" : "/setting");
  };

  const noticeTitle =
    state.status === "available"
      ? t("notifications.updater.available.title")
      : state.status === "downloading"
        ? t("notifications.updater.downloading.title")
        : state.status === "downloaded"
          ? t("notifications.updater.downloaded.title")
          : state.status === "checking"
            ? t("notifications.updater.checking.title")
            : t("notifications.updater.error.title");

  const noticeDescription =
    state.status === "downloading"
      ? t("notifications.updater.downloading.description", {
          percent: Math.round(state.percent ?? 0),
        })
      : state.status === "downloaded"
        ? t("notifications.updater.downloaded.description", { version: state.version ?? "" })
        : state.status === "checking"
          ? t("notifications.updater.checking.description")
          : state.status === "error"
            ? state.message || t("notifications.updater.error.description")
            : t("notifications.updater.available.description", { version: state.version ?? "" });

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("notifications.title")}
          className={cn(
            "relative hidden size-10 items-center justify-center rounded-full bg-surface-sunken/80 text-content-muted transition-all hover:bg-surface-elevated hover:text-content md:flex",
            hasUnreadUpdate && "text-brand",
          )}
        >
          <Bell className="size-4.5" />
          {hasUnreadUpdate ? (
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-brand ring-2 ring-surface" />
          ) : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-88 rounded-2xl border border-border bg-surface-overlay/95 p-0 text-content shadow-floating backdrop-blur-2xl"
      >
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold">{t("notifications.title")}</h2>
        </div>
        {hasStatusNotice ? (
          <div className="p-4">
            <div className="flex items-start gap-3 rounded-xl bg-surface-elevated p-3">
              <div className="mt-0.5 rounded-full bg-brand/15 p-2 text-brand">
                {state.status === "error" ? (
                  <CircleAlert className="size-4" />
                ) : state.status === "downloaded" ? (
                  <Rocket className="size-4" />
                ) : (
                  <Download className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-content">{noticeTitle}</p>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {noticeDescription}
                </p>
                {state.status === "downloading" ? (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-skeleton">
                    <div
                      className="h-full rounded-full bg-brand transition-[width]"
                      style={{ width: `${Math.min(100, Math.max(0, state.percent ?? 0))}%` }}
                    />
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={state.status === "downloaded" ? install : openUpdaterSettings}
                  className="mt-3 text-xs font-bold text-brand hover:text-brand-hover"
                >
                  {state.status === "downloaded"
                    ? t("notifications.updater.install")
                    : t("notifications.updater.openSettings")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <BellRing className="size-8 text-content-subtle" />
            <p className="mt-3 text-sm font-semibold text-content-muted">
              {t("notifications.empty.title")}
            </p>
            <p className="mt-1 text-xs text-content-subtle">
              {t("notifications.empty.description")}
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
