"use client";

import { AlertTriangle, CloudOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { QueryFailure } from "@/components/shared/QueryFailure";
import { getQueryFailureKind } from "@/lib/query/errorPolicy";
import type { SidebarPlaylistFailureProps } from "@/types/sidebar/components";
import { SidebarLibraryStateCard } from "./SidebarLibraryStateCard";

export function SidebarPlaylistFailure({ isCollapsed, ...props }: SidebarPlaylistFailureProps) {
  const { t } = useTranslation();
  if (!isCollapsed) return <QueryFailure {...props} compact />;
  return (
    <SidebarLibraryStateCard
      isCollapsed
      icon={getQueryFailureKind(props.error) === "network" ? CloudOff : AlertTriangle}
      title={t("sidebar.card.loadFailed")}
      subtitle={t("network.offline.subtitle")}
      actionLabel={t("common.action.retry")}
      onAction={props.onRetry}
    />
  );
}
