"use client";

import type { ReactNode } from "react";
import { MvPageProvider } from "./MvPageProvider";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { useMvId } from "@/hooks/mv/useMvId";
import { useI18n } from "@/store/module/i18n";

/** MV 主详情边界：id 无效显示空状态，详情首次取不到时整页进入错误态。 */
export function MvDetailBoundary({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const mvid = useMvId();
  if (!mvid)
    return (
      <p className="flex min-h-[60vh] items-center justify-center text-content-muted">
        {t("mv.status.invalid")}
      </p>
    );
  return (
    <QueryBoundary resetKey={`mv:detail:${mvid}`}>
      <MvPageProvider mvid={mvid}>{children}</MvPageProvider>
    </QueryBoundary>
  );
}
