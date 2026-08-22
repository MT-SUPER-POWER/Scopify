import type { Metadata } from "next";

import { ThemePrototypePage } from "@/components/theme-prototype/theme-prototype-page";

export const metadata: Metadata = {
  title: "Scopify Theme Lab",
  description: "独立调整 Shadcn Token、实时预览并导出主题 CSS。",
};

export default function ThemeEditorRoute() {
  return <ThemePrototypePage />;
}
