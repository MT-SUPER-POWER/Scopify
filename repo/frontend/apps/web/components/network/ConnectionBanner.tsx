"use client";

import { AlertTriangle, CloudOff, RefreshCw, ServerOff, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useBackendRestart } from "@/hooks/backend/useBackendRestart";
import {
  useBackendTakeover,
  useConnectionStatus,
  useRetryCountdown,
} from "@/hooks/core/useQueryRecovery";
import { isConnectionNoticeVisible, queryRecovery } from "@/lib/query/recovery";
import { runtime } from "@/lib/runtime";
import { cn } from "@/lib/utils";
import type { ConnectionSnapshot } from "@/types/query/recovery";
import type { ConnectionNoticeActionProps } from "@/types/network/components";

/** 连接问题的唯一提示：位于顶栏与内容区之间，展开时推开内容而不遮挡。 */
export function ConnectionBanner() {
  const status = useConnectionStatus();
  const isTakeover = useBackendTakeover();
  const isVisible = isConnectionNoticeVisible(status.phase) && !isTakeover;
  // 收起动画期间保留最后一次的内容，避免文字先消失。
  const lastVisible = useRef(status);
  if (isVisible) lastVisible.current = status;

  return (
    <div
      aria-hidden={!isVisible}
      className={cn(
        "grid transition-[grid-template-rows,margin,opacity] duration-300 ease-out",
        isVisible ? "grid-rows-[1fr] opacity-100" : "-mt-2 grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <ConnectionNotice status={lastVisible.current} />
      </div>
    </div>
  );
}

function ConnectionNotice({ status }: { status: ConnectionSnapshot }) {
  const { t } = useTranslation();
  const router = useRouter();
  const seconds = useRetryCountdown(status.retryAt);
  const backend = useBackendRestart();
  const tone = status.phase === "backend" ? "danger" : "warning";
  const openBackendSettings = () => router.push("/setting");
  const retryIn = seconds === null ? null : t("network.recovery.retryIn", { seconds });

  const content = {
    offline: {
      Icon: WifiOff,
      title: t("network.recovery.offline.title"),
      detail: t("network.recovery.offline.detail"),
    },
    degraded: {
      Icon: CloudOff,
      title: t("network.recovery.degraded.title"),
      detail: retryIn,
    },
    persistent: {
      Icon: AlertTriangle,
      title: t("network.recovery.persistent.title"),
      detail: [t("network.recovery.persistent.detail"), retryIn].filter(Boolean).join(" · "),
    },
    backend: {
      Icon: ServerOff,
      title: t("layout.backendUnavailableTitle"),
      detail: status.backendError,
    },
  }[status.phase === "ok" || status.phase === "pending" ? "degraded" : status.phase];
  const isBusy = status.isProbing || backend.isRestarting;
  const Icon = isBusy ? RefreshCw : content.Icon;
  const detail = status.isProbing ? t("network.recovery.reconnecting") : content.detail;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-10 items-center gap-3 rounded-lg px-3.5 py-1.5 text-sm ring-1 ring-inset",
        tone === "danger"
          ? "bg-danger/10 text-danger ring-danger/20"
          : "bg-warning/10 text-warning ring-warning/20",
      )}
    >
      <Icon aria-hidden className={cn("size-4 shrink-0", isBusy && "animate-spin")} />
      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="shrink-0 font-medium">{content.title}</span>
        {detail ? <span className="truncate text-xs text-content-muted">{detail}</span> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {status.phase === "backend" ? (
          <>
            <NoticeAction tone={tone} onClick={openBackendSettings}>
              {t("network.recovery.backendSettings")}
            </NoticeAction>
            <NoticeAction
              tone={tone}
              emphasis
              isBusy={backend.isRestarting}
              onClick={() => void backend.restart()}
            >
              {t("network.recovery.restartBackend")}
            </NoticeAction>
          </>
        ) : null}
        {status.phase === "persistent" && runtime.isDesktop ? (
          <NoticeAction tone={tone} onClick={openBackendSettings}>
            {t("network.recovery.backendSettings")}
          </NoticeAction>
        ) : null}
        {status.phase === "degraded" || status.phase === "persistent" ? (
          <NoticeAction
            tone={tone}
            emphasis
            isBusy={status.isProbing}
            onClick={() => void queryRecovery.retryNow()}
          >
            {t("network.recovery.retryNow")}
          </NoticeAction>
        ) : null}
      </div>
    </div>
  );
}

function NoticeAction({ children, emphasis, isBusy, onClick, tone }: ConnectionNoticeActionProps) {
  return (
    <button
      type="button"
      disabled={isBusy}
      onClick={onClick}
      className={cn(
        "h-7 rounded-full px-3 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60",
        emphasis
          ? tone === "danger"
            ? "bg-danger/15 hover:bg-danger/25"
            : "bg-warning/15 hover:bg-warning/25"
          : "text-content-muted hover:bg-content/5 hover:text-content",
      )}
    >
      {children}
    </button>
  );
}
