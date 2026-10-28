"use client";

import { useState } from "react";
import { Button } from "@scopify/ui/shadcn/components/button";
import { useI18n } from "@/store/module/i18n";
import type { SheetPageImageProps } from "@/types/songResources/components";

export function SheetPageImage({ url, label }: SheetPageImageProps) {
  const { t } = useI18n();
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-sm text-content-muted">
      <p>
        {label} · {t("songResources.imageError")}
      </p>
      <Button variant="secondary" size="sm" onClick={() => setFailed(false)}>
        {t("common.action.retry")}
      </Button>
    </div>
  ) : (
    <img
      src={url}
      alt={label}
      loading="lazy"
      onError={() => setFailed(true)}
      className="mx-auto h-auto w-full rounded-lg bg-white"
    />
  );
}
