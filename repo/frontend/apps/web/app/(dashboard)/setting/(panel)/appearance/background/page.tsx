import type { Metadata } from "next";
import { BackgroundThemeEditorPage } from "./_components/BackgroundThemeEditorPage";

export const metadata: Metadata = { title: "背景主题编辑" };

export default function Page() {
  return <BackgroundThemeEditorPage />;
}
