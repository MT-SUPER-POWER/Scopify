"use client";

import "./globals.css";

import { ErrorFallback } from "@/components/shared/ErrorFallback";
import { useI18n } from "@/store/module/i18n";
import type { ErrorFallbackProps } from "@/types/components/error";

export default function GlobalError({ error, reset }: ErrorFallbackProps) {
  const { locale, t } = useI18n();

  return (
    <html lang={locale} data-theme="scopify-default" suppressHydrationWarning>
      <body className="fixed inset-0 overflow-hidden antialiased" suppressHydrationWarning>
        <title>{`${t("errorPage.unexpected.title")} | Scopify`}</title>
        <ErrorFallback error={error} reset={reset} />
      </body>
    </html>
  );
}
