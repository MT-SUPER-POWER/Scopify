"use client";

import { ScopifyBrand } from "@/components/shared/ScopifyBrand";
import { useTranslation } from "react-i18next";

export function LoginBrand() {
  const { t } = useTranslation();

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
