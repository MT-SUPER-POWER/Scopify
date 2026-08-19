import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RootProvider } from "fumadocs-ui/provider/next";

import scopifyLogo from "@/assets/logo.png";
import { DOCS_UI_TRANSLATIONS } from "@/constants/docs-translations";

import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Scopify Docs", template: "%s · Scopify Docs" },
  description: "Scopify 的产品、开发、架构与共享资产文档。",
  icons: {
    icon: scopifyLogo.src,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider i18n={{ locale: "zh-CN", translations: DOCS_UI_TRANSLATIONS }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
