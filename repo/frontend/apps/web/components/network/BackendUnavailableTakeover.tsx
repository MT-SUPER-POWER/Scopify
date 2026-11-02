"use client";

import { RefreshCw, ServerOff, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useBackendRestart } from "@/hooks/backend/useBackendRestart";
import { useConnectionStatus } from "@/hooks/core/useQueryRecovery";

/** 只接管主内容区：侧栏、播放器与设置保持可用，用户可以直接修复后端。 */
export function BackendUnavailableTakeover() {
  const { t } = useTranslation();
  const router = useRouter();
  const { backendError } = useConnectionStatus();
  const backend = useBackendRestart();

  return (
    <div
      role="alert"
      className="flex size-full flex-col items-center justify-center gap-5 px-8 text-center"
    >
      <span className="flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
        <ServerOff aria-hidden className="size-7" strokeWidth={1.75} />
      </span>
      <div className="max-w-md space-y-2">
        <h2 className="text-lg font-semibold text-content">
          {t("layout.backendUnavailableTitle")}
        </h2>
        <p className="text-sm leading-6 text-content-muted">
          {t("layout.backendUnavailableDescription")}
        </p>
        {backendError ? (
          <p className="mx-auto max-w-sm truncate rounded-md bg-content/5 px-3 py-1.5 font-mono text-xs text-content-muted">
            {backendError}
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => router.push("/setting")}
        >
          <Settings aria-hidden className="size-3.5" />
          {t("network.recovery.backendSettings")}
        </Button>
        <Button
          size="sm"
          className="gap-2 rounded-full"
          disabled={backend.isRestarting}
          onClick={() => void backend.restart()}
        >
          <RefreshCw
            aria-hidden
            className={backend.isRestarting ? "size-3.5 animate-spin" : "size-3.5"}
          />
          {t("network.recovery.restartBackend")}
        </Button>
      </div>
    </div>
  );
}
