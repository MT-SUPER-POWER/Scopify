import { Suspense } from "react";
import type { Metadata } from "next";
import { BackgroundThemeEditorPage } from "@/components/settings/BackgroundThemeEditorPage";

export const metadata: Metadata = { title: "背景主题编辑" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BackgroundThemeEditorPage />
    </Suspense>
  );
}
