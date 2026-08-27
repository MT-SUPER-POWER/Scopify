// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import "./globals.css";
import type { Metadata } from "next";

import { I18nProvider } from "@/components/i18n-provider";
import { BackendStatusNotifier } from "@/components/backend/BackendStatusNotifier";
import { DesktopPlaybackControllerCommandHandler } from "@/components/desktopWallpaper/DesktopPlaybackControllerCommandHandler";
import { FoliaStageStoreSync } from "@/components/lyrics/FoliaStageStoreSync";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { CompanionPlaybackProjectionProvider } from "@/components/player/CompanionPlaybackProjectionProvider";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import { ThemeProvider } from "../components/theme-provider";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RESOURCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// FOR BETTER SEO
export const metadata: Metadata = {
  description: "Music Player React Project",
  title: "Scopify",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="scopify-default" suppressHydrationWarning>
      <body
        className={cn(
          "fixed inset-0 flex overflow-hidden antialiased",
          "selection:bg-brand selection:text-brand-foreground",
        )}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
          storageKey="scopify-color-mode"
        >
          <I18nProvider>
            <CompanionPlaybackProjectionProvider>
              <DesktopPlaybackControllerCommandHandler />
              <FoliaStageStoreSync />
              <QueryProvider>
                <BackendStatusNotifier />
                {children}
              </QueryProvider>
              <Toaster position="top-center" duration={3000} />
            </CompanionPlaybackProjectionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
