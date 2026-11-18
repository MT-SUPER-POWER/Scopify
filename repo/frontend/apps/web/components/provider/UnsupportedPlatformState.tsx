"use client";

import { Ban } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Button } from "@scopify/ui/shadcn/components/button";
import type { TranslationKey } from "@/lib/i18n";
import { useActiveProviderStore } from "@/store/module/provider";
import type { MusicProvider } from "@scopify/music-domain/identity";

const PLATFORM_LABEL_KEYS: Record<MusicProvider, TranslationKey> = {
  netease: "login.platform.netease",
  qq: "login.platform.qq",
};

/**
 * What a page shows when the active platform cannot provide it. This is a product state, not
 * a request failure, so it never goes through the query error boundary and offers no retry.
 */
export function UnsupportedPlatformState() {
  const { t } = useTranslation();
  const activeProvider = useActiveProviderStore((state) => state.activeProvider);
  const platform = t(PLATFORM_LABEL_KEYS[activeProvider]);

  return (
    <div
      role="status"
      className="flex size-full min-h-80 flex-col items-center justify-center gap-4 px-6 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-content/5 text-content-muted">
        <Ban className="size-6" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold text-content">{t("layout.unsupported.title")}</h2>
        <p className="max-w-sm text-sm text-content-muted">
          {t("layout.unsupported.description", { platform })}
        </p>
      </div>
      <Button asChild variant="secondary" size="sm" className="rounded-full">
        <Link href="/setting">{t("layout.unsupported.openSettings")}</Link>
      </Button>
    </div>
  );
}
