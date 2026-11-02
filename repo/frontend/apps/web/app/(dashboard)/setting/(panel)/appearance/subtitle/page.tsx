import type { Metadata } from "next";
import { SubtitleThemeEditorPage } from "./_components/SubtitleThemeEditorPage";

export const metadata: Metadata = { title: "字幕主题编辑" };

export default function Page() {
  return <SubtitleThemeEditorPage />;
}
