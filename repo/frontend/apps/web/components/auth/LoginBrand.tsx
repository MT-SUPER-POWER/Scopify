"use client";

import { ScopifyBrand } from "@/components/shared/ScopifyBrand";
import { useI18n } from "@/store/module/i18n";

export function LoginBrand() {
  const { t } = useI18n();

  return (
    <div className="mb-6 flex flex-col items-center">
      <ScopifyBrand
        priority
        className="mb-3 h-14 gap-3"
        iconClassName="size-12"
        wordmarkClassName="text-2xl"
      />
      <p className="text-xs font-medium text-content-subtle">{t("login.page.tagline")}</p>
    </div>
  );
}
