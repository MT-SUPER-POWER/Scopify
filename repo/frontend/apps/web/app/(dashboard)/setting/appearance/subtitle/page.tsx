import { Suspense } from "react";
import type { Metadata } from "next";
import { SubtitleThemeEditorPage } from "@/components/settings/SubtitleThemeEditorPage";

export const metadata: Metadata = { title: "字幕主题编辑" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SubtitleThemeEditorPage />
    </Suspense>
  );
}
