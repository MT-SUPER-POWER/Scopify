// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ PACKAGE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import "./globals.css";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MainLayout from "../components/MainLayout";
import { ThemeProvider } from "../components/theme-provider";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ RESOURCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// FOR BETTER SEO
export const metadata: Metadata = {
  title: "Scopify",
  description: "Music Player React Project",
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ UI ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable}`,
          `antialiased h-screen w-screen overflow-hidden flex`,
          `min-h-180 min-w-200`,
        )}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* NOTE: 这个地方是我们自己写的组件，作为 template layout，其他子内容替换这个 children 作为总入口 */}
          <MainLayout>{children}</MainLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
