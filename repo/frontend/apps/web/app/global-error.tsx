"use client";

import "./globals.css";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useTranslation } from "react-i18next";
import { useI18nStore } from "@/store/module/i18n";
import type { ErrorFallbackProps } from "@/types/shared/errorComponents";

export default function GlobalError({ error, reset }: ErrorFallbackProps) {
  const { t } = useTranslation(),
    locale = useI18nStore((state) => state.locale);

  return (
    <html lang={locale} data-theme="scopify-default" suppressHydrationWarning>
      <body className="fixed inset-0 overflow-hidden antialiased" suppressHydrationWarning>
        <title>{`${t("errorPage.unexpected.title")} | Scopify`}</title>
        <ErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}
