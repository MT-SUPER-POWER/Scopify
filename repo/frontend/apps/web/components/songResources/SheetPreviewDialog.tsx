"use client";

import { FileMusic, LockKeyhole } from "lucide-react";
import { Button } from "@scopify/ui/shadcn/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@scopify/ui/shadcn/components/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QueryBoundary } from "@/components/shared/QueryBoundary";
import { QueryPending } from "@/components/shared/QueryPending";
import { QuietState } from "@/components/shared/QuietState";
import { useAuth } from "@/hooks/auth/useAuth";
import { useSheetPreviewQuery } from "@/hooks/song/useSongResources";
import { useRequireLoginAction } from "@/hooks/auth/useRequireLoginAction";
import { useTranslation } from "react-i18next";

import type {
  SheetPreviewContentProps,
  SheetPreviewDialogProps,
} from "@/types/songResources/components";
import { SheetPageImage } from "./SheetPageImage";

export function SheetPreviewDialog({ sheet, onClose }: SheetPreviewDialogProps) {
  const { t } = useTranslation();
  const { userId, isAuthenticated } = useAuth();
  return (
    <Dialog
      open={Boolean(sheet)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="flex h-[85dvh] flex-col overflow-hidden p-0 sm:max-w-4xl">
        <header className="shrink-0 border-b border-border px-6 py-5 pr-12">
          <DialogTitle>{sheet?.name || t("songResources.preview")}</DialogTitle>
          <DialogDescription className="mt-2">
            {t("songResources.preview")}
            {sheet?.totalPageSize
              ? ` · ${t("songResources.pages", { count: sheet.totalPageSize })}`
              : ""}
          </DialogDescription>
        </header>
        <ScrollArea
          className="min-h-0 flex-1"
          viewportClassName="overscroll-contain [&>div]:!block [&>div]:!min-w-0 [&>div]:!w-full"
        >
          <div className="p-4 sm:p-6">
            {sheet ? (
              <QueryBoundary
                compact
                resetKey={`sheet-preview:${sheet.id}:${isAuthenticated ? userId : "guest"}`}
              >
                <SheetPreviewContent sheet={sheet} />
              </QueryBoundary>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
function SheetPreviewContent({ sheet }: SheetPreviewContentProps) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const requireLogin = useRequireLoginAction();
  const query = useSheetPreviewQuery(sheet.id);
  if (!isAuthenticated)
    return (
      <QuietState
        compact
        icon={LockKeyhole}
        title={t("songResources.loginRequired")}
        action={
          <Button onClick={() => void requireLogin(() => undefined)}>
            {t("songResources.login")}
          </Button>
        }
      />
    );
  if (query.data === undefined) return <QueryPending isPaused={query.fetchStatus === "paused"} />;
  if (query.data.length === 0)
    return <QuietState compact icon={FileMusic} title={t("songResources.previewEmpty")} />;
  return (
    <div className="space-y-5">
      {query.data.map((url, index) => (
        <SheetPageImage
          key={`${index}-${url}`}
          url={url}
          label={t("songResources.page", { page: index + 1 })}
        />
      ))}
    </div>
  );
}
